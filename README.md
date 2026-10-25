# TETO'Clock

TETO'Clock is a Windows PC + Arduino Uno Q test project. ElevenLabs generates a short voice clip, the PC plays it, and the Uno Q's built-in LED and digital pin 3 are synchronized with the clip.

**The salvaged speaker is not used in this test.** Pin 3 is a logic control output, not a motor power output. Read [Hardware and safety](#hardware-and-safety) before connecting anything.

## What happens when you run the test

1. Python requests speech from ElevenLabs and saves it as a WAV file on the PC.
2. The PC uses ADB over the USB connection to start a small Python app on the Uno Q.
3. That app sends start/stop requests through Arduino RouterBridge to the sketch.
4. The PC plays the WAV while the Uno Q lights its built-in LED and sets pin 3 HIGH.
5. At playback end, the PC sends a stop request. The sketch also has a 120-second automatic shutoff.

COM6 (or another COM port) is used to upload the sketch. It is **not** used to send speech commands. This is why the old `READY` serial handshake did not work.

## Project files

| File or folder | Purpose |
| --- | --- |
| `frontend/` | Client-only Next.js landing page and TetoClock dashboard. |
| `python/elevenlabs_api.py` | ElevenLabs client, WAV creation, and clip-duration calculation. |
| `python/main.py` | Generate a WAV only; does not connect to the board or play audio. |
| `python/uno_q_bridge.py` | Locate ADB, deploy the board-side app, and send/confirm Uno Q commands. |
| `python/tests/speech_test.py` | Coordinate speech generation, PC playback, and the Uno Q bridge. |
| `python/requirements.txt` | Python packages installed in the existing `.venv`. |
| `board_app/` | The App Lab Python bridge app copied to the Uno Q when the test runs. |
| `sketch/sketch.ino` | All GPIO behavior: LED, pin 3, bridge commands, and timed shutoff. |
| `sketch/sketch.yaml` | Uno Q CLI build profile and RouterBridge-compatible core/library versions. |
| `.env.example` | Template for the required ElevenLabs settings. |
| `.env` | Your private API key and voice ID. Keep this local; it is ignored by Git. |

The empty root-level `app.yaml` was removed. `board_app/app.yaml` is the valid manifest for the separate App Lab bridge app.

## Frontend dashboard

The client-only Next.js site lives in `frontend/`, separate from the Arduino and Python project files. It can be deployed to Vercel from the `frontend/` root directory; the static export is configured in `frontend/next.config.mjs`.

Run it locally with Node.js 18.17 or later:

```bash
cd frontend
npm install
npm run dev
```

The site has a landing page at `/` and the settings and wake-up dashboard at `/my-tetoclock`. The dashboard currently uses clearly labeled sample time-series data. It does not connect to TigerData or generate ElevenLabs previews: this repository has no browser-safe data endpoint, alarm-event ingestion, or web speech service. Keep TigerData and ElevenLabs credentials out of client-side code. To show real hardware history, add a secure API service that reads TigerData and returns only the required session timestamps and stop durations; to apply alarm settings, connect them to a device-control service. The current settings are saved locally in the browser.

For the wake-up history, a single line chart is the most useful primary visualization: it makes changes in stop time easy to scan. Pairing it with the average, quickest response, and number of sessions gives context without duplicating the same trend in multiple charts.

## Before starting

You will need:

- Windows 10 or 11, VS Code, and Git Bash.
- The existing project `.venv` (the commands below use `./.venv/bin/python.exe`).
- Arduino CLI.
- An Arduino Uno Q connected to the PC with a USB data cable.
- An ElevenLabs API key and a voice ID you are allowed to use.
- Working PC speakers or headphones.

If Arduino CLI is not installed, follow the [official Arduino CLI installation guide](https://arduino.github.io/arduino-cli/installation/) for Windows, then reopen Git Bash. From the repository root, confirm the tools and board are available:

```bash
arduino-cli version
arduino-cli board list
```

The board list should show an Arduino UNO Q and a port such as `COM6`. Replace `COM6` in later commands with the port shown on your PC.

## One-time Python and ElevenLabs setup

Run every command in this guide from **Git Bash**, with the current directory at the repository root. Check it with:

```bash
pwd
```

Install the project dependencies into the existing environment:

```bash
./.venv/bin/python.exe -m pip install -r python/requirements.txt
```

If that command says the file cannot be found, check that you are at the repository root and that `.venv/bin/python.exe` exists. Do not create another virtual environment if this existing one works.

Create your private `.env` from the template if you do not already have one:

```bash
cp -n .env.example .env
```

Open `.env` in VS Code and replace the empty values with your own credentials:

```text
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id
```

Save the file. Do not share or commit it. If `.env` already exists, edit that file rather than overwriting it.

## Step 1: Generate speech on its own

This checks ElevenLabs and saves the audio; it does not play sound or contact the Uno Q:

```bash
./.venv/bin/python.exe python/main.py
```

By default, the WAV is saved as `python/generated/teto_test.wav`. You can choose the words and output file:

```bash
./.venv/bin/python.exe python/main.py --text "Wake... up!" --output python/generated/custom.wav
```

The API requests mono 16-bit PCM at 22.05 kHz and wraps it in a WAV file. This avoids the `pcm_44100` plan restriction encountered with some ElevenLabs accounts.

## Step 2: Compile and upload the Uno Q sketch

The sketch profile pins the core to version `0.52.0`, matching the RouterBridge version on the Uno Q image used for this project.

1. Connect the Uno Q to the PC using its USB data cable.
2. Check the upload port:
   ```bash
   arduino-cli board list
   ```
3. Check the installed core:
   ```bash
   arduino-cli core list
   ```
   If `arduino:zephyr` version `0.52.0` is not installed, install it once:
   ```bash
   arduino-cli core install arduino:zephyr@0.52.0
   ```
4. Compile and upload. Replace `COM6` with the port from step 2:
   ```bash
   arduino-cli compile --profile uno_q --upload --port COM6 sketch
   ```
5. Wait for the command to finish successfully before moving on.

## Step 3: Check ADB sees the Uno Q

The integration script finds Arduino's bundled `adb.exe` automatically. To check the connection yourself, locate the Arduino ADB executable in Git Bash:

```bash
ADB_ROOT="$(cygpath -u "$LOCALAPPDATA")/Arduino15/packages/arduino/tools/adb"
ADB_EXE="$(find "$ADB_ROOT" -type f -name adb.exe -print -quit)"
"$ADB_EXE" devices -l
```

To use the short command `adb` for the rest of this Git Bash window:

```bash
export PATH="$PATH:$(dirname "$ADB_EXE")"
adb devices -l
```

The Uno Q should appear with status `device`. If it shows `unauthorized`, look for an authorization prompt and approve the connection. If it does not appear, check the USB data cable and reconnect the board.

## Step 4: Play speech and synchronize the Uno Q

**Safety check:** leave the salvaged speaker disconnected. Do not connect a bare motor/fan directly to pin 3. See [Hardware and safety](#hardware-and-safety).

1. Set your PC volume to a comfortable level.
2. Run the integration test:
   ```bash
   ./.venv/bin/python.exe python/tests/speech_test.py
   ```
3. To choose a different phrase:
   ```bash
   ./.venv/bin/python.exe python/tests/speech_test.py --text "Good morning! Time to wake up!"
   ```
4. If more than one ADB device is connected, specify the Uno Q serial shown by `adb devices -l`:
   ```bash
   ./.venv/bin/python.exe python/tests/speech_test.py --adb-serial 1712448364
   ```

The script generates the WAV, deploys and starts the App Lab bridge app, plays audio through the PC, sends `STOP` when playback ends, then stops the bridge app. It does not take a `--port` argument. The script also accepts `--adb-path` if ADB is installed somewhere outside Arduino's standard folder.

## Hardware and safety

- **Speaker:** the unknown salvaged laptop speaker is not part of this test. Do not connect it directly to a GPIO pin, 3.3 V, 5 V, or GND, with or without a resistor. A speaker requires a correctly rated audio amplifier.
- **Motor/fan:** pin 3 is a low-current logic signal. Do not connect a motor directly to pin 3 or an Arduino power pin. Use a suitable motor driver and separate, correctly rated motor supply only after identifying the motor and driver ratings and pinout.
- **If a bare motor is currently wired directly to pin 3, disconnect it before running the integration test.** The script deliberately sets pin 3 HIGH during playback.
- Disconnect board power before changing wiring.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `adb: command not found` | Expected if ADB is not on Git Bash's `PATH`. Use the full Arduino ADB path above, or add its folder with `export PATH=...`. The Python script searches Arduino's standard ADB location automatically. |
| `ADB found no connected devices` | Run the ADB `devices -l` command above; check the USB data cable and approve any authorization prompt. |
| More than one ADB device | Use `--adb-serial` with the Uno Q serial from `adb devices -l`. |
| `Could not find adb.exe` | Confirm Arduino CLI's ADB tool exists under `%LOCALAPPDATA%\Arduino15\packages\arduino\tools\adb`. Otherwise pass its full path with `--adb-path`. |
| Missing ElevenLabs key or voice ID | Check that the project-root `.env` has `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`. |
| ElevenLabs authorization or format error | Check the account/voice permissions. The project requests `pcm_22050`; 44.1 kHz PCM was not allowed on the account used during initial testing. |
| App Lab bridge app fails | With ADB on `PATH`, run `adb shell arduino-app-cli app logs /home/arduino/TetoClockBridge`. Make sure the Uno Q has network access if it needs to download App Lab components. |
| No audio from PC | Check the Windows output device and volume. Speech audio comes from the PC, not the Uno Q. |

## Code map

- `python/elevenlabs_api.py` requests audio, creates the WAV, and calculates its duration.
- `python/main.py` is the simple API-only command.
- `python/uno_q_bridge.py` owns the ADB lookup, deployment, start/stop commands, and acknowledgement timeout.
- `python/tests/speech_test.py` coordinates the API, Windows audio playback, and board bridge.
- `board_app/python/main.py` reads PC requests and forwards them to Arduino RouterBridge. It does not set GPIO pins.
- `sketch/sketch.ino` owns all GPIO actions. `START` turns on the built-in LED and pin 3 and starts the duration timer; `STOP` turns them off. The sketch's 120-second timeout is a fail-safe if the PC disconnects.
