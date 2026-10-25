import os
import wave
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs.core.api_error import ApiError
from elevenlabs.client import ElevenLabs

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT_PATH = PROJECT_ROOT / "python" / "generated" / "teto_test.wav"
TEST_TEXT = "Good morning! It's Teto. Time to wake up!"
SAMPLE_RATE = 22050


@dataclass(frozen=True)
class SpeechClip:
    path: Path
    duration_ms: int


def generate_speech(
    text: str = TEST_TEXT,
    output_path: Path = DEFAULT_OUTPUT_PATH,
) -> SpeechClip:
    load_dotenv(PROJECT_ROOT / ".env")
    api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID")

    if not api_key:
        raise RuntimeError(
            "Missing ELEVENLABS_API_KEY. Add it to the project .env file."
        )
    if not voice_id:
        raise RuntimeError(
            "Missing ELEVENLABS_VOICE_ID. Add it to the project .env file."
        )
    if not text.strip():
        raise ValueError("Speech text cannot be empty.")

    client = ElevenLabs(api_key=api_key)
    try:
        audio_chunks = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id="eleven_multilingual_v2",
            output_format="pcm_22050",
        )
        pcm_audio = b"".join(chunk for chunk in audio_chunks if chunk)
    except ApiError as error:
        raise RuntimeError(
            f"ElevenLabs rejected the speech request (HTTP {error.status_code}): "
            f"{error.body}"
        ) from error

    if not pcm_audio:
        raise RuntimeError("ElevenLabs returned an empty audio response.")
    if len(pcm_audio) % 2:
        raise RuntimeError("ElevenLabs returned incomplete 16-bit PCM audio.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output_path), "wb") as audio_file:
        audio_file.setnchannels(1)
        audio_file.setsampwidth(2)
        audio_file.setframerate(SAMPLE_RATE)
        audio_file.writeframes(pcm_audio)
    with wave.open(str(output_path), "rb") as audio_file:
        duration_ms = round(
            audio_file.getnframes() * 1000 / audio_file.getframerate()
        )

    return SpeechClip(path=output_path, duration_ms=duration_ms)
