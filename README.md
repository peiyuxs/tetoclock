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

## Beginner Teto Voice Test (Windows)

This test plays a short ElevenLabs voice clip through your **computer's speakers or headphones** and turns on the Arduino's built-in LED during playback. The Arduino and a 1 MΩ resistor cannot play the voice. The breadboard and resistor are not needed for this test.

### 1. Make the hardware safe

1. Unplug the Arduino's USB cable before changing any wires.
2. Remove wires between the breadboard/resistor and the Arduino. Leave the 1 MΩ resistor out of the circuit. Do not connect a speaker to an Arduino pin.
3. Connect the Arduino to the computer with USB only. The board can stay connected while the voice plays on the computer.

### 2. Prepare ElevenLabs and Python

1. Install Python 3.10 or later and make sure the Windows `py` launcher is available in Git Bash.
2. In ElevenLabs, select a Teto voice you are allowed to use and copy its voice ID. Copy your API key too.
3. In the repository folder, open the existing `.env` file (create it if needed) and add these two lines, replacing the example values:
   ```text
   ELEVENLABS_API_KEY=your_api_key
   ELEVENLABS_VOICE_ID=your_voice_id
   ```
   Keep `.env` private; do not share it or commit it.
4. In Git Bash, from the repository root, create a Windows Python environment and install the dependencies:
   ```bash
   py -m venv .venv-win
   ./.venv-win/Scripts/python.exe -m pip install -r python/requirements.txt
   ```

### 3. Upload the LED test and run the speech test

1. Connect the Arduino by USB and upload `sketch/sketch.ino` to it. For the Uno Q setup, install/configure the Arduino CLI board support first, then run the following command, replacing `COM6` with the port from `arduino-cli board list`:
   ```bash
   arduino-cli compile --profile uno_q --upload --port COM6 sketch
   ```
2. Turn your computer volume down to a comfortable level and connect headphones or use the computer speakers.
3. Run the script with the Arduino's port (the default is `COM6`):
   ```bash
   ./.venv-win/Scripts/python.exe python/main.py --port COM6
   ```
4. The script asks ElevenLabs for 22.05 kHz PCM audio (`pcm_22050`; unlike Pro-only 44.1 kHz PCM, this format is available on lower tiers), wraps it as a WAV file, saves it as `python\generated\teto_test.wav`, and plays it through the computer. The Arduino's built-in LED turns on while the clip is playing and turns off when playback finishes. To change what Teto says, edit `TEST_TEXT` in `python\main.py`.

Keep the Arduino connected and do not open Arduino IDE Serial Monitor while the test script is running; only one program can use the COM port at a time. The Arduino LED indicates speech playback but does not play audio itself.