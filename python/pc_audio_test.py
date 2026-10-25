import argparse
import sys

import serial
import winsound


def main():
    parser = argparse.ArgumentParser(
        description="Play a short tone on this Windows PC for each Uno Q LED flash."
    )
    parser.add_argument(
        "--port",
        default="COM6",
        help="Uno Q serial port (default: COM6)",
    )
    args = parser.parse_args()

    print(f"Listening to the Uno Q on {args.port} at 115200 baud.")
    print("PC tone plays for each LED flash. Press Ctrl+C to stop.")

    try:
        with serial.Serial(args.port, 115200, timeout=1) as board:
            while True:
                message = board.readline().decode("utf-8", errors="replace").strip()
                if message == "FLASH":
                    winsound.Beep(880, 150)
    except serial.SerialException as error:
        print(f"Could not open/read {args.port}: {error}", file=sys.stderr)
        print(
            "Check the COM port and close Arduino IDE Serial Monitor if it is open.",
            file=sys.stderr,
        )
        raise SystemExit(1) from error
    except KeyboardInterrupt:
        print("\nPC audio test stopped.")


if __name__ == "__main__":
    main()
