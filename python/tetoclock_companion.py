"""Pair a USB-connected Uno Q and record physical alarm dismissals."""

import argparse
import json
import os
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import keyring

from elevenlabs_api import generate_speech
from uno_q_bridge import UnoQBridge, find_adb


KEYRING_SERVICE = "TETO'Clock"
MAX_ALARM_DURATION_SECONDS = 120


def api_base_url(argument: str | None) -> str:
    value = (argument or os.getenv("TETOCLOCK_API_URL") or "").rstrip("/")
    if not value:
        raise ValueError(
            "Provide --api-url or set TETOCLOCK_API_URL to your TETO'Clock website URL."
        )

    parsed = urlparse(value)
    local_hosts = {"localhost", "127.0.0.1", "::1"}
    if parsed.scheme != "https" and parsed.hostname not in local_hosts:
        raise ValueError("Use HTTPS for the companion URL except for localhost development.")
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("The companion URL must be a valid HTTP or HTTPS URL.")
    return value


def request_json(
    base_url: str,
    path: str,
    *,
    payload: dict[str, object] | None = None,
    token: str | None = None,
) -> dict[str, object]:
    headers = {"Accept": "application/json"}
    body = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(payload).encode("utf-8")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = urllib.request.Request(
        f"{base_url}{path}",
        data=body,
        headers=headers,
        method="POST" if payload is not None else "GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        try:
            response_body = json.loads(error.read().decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            response_body = {}
        message = (
            response_body.get("error")
            if isinstance(response_body, dict)
            else None
        )
        raise RuntimeError(
            str(message) if isinstance(message, str) else f"TETO'Clock API returned HTTP {error.code}."
        ) from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"Could not reach the TETO'Clock API: {error.reason}") from error
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise RuntimeError("TETO'Clock API returned an invalid response.") from error

    if not isinstance(result, dict):
        raise RuntimeError("TETO'Clock API returned an invalid response.")
    return result


def pair_device(args: argparse.Namespace) -> None:
    base_url = api_base_url(args.api_url)
    bridge = UnoQBridge(find_adb(args.adb_path), args.adb_serial)
    bridge.connect()
    if not bridge.device_serial:
        raise RuntimeError("ADB did not identify the connected Uno Q.")

    result = request_json(
        base_url,
        "/api/companion/pair",
        payload={"code": args.code, "deviceSerial": bridge.device_serial},
    )
    device_id = result.get("deviceId")
    token = result.get("deviceToken")
    name = result.get("deviceName")
    if not (
        isinstance(device_id, str)
        and device_id
        and isinstance(token, str)
        and token
        and isinstance(name, str)
        and name
    ):
        raise RuntimeError("Pairing succeeded but the API response was incomplete.")

    try:
        keyring.set_password(KEYRING_SERVICE, device_id, token)
    except keyring.errors.KeyringError as error:
        raise RuntimeError(
            "Windows Credential Manager could not store the clock token. "
            "No token was printed; check Credential Manager access and pair again."
        ) from error

    print(f"Paired {name} ({device_id}) to USB/ADB device {bridge.device_serial}.")
    print("The device token was saved in Windows Credential Manager.")


def run_alarm(args: argparse.Namespace) -> None:
    base_url = api_base_url(args.api_url)
    try:
        token = keyring.get_password(KEYRING_SERVICE, args.device_id)
    except keyring.errors.KeyringError as error:
        raise RuntimeError(
            "Windows Credential Manager could not read the clock token. "
            "Check Credential Manager access and pair the clock again if needed."
        ) from error
    if not token:
        raise RuntimeError(
            "No saved token for this clock. Pair it first with the dashboard's pairing code."
        )

    result = request_json(
        base_url,
        f"/api/companion/{args.device_id}/settings",
        token=token,
    )
    settings = result.get("settings")
    device = result.get("device")
    if not isinstance(settings, dict) or not isinstance(device, dict):
        raise RuntimeError("The clock settings response was incomplete.")
    if settings.get("messageMode") != "script":
        raise RuntimeError(
            "This prototype can speak exact text only. Voice-style prompts are saved "
            "to the clock but need a separate prompt-to-speech integration."
        )

    text = settings.get("message")
    volume = settings.get("volume")
    if not isinstance(text, str) or not text.strip():
        raise RuntimeError("This clock has no alarm text configured.")
    if not isinstance(volume, int) or not 0 <= volume <= 100:
        raise RuntimeError("This clock has an invalid volume setting.")

    clip = generate_speech(text)
    if not 0 < clip.duration_ms <= MAX_ALARM_DURATION_SECONDS * 1000:
        raise RuntimeError("The generated voice clip must be 120 seconds or shorter.")

    try:
        import pygame
    except ImportError as error:
        raise RuntimeError(
            "pygame is required for looping alarm playback. Install python/requirements.txt."
        ) from error

    bridge = UnoQBridge(find_adb(args.adb_path), args.adb_serial)
    bridge.connect()
    if bridge.device_serial != device.get("deviceSerial"):
        raise RuntimeError(
            "The connected Uno Q does not match this clock's paired USB device. "
            "Select the correct board with --adb-serial."
        )
    bridge.deploy_and_start_app()
    audio_started = False
    mixer_started = False
    dismissed_at: datetime | None = None
    alarm_started_at = datetime.now(timezone.utc)

    try:
        bridge.send_command("START", MAX_ALARM_DURATION_SECONDS * 1000)
        pygame.mixer.init(frequency=22050, size=-16, channels=1)
        mixer_started = True
        pygame.mixer.music.load(str(clip.path))
        pygame.mixer.music.set_volume(volume / 100)
        pygame.mixer.music.play(-1)
        audio_started = True
        alarm_started_at = datetime.now(timezone.utc)
        print("Alarm is ringing. Press the clock's physical dismiss button to stop it.")

        deadline = time.monotonic() + MAX_ALARM_DURATION_SECONDS
        while time.monotonic() < deadline:
            if bridge.send_command("POLL") == "DISMISSED":
                dismissed_at = datetime.now(timezone.utc)
                break
            time.sleep(0.2)

        if dismissed_at is None:
            raise TimeoutError("The alarm reached the 120-second hardware safety limit.")
    finally:
        try:
            if audio_started:
                pygame.mixer.music.stop()
        finally:
            try:
                if mixer_started:
                    pygame.mixer.quit()
            finally:
                try:
                    bridge.send_command("STOP")
                finally:
                    bridge.stop_app()

    session_id = str(uuid.uuid4())
    request_json(
        base_url,
        f"/api/companion/{args.device_id}/sessions",
        payload={
            "sessionId": session_id,
            "startedAt": alarm_started_at.isoformat(),
            "dismissedAt": dismissed_at.isoformat(),
        },
        token=token,
    )
    elapsed = (dismissed_at - alarm_started_at).total_seconds()
    print(f"Recorded a {elapsed:.1f}-second alarm response for clock {args.device_id}.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    pair = subparsers.add_parser("pair", help="Pair a connected Uno Q using a one-time code.")
    pair.add_argument("--code", required=True, help="One-time code from the signed-in dashboard.")
    pair.add_argument("--api-url", help="Website URL; defaults to TETOCLOCK_API_URL.")
    pair.add_argument("--adb-path", type=Path, help="Optional path to adb.exe.")
    pair.add_argument("--adb-serial", help="Optional serial from adb devices -l.")
    pair.set_defaults(handler=pair_device)

    alarm = subparsers.add_parser("alarm", help="Run one alarm and record its button dismissal.")
    alarm.add_argument("--device-id", required=True, help="Clock ID shown on the dashboard.")
    alarm.add_argument("--api-url", help="Website URL; defaults to TETOCLOCK_API_URL.")
    alarm.add_argument("--adb-path", type=Path, help="Optional path to adb.exe.")
    alarm.add_argument("--adb-serial", help="Optional serial from adb devices -l.")
    alarm.set_defaults(handler=run_alarm)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    try:
        args.handler(args)
    except (OSError, RuntimeError, TimeoutError, ValueError) as error:
        raise SystemExit(str(error)) from error


if __name__ == "__main__":
    main()
