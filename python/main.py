import argparse
import os
import time
import wave
import winsound
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs.core.api_error import ApiError
from elevenlabs.client import ElevenLabs
import serial


PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = PROJECT_ROOT / "python" / "generated" / "teto_test.wav"
TEST_TEXT = "Good morning! It's Teto. Time to wake up!"
BOARD_READY_TIMEOUT = 15
SAMPLE_RATE = 22050


def main():
    parser = argparse.ArgumentParser(
        description="Play an ElevenLabs Teto voice test and light the Arduino LED."
    )
    parser.add_argument(
        "--port",
        default="COM6",
        help="Arduino serial port (default: COM6)",
    )
    args = parser.parse_args()

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

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    try:
        audio_chunks = client.text_to_speech.convert(
            voice_id=voice_id,
            text=TEST_TEXT,
            model_id="eleven_multilingual_v2",
            output_format="pcm_22050",
        )
        pcm_audio = b"".join(chunk for chunk in audio_chunks if chunk)
    except ApiError as error:
        raise SystemExit(
            f"ElevenLabs rejected the speech request (HTTP {error.status_code}): "
            f"{error.body}"
        ) from error

    if not pcm_audio:
        raise RuntimeError("ElevenLabs returned an empty audio response.")
    if len(pcm_audio) % 2:
        raise RuntimeError("ElevenLabs returned incomplete 16-bit PCM audio.")

    with wave.open(str(OUTPUT_PATH), "wb") as audio_file:
        audio_file.setnchannels(1)
        audio_file.setsampwidth(2)
        audio_file.setframerate(SAMPLE_RATE)
        audio_file.writeframes(pcm_audio)

    print(f"Speech audio saved to: {OUTPUT_PATH}")
    print(f"Connecting to the Arduino on {args.port}...")

    try:
        with serial.Serial(args.port, 115200, timeout=1) as board:
            print("Waiting for the Arduino sketch to become ready...")
            deadline = time.monotonic() + BOARD_READY_TIMEOUT
            while time.monotonic() < deadline:
                board.write(b"PING\n")
                board.flush()
                message = board.readline().decode("utf-8", errors="replace").strip()
                if message == "READY":
                    break
            else:
                raise TimeoutError(
                    "Arduino did not send READY. Check that the LED test sketch "
                    "is uploaded and the selected port is correct."
                )

            print("Playing through the computer's default audio output...")
            try:
                board.write(b"SPEAKING\n")
                board.flush()
                winsound.PlaySound(str(OUTPUT_PATH), winsound.SND_FILENAME)
            finally:
                board.write(b"IDLE\n")
                board.flush()
            print("Speech test complete; Arduino LED turned off.")
    except serial.SerialException as error:
        raise SystemExit(
            f"Could not communicate with the Arduino on {args.port}: {error}\n"
            "Check the COM port and close Arduino IDE Serial Monitor if it is open."
        ) from error


if __name__ == "__main__":
    main()
