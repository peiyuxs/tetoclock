import argparse
from pathlib import Path

from elevenlabs_api import DEFAULT_OUTPUT_PATH, TEST_TEXT, generate_speech


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a short speech clip with the ElevenLabs API."
    )
    parser.add_argument(
        "--text",
        default=TEST_TEXT,
        help="Text for the selected ElevenLabs voice to speak.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help=f"Output WAV path (default: {DEFAULT_OUTPUT_PATH})",
    )
    args = parser.parse_args()

    try:
        clip = generate_speech(args.text, args.output)
    except (RuntimeError, ValueError) as error:
        raise SystemExit(str(error)) from error

    print(f"Speech audio saved to: {clip.path}")
    print(f"Clip duration: {clip.duration_ms / 1000:.1f} seconds.")


if __name__ == "__main__":
    main()
