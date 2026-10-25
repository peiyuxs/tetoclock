import argparse
import shutil
import subprocess
import sys
import time
import uuid
import winsound
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from elevenlabs_api import TEST_TEXT, generate_speech


PROJECT_ROOT = Path(__file__).resolve().parents[2]
APP_SOURCE = PROJECT_ROOT / "board_app"
APP_PATH = "/home/arduino/TetoClockBridge"
BRIDGE_DATA_PATH = f"{APP_PATH}/.bridge"
REQUEST_PATH = f"{BRIDGE_DATA_PATH}/request"
ACK_PATH = f"{BRIDGE_DATA_PATH}/ack"
MAX_SPEECH_DURATION_MS = 120000
ACK_TIMEOUT_SECONDS = 20


def find_adb(explicit_path: Path | None) -> Path:
    if explicit_path:
        if explicit_path.is_file():
            return explicit_path
        raise RuntimeError(f"ADB executable not found: {explicit_path}")

    path_adb = shutil.which("adb")
    if path_adb:
        return Path(path_adb)

    adb_root = (
        Path.home()
        / "AppData"
        / "Local"
        / "Arduino15"
        / "packages"
        / "arduino"
        / "tools"
        / "adb"
    )
    candidates = sorted(adb_root.glob("*/adb.exe"), reverse=True)
    if candidates:
        return candidates[0]

    raise RuntimeError(
        "Could not find adb.exe. Install Android Debug Bridge or pass "
        "--adb-path with the adb.exe bundled with Arduino CLI."
    )


