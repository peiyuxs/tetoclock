import os
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs


PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = PROJECT_ROOT / "python" / "generated" / "teto_test.mp3"
TEST_TEXT = "WAKE... UP."


def main():
    load_dotenv(PROJECT_ROOT / ".env")
    api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID")

    if not api_key:
        raise SystemExit(
            "Missing ELEVENLABS_API_KEY. Add it to the project .env file."
        )
    if not voice_id:
        raise SystemExit(
            "Missing ELEVENLABS_VOICE_ID. Add your ElevenLabs voice ID to .env."
        )

    client = ElevenLabs(api_key=api_key)
    print("Requesting a short Teto speech test from ElevenLabs...")

    audio = client.text_to_speech.convert(
        voice_id=voice_id,
        text=TEST_TEXT,
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
    )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("wb") as audio_file:
        for chunk in audio:
            if chunk:
                audio_file.write(chunk)

    print(f"Speech audio saved to: {OUTPUT_PATH}")
    print("This test saves the audio file; it does not play it through the Uno Q.")


if __name__ == "__main__":
    main()
