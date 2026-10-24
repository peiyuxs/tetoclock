# TETO'Clock
Full steam ahead—it's TetO'Clock!

Millions of people waste hours trapped in a seemingly endless loop of setting multiple redundant alarms, only to lazily disable them from the comfort of their beds. As a result of oversleeping, morning classes, meetings, and other critical events can be missed. Traditional alarms fail because they rely heavily on willpower while lying horizontally. We need a solution that requires you to be vertical; we need a solution that transforms the start of the morning routine from a passive, easy button press into an active challenge.

That’s where our prototype comes in!

# Platformio.ini File
When you add a new library (e.g., Adafruit Unified Sensor), **add it to the lib_deps section of platformio.ini. Then, push that file.** This ensures everyone else's VS Code automatically installs the exact same library version when they pull.

# Setup
This repository contains a PlatformIO Arduino project in the `tetoclock` folder, configured for an Arduino Uno.

1. Install [Git](https://git-scm.com/), [Visual Studio Code](https://code.visualstudio.com/), and the **PlatformIO IDE** extension in VS Code.
2. Clone this GitHub repository in VS Code (`Ctrl+Shift+P` → **Git: Clone**) and open the cloned repository.
3. Open the `tetoclock` folder in VS Code (or use **File → Open Folder**). PlatformIO will install the project dependencies when needed.
4. Connect an Arduino Uno. Use the PlatformIO toolbar to build the project, then upload it to the board.

The PlatformIO configuration is in `tetoclock/platformio.ini`; add project libraries under `lib_deps` and commit that change so teammates get the same dependencies. Build output and local files are excluded by the repository's `.gitignore`.

## ElevenLabs Speech Test
This project has two separate first tests:
- `sketch/sketch.ino` blinks the Uno Q's built-in LED and prints status to Serial. It does not drive a speaker.
- `python/main.py` requests a short spoken test from ElevenLabs and saves the MP3 to `python/generated/teto_test.mp3`.

The Python test currently saves the generated audio; it does not send or play the MP3 through the Arduino sketch.

1. Install Python 3.10 or later.
2. Create a voice in ElevenLabs, or select a voice you are allowed to use. Copy its voice ID.
3. Copy the variable names from `.env.example` into the existing project-root `.env` file. Set `ELEVENLABS_API_KEY` to your API key and `ELEVENLABS_VOICE_ID` to the voice ID. Do not commit `.env`.
4. In Git Bash, from the repository root, create and activate a virtual environment, then install the packages:
   ```bash
   python -m venv .venv
   source .venv/Scripts/activate
   python -m pip install -r python/requirements.txt
   ```
5. Run the test:
   ```bash
   python python/main.py
   ```

The script writes the audio file to `python/generated/teto_test.mp3`. Change `TEST_TEXT` in `python/main.py` to try different wording and punctuation. The output directory is ignored by Git.

## Safe Uno Q Board Test

The sketch in `sketch/sketch.ino` is currently an LED-and-Serial test only. It does not drive a speaker or play tones. Keep the salvaged speaker disconnected while running this test.

In Git Bash, from the repository root, compile and upload with:

```bash
arduino-cli compile --profile uno_q --upload --port COM6 sketch
```

Replace `COM6` with the Uno Q's port as shown by `arduino-cli board list`. The built-in LED flashes three times, pauses, and repeats. The sketch also prints status messages at **115200 baud**. If the Arduino CLI Serial Monitor cannot open the Uno Q port, use Arduino IDE 2's Serial Monitor instead.

**Speaker safety:** A series resistor does not make it safe to connect an unidentified speaker directly to a Uno Q GPIO pin. A resistor does not provide the amplifier function or guarantee that either the speaker or the GPIO stays within its electrical limits. Do not connect the speaker to pin 8, GND, 3.3 V, or 5 V. Only test it through an amplifier confirmed to support the speaker's impedance and power requirements; connect the speaker only to the amplifier's speaker outputs, following that amplifier's documentation. Until the speaker and amplifier are identified, use this LED-only sketch and leave the speaker disconnected.

## Current audio boundary
ElevenLabs generates compressed MP3 audio on the Python side; the Arduino LED test does not decode or play that file. Playing the generated speech through a speaker attached to the Uno Q requires an audio playback route (audio output/DAC and amplifier, or a supported audio playback device) and a decision about whether Python or the microcontroller will handle playback. The current files intentionally keep API generation separate from the simple board test.