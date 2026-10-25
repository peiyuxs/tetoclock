import time
from pathlib import Path

from arduino.app_utils import App, Bridge


APP_DATA_PATH = Path(__file__).resolve().parents[1] / ".bridge"
REQUEST_PATH = APP_DATA_PATH / "request"
ACK_PATH = APP_DATA_PATH / "ack"
MAX_SPEECH_DURATION_MS = 120000


def acknowledge(request_id: str, status: str) -> None:
    temporary_path = ACK_PATH.with_suffix(".tmp")
    temporary_path.write_text(f"{request_id} {status}\n", encoding="ascii")
    temporary_path.replace(ACK_PATH)


def process_request() -> None:
    if not REQUEST_PATH.exists():
        return

    request = REQUEST_PATH.read_text(encoding="ascii").strip()
    REQUEST_PATH.unlink()
    fields = request.split()
    if len(fields) < 2:
        print("Ignoring malformed TETO'Clock request.")
        return

    request_id, action = fields[:2]
    if len(request_id) != 32 or not all(
        character in "0123456789abcdef" for character in request_id
    ):
        print("Ignoring TETO'Clock request with an invalid request ID.")
        return

    try:
        if action == "START" and len(fields) == 3:
            duration_ms = int(fields[2])
            if not 0 < duration_ms <= MAX_SPEECH_DURATION_MS:
                raise ValueError("duration must be between 1 and 120000 ms")
            Bridge.call("start_outputs", duration_ms)
        elif action == "STOP" and len(fields) == 2:
            Bridge.call("stop_outputs")
        elif action == "POLL" and len(fields) == 2:
            dismissed = Bridge.call("consume_alarm_dismissed")
            acknowledge(request_id, "DISMISSED" if dismissed else "IDLE")
            return
        else:
            raise ValueError("unknown action or invalid arguments")
    except (OSError, ValueError) as error:
        message = f"ERROR {type(error).__name__}: {error}".replace("\n", " ")
        print(f"Could not forward TETO'Clock request: {message}")
        acknowledge(request_id, message)
        return

    acknowledge(request_id, "OK")


def loop() -> None:
    process_request()
    time.sleep(0.05)


App.run(user_loop=loop)