class UnoQBridge:
    def __init__(self, adb_path: Path, device_serial: str | None) -> None:
        self.adb_path = adb_path
        self.device_serial = device_serial

    def _run(
        self,
        *arguments: str,
        check: bool = True,
        timeout: float = 30,
    ) -> subprocess.CompletedProcess[str]:
        command = [str(self.adb_path)]
        if self.device_serial:
            command.extend(["-s", self.device_serial])
        command.extend(arguments)
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False,
            )
        except subprocess.TimeoutExpired as error:
            raise TimeoutError(
                f"ADB command timed out after {timeout} seconds: "
                f"{' '.join(arguments)}"
            ) from error
        if check and result.returncode != 0:
            details = (result.stderr or result.stdout).strip()
            raise RuntimeError(
                f"ADB command failed ({' '.join(arguments)}): "
                f"{details or f'exit code {result.returncode}'}"
            )
        return result

    def connect(self) -> None:
        result = self._run("devices")
        devices = [
            line.split()[0]
            for line in result.stdout.splitlines()[1:]
            if len(line.split()) >= 2 and line.split()[1] == "device"
        ]
        if self.device_serial:
            if self.device_serial not in devices:
                raise RuntimeError(
                    f"ADB device {self.device_serial} is not connected. "
                    "Run `adb devices -l` and check the Uno Q connection."
                )
        elif len(devices) == 1:
            self.device_serial = devices[0]
        elif not devices:
            raise RuntimeError(
                "ADB found no connected devices. Connect the Uno Q and run "
                "`adb devices -l` to check its connection."
            )
        else:
            raise RuntimeError(
                "More than one ADB device is connected. Rerun with "
                "--adb-serial and choose the Uno Q serial shown by "
                "`adb devices -l`."
            )

    def deploy_and_start_app(self) -> None:
        self._run(
            "shell",
            "mkdir",
            "-p",
            f"{APP_PATH}/python",
            BRIDGE_DATA_PATH,
        )
        self._run(
            "push",
            str(APP_SOURCE / "app.yaml"),
            f"{APP_PATH}/app.yaml",
        )
        self._run(
            "push",
            str(APP_SOURCE / "python" / "main.py"),
            f"{APP_PATH}/python/main.py",
        )
        self._run(
            "shell",
            "arduino-app-cli",
            "app",
            "stop",
            APP_PATH,
            check=False,
        )
        result = self._run(
            "shell",
            "env",
            "TMPDIR=/tmp",
            "arduino-app-cli",
            "app",
            "start",
            APP_PATH,
            timeout=90,
        )
        if result.stdout.strip():
            print(result.stdout.strip())
        if result.stderr.strip():
            print(result.stderr.strip(), file=sys.stderr)

    def stop_app(self) -> None:
        result = self._run(
            "shell",
            "arduino-app-cli",
            "app",
            "stop",
            APP_PATH,
            check=False,
        )
        if result.returncode != 0:
            details = (result.stderr or result.stdout).strip()
            raise RuntimeError(
                f"Could not stop the Uno Q bridge app: "
                f"{details or f'exit code {result.returncode}'}"
            )

    def send_command(self, action: str, duration_ms: int | None = None) -> None:
        request_id = uuid.uuid4().hex
        fields = [request_id, action]
        if duration_ms is not None:
            fields.append(str(duration_ms))
        request = " ".join(fields)
        remote_command = (
            f"echo '{request}' > {REQUEST_PATH}.tmp && "
            f"mv {REQUEST_PATH}.tmp {REQUEST_PATH}"
        )
        self._run("shell", remote_command)

        deadline = time.monotonic() + ACK_TIMEOUT_SECONDS
        while time.monotonic() < deadline:
            response = self._run(
                "shell",
                f"cat {ACK_PATH} 2>/dev/null || true",
            ).stdout.strip()
            if response.startswith(f"{request_id} "):
                status = response[len(request_id) + 1 :]
                if status != "OK":
                    raise RuntimeError(f"Uno Q Bridge returned an error: {status}")
                return
            time.sleep(0.2)

        logs = self._run(
            "shell",
            "arduino-app-cli",
            "app",
            "logs",
            APP_PATH,
            check=False,
        )
        log_text = (logs.stdout or logs.stderr).strip()
        raise TimeoutError(
            "Timed out waiting for the Uno Q Bridge app. "
            "Check the board app logs with "
            "`adb shell arduino-app-cli app logs "
            f"{APP_PATH}`.{f' App logs: {log_text}' if log_text else ''}"
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Generate ElevenLabs speech, play it on this PC, and synchronize "
            "the Uno Q through its supported Bridge connection."
        )
    )
    parser.add_argument(
        "--text",
        default=TEST_TEXT,
        help="Text for the selected ElevenLabs voice to speak.",
    )
    parser.add_argument(
        "--adb-path",
        type=Path,
        help="Optional path to adb.exe if it is not on PATH or Arduino's folder.",
    )
    parser.add_argument(
        "--adb-serial",
        help="Optional Uno Q ADB serial from `adb devices -l`.",
    )
    args = parser.parse_args()

    try:
        print("Generating the speech clip with ElevenLabs...")
        clip = generate_speech(args.text)
        print(f"Speech audio saved to: {clip.path}")
        print(f"Clip duration: {clip.duration_ms / 1000:.1f} seconds.")

        if not 0 < clip.duration_ms <= MAX_SPEECH_DURATION_MS:
            raise RuntimeError(
                "Clip duration must be between 1 ms and 120 seconds "
                "for the Uno Q's timed output."
            )

        board = UnoQBridge(find_adb(args.adb_path), args.adb_serial)
        board.connect()
        print(f"Connected to the Uno Q over ADB ({board.device_serial}).")
        board.deploy_and_start_app()

        print("Starting the Uno Q LED and pin 3 output...")
        try:
            try:
                board.send_command("START", clip.duration_ms)
                print("Playing through the computer's default audio output...")
                winsound.PlaySound(str(clip.path), winsound.SND_FILENAME)
            finally:
                board.send_command("STOP")
        finally:
            board.stop_app()
        print("Speech test complete; Uno Q outputs are off.")
    except (OSError, RuntimeError, TimeoutError, ValueError) as error:
        raise SystemExit(str(error)) from error


if __name__ == "__main__":
    main()
