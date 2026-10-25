"""Generate Teto speech, play it on Windows, and synchronize the Uno Q."""

import argparse
import sys
import winsound
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from elevenlabs_api import TEST_TEXT, generate_speech
from uno_q_bridge import UnoQBridge, find_adb


MAX_SPEECH_DURATION_MS = 120000


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
        bridge = UnoQBridge(find_adb(args.adb_path), args.adb_serial)
        bridge.connect()
        print(f"Connected to the Uno Q over ADB ({bridge.device_serial}).")

        print("Generating the speech clip with ElevenLabs...")
        clip = generate_speech(args.text)
        print(f"Speech audio saved to: {clip.path}")
        print(f"Clip duration: {clip.duration_ms / 1000:.1f} seconds.")

        if not 0 < clip.duration_ms <= MAX_SPEECH_DURATION_MS:
            raise RuntimeError(
                "Clip duration must be between 1 ms and 120 seconds "
                "for the Uno Q's timed output."
            )

        bridge.deploy_and_start_app()
        print("Starting the Uno Q LED and pin 3 control output...")
        try:
            bridge.send_command("START", clip.duration_ms)
            print("Playing through the computer's default audio output...")
            winsound.PlaySound(str(clip.path), winsound.SND_FILENAME)
        finally:
            try:
                bridge.send_command("STOP")
            finally:
                bridge.stop_app()

        print("Speech test complete; Uno Q outputs are off.")
    except (OSError, RuntimeError, TimeoutError, ValueError) as error:
        raise SystemExit(str(error)) from error


if __name__ == "__main__":
    main()
