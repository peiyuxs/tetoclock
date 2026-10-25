# TETO'Clock

TETO'Clock is an Arduino Uno Q and Python prototype for generating a short ElevenLabs voice clip, playing it on a Windows PC, and synchronizing the Uno Q's built-in LED and a motor-driver control output with playback.

The salvaged laptop speaker is not used by this test. Digital pin 3 is a control signal only: do not connect a bare speaker or motor/fan directly to the Uno Q. A motor requires a correctly rated driver and supply. See [Hardware safety](#hardware-safety).

## Project files

- `python/elevenlabs_api.py` contains the ElevenLabs API client logic. It reads credentials from `.env`, requests 22.05 kHz PCM audio, writes a mono 16-bit WAV, and returns the clip duration.
- `python/main.py` is the API-only command-line entry point. It generates a clip without connecting to an Arduino or playing audio.
- `python/tests/speech_test.py` is the Windows integration runner. It generates a clip, starts the Uno Q App Lab bridge app, sends the playback duration over ADB, plays the WAV through the PC, then sends a stop command.
- `python/requirements.txt` lists the Python packages.
- `sketch/sketch.ino` contains the board-side pin behavior. It registers `start_outputs` and `stop_outputs` with Arduino RouterBridge, controls the built-in LED and pin 3, and automatically turns outputs off after at most 120 seconds.
- `sketch/sketch.yaml` is the Arduino CLI build profile for the Uno Q and pins its platform and library dependencies.
- `board_app/` is a small Python-only Arduino App Lab project deployed to the Uno Q by the integration runner. It receives start/stop requests from the PC and forwards them through RouterBridge; GPIO pin logic remains in `sketch/sketch.ino`.
- `.env.example` shows the expected ElevenLabs environment-variable names. Copy those names into the private project-root `.env` file.

The old, empty root-level `app.yaml` is still removed. The valid `board_app/app.yaml` manifest is used only for the Uno Q's App Lab bridge app. `sketch/sketch.yaml` pins the Arduino CLI build to the Uno Q platform version bundled with the board's installed Linux image so its RouterBridge protocol matches.

## Requirements

- Windows 10/11 with Git Bash.
- Python 3.10 or later available via the Windows `py` launcher.
- Arduino CLI, its bundled ADB tool, and the Uno Q connected by a USB data cable.
- An ElevenLabs API key and a voice ID for a voice you are allowed to use.
- Computer speakers or headphones for PC playback.

## Initial setup

Run commands from Git Bash in the repository root. This project uses the existing `.venv`; do not create a second environment:

```bash
./.venv/bin/python.exe -m pip install -r python/requirements.txt
```

Create or edit the project-root `.env` file and add your own credentials:

```text
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id
```

Keep `.env` private; it is ignored by Git. Never paste the API key into source code or commit it.

## Generate speech only

This calls ElevenLabs and saves a WAV file; it does not open the Arduino port or play audio:

```bash
./.venv/bin/python.exe python/main.py
```

Pass optional text and an output path:

```bash
./.venv/bin/python.exe python/main.py --text "Wake... up!" --output python/generated/custom.wav
```

By default, the generated clip is `python/generated/teto_test.wav`. ElevenLabs' 22.05 kHz PCM output is selected because 44.1 kHz PCM was rejected by accounts without Pro access.

## Play speech and synchronize the Uno Q

1. Leave the salvaged speaker disconnected. Pin 3 must control a suitable external motor driver; do not connect a bare motor/fan directly to the board.
2. Connect the Uno Q to the PC with a USB data cable. Find its upload port:
   ```bash
   arduino-cli board list
   ```
3. Install the board platform version required to match the Uno Q's installed RouterBridge runtime. Do this once if it is not already installed:
   ```bash
   arduino-cli core install arduino:zephyr@0.52.0
   ```
   Compile and upload the sketch, replacing `COM6` with the port shown on your PC:
   ```bash
   arduino-cli compile --profile uno_q --upload --port COM6 sketch
   ```
4. Check that ADB sees the board:
   ```bash
   adb devices -l
   ```
   If `adb` is not on PATH, use the Arduino-bundled executable. In PowerShell, find it with:
   ```powershell
   Get-ChildItem "$env:LOCALAPPDATA\Arduino15\packages\arduino\tools\adb" -Filter adb.exe -Recurse
   ```
   The script searches that Arduino folder automatically. If more than one ADB device appears, pass the Uno Q's serial with `--adb-serial`.
5. Set the PC volume to a comfortable level. Run the integration script (no `--port` argument is needed):
   ```bash
   ./.venv/bin/python.exe python/tests/speech_test.py
   ```
   Optionally provide a phrase:
   ```bash
   ./.venv/bin/python.exe python/tests/speech_test.py --text "Good morning! Time to wake up!"
   ```
   If multiple devices are connected over ADB, specify the Uno Q serial shown by `adb devices -l`:
   ```bash
   ./.venv/bin/python.exe python/tests/speech_test.py --adb-serial 1712448364
   ```
6. The script copies and starts the Python-only App Lab bridge app on the Uno Q. The PC plays the generated voice; the Uno Q's built-in LED and pin 3 control output turn on for the clip and are explicitly turned off when playback ends. The sketch independently enforces a 120-second maximum-on timeout. The Uno Q's built-in LED is active-low, so the sketch drives it LOW to turn it on. The bridge app is stopped when the test exits.

The integration test no longer uses the COM port or a `READY` text handshake. On the Uno Q, the sketch's `Serial` is routed through Arduino RouterBridge, not used as a regular PC serial command channel. The PC runner uses ADB to reach the Uno Q's Linux side; the board-side App Lab app forwards the timing request to the sketch with RouterBridge. The API-only script at `python/main.py` remains separate from this hardware integration path.

## Hardware safety

- **Speaker:** The unidentified salvaged speaker is not connected in this software test. Do not connect it to a GPIO pin, 3.3 V, 5 V, or GND, with or without the 1 MΩ resistor. A resistor does not replace an audio amplifier.
- **Fan/motor:** Pin 3 is a logic-level control output, not a motor power output. Do not connect a motor directly to pin 3 or an Arduino supply pin. To use a motor, first identify its voltage and current and use a compatible motor driver and suitable motor supply, following the driver's documentation. Do not wire the driver until its exact model, ratings, and pinout are known.
- Disconnect USB and other power before changing wiring.

## Troubleshooting

- **Missing key or voice ID:** Check the variable names and values in the project-root `.env`.
- **ElevenLabs authorization/plan error:** The API prints the provider's error details. Confirm the selected output format and that your account allows it.
- **The old `READY` timeout:** The speech test no longer sends `PING` over COM6. Check `adb devices -l` for the Uno Q control connection instead.
- **No ADB device:** Check the USB data cable, unlock/authorize the board if prompted, and confirm `adb devices -l` lists it with status `device`.
- **Bridge app does not start:** Check the Uno Q app logs with `adb shell arduino-app-cli app logs /home/arduino/TetoClockBridge`. Re-upload the sketch using the pinned Uno Q platform version, then rerun the integration script.
- **No PC sound:** Check the selected Windows output device and volume. The Arduino does not produce the speech audio.
