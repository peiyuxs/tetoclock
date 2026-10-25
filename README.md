# TETO'Clock

TETO'Clock combines an Arduino UNO Q, a Windows PC companion, and a Next.js dashboard. Sign in, pair each USB-connected clock with its own name and history, save alarm preferences per device, and chart how long it takes to dismiss an alarm.

## What runs where

| Component | Purpose |
| --- | --- |
| `frontend/` | Next.js website, Clerk sign-in, server-side API routes, and TigerData access. |
| `python/tetoclock_companion.py` | Windows companion: matches a USB-connected board, reads saved settings, waits for the board alarm, plays speech once, and records physical dismissal. |
| `board_app/` | Small Python app deployed to the UNO Q Linux side. It passes requests to the Arduino sketch using Arduino RouterBridge and reports alarm/dismissal events. |
| `sketch/sketch.ino` | Runs the LCD clock, knob-based time/alarm setting, D10 tone melody, D7 fan control, and D9 dismiss switch on the UNO Q microcontroller. |
| `python/elevenlabs_api.py` | Generates speech using the ElevenLabs credentials in the repository-root `.env`. |
| `python/main.py` | Optional utility that generates a WAV without running the hardware companion. |
| `python/tests/speech_test.py` | Optional older one-shot speech and hardware test; it is separate from the account-paired dashboard companion. |
| `frontend/migrations/0001_initial.sql` | Creates the database tables for paired devices, preferences, pairing codes, and alarm sessions. |

The Arduino sketch keeps the clock, melody, fan, and switch running locally while the board is powered, even without a PC. The clock time resets when the board loses power. ElevenLabs speech requires the USB-connected Windows PC, network access, and the running companion. The browser never connects directly to the Arduino or TigerData.

## Beginner setup: install the tools

<<<<<<< Updated upstream
Use **Windows PowerShell** in VS Code. Whenever these steps say “project folder,” they mean the folder containing `README.md`.
=======
These instructions use **Git Bash on Windows**. The “project root” is the `tetoclock` folder containing this README. Commands below assume you have opened Git Bash in that folder.

### 0. Get the project

1. Install [Git for Windows](https://git-scm.com/download/win), which includes Git Bash, and [Visual Studio Code](https://code.visualstudio.com/).
2. In Git Bash, clone the repository and enter it:

   ```bash
   git clone https://github.com/peiyuxs/tetoclock.git
   cd tetoclock
   ```

   If a teammate has already given you the project folder, open Git Bash in that folder instead; do not clone over existing work.
3. Confirm you are at the project root:

   ```bash
   pwd
   ls
   ```

   You should see `README.md`, `frontend`, `python`, and `sketch`.
>>>>>>> Stashed changes

### 1. Install Node.js and npm

1. Download the **LTS** Windows installer from [nodejs.org](https://nodejs.org/en/download/). npm is included with Node.js; you do not install it separately.
2. Run the installer with the default options, including the option to add Node.js to PATH.
3. Close and reopen Git Bash, then check:

   ```bash
   node --version
   npm --version
   ```

   Both commands should print version numbers. If Git Bash says a command is not found, close and reopen Git Bash after installing Node.js; if it still fails, restart Windows and try again.

### 2. Install Python
<<<<<<< Updated upstream

1. Download Python 3.10 or later from [python.org/downloads](https://www.python.org/downloads/).
2. On the first installer screen, select **Add python.exe to PATH**, then install Python.
3. Close and reopen VS Code. In a new PowerShell terminal, check:
=======
1. Install Python **3.13** from [python.org/downloads](https://www.python.org/downloads/) or with the Windows Python launcher:
>>>>>>> Stashed changes

   ```bash
   py install 3.13
   ```

2. Close and reopen Git Bash, then check:

<<<<<<< Updated upstream
### 3. Create and use a Python virtual environment

A virtual environment (`venv`) keeps this project’s Python packages separate from other projects. Open PowerShell in the project folder and run:
=======
   ```bash
   py -3.13 --version
   ```
>>>>>>> Stashed changes

   Python 3.13 is recommended: it has a Windows `pygame` wheel. Newer Python versions may not have one yet. If `py` is not found, install Python 3.13 from [python.org](https://www.python.org/downloads/) and reopen Git Bash.

### 3. Create the Python environment and install packages

Run these from the project root. The virtual environment keeps this project's packages separate from your system Python:

```bash
py -3.13 -m venv .venv313
./.venv313/Scripts/python.exe -m pip install --upgrade pip
./.venv313/Scripts/python.exe -m pip install -r python/requirements.txt
```

Use `./.venv313/Scripts/python.exe` for the commands in this README. If you close the terminal, no activation is needed.

### 4. Install Arduino CLI and ADB

1. Install [Arduino CLI](https://arduino.github.io/arduino-cli/installation/) and make sure `arduino-cli` is on PATH. Reopen Git Bash and check:

<<<<<<< Updated upstream
### 4. Install Arduino CLI and check the board

1. Follow the official [Arduino CLI installation guide](https://arduino.github.io/arduino-cli/installation/) for Windows.
2. Connect the UNO Q to the PC with a USB **data** cable, reopen the terminal, and check:

   ```powershell
=======
   ```bash
>>>>>>> Stashed changes
   arduino-cli version
   ```

<<<<<<< Updated upstream
3. The sketch profile pins the `arduino:zephyr` 1.0.0 core, `Arduino_RouterBridge` 0.4.3, and `Arduino_RPClite` 0.3.0. Keep these versions together; the older bundled RouterBridge does not provide the alarm event methods the companion needs:

   ```powershell
   arduino-cli core install arduino:zephyr@1.0.0
=======
<<<<<<< Updated upstream
3. The sketch uses the `arduino:zephyr` 0.52.0 core. Install that version if needed:

   ```powershell
   arduino-cli core install arduino:zephyr@0.52.0
=======
2. Connect the UNO Q with a USB **data** cable. Install the board core required by the sketch profile:

   ```bash
   arduino-cli core install arduino:zephyr@1.0.0
>>>>>>> Stashed changes
>>>>>>> Stashed changes
   ```

   The profile also pins `Arduino_RouterBridge` 0.4.3 and `Arduino_RPClite` 0.3.0. Arduino CLI installs these when compiling the sketch.
3. Install [Android SDK Platform-Tools](https://developer.android.com/tools/releases/platform-tools) if `adb` is not already available. Extract the download, then either add its `platform-tools` folder to Windows PATH and reopen Git Bash, or remember the full path to `adb.exe`.
4. Check the board and ADB:

<<<<<<< Updated upstream
## Environment files: exactly what to keep

There are **two real credential files** for local development:

1. **`<project folder>\.env`** — ElevenLabs credentials for the Windows Python companion and speech utility. It should contain:

   ```text
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id
=======
   ```bash
   arduino-cli board list
   adb devices -l
>>>>>>> Stashed changes
   ```

   The upload port (such as `COM3`) and ADB serial are different identifiers. ADB should list the UNO Q as `device`, not `unauthorized`; accept any authorization prompt on the board. If Git Bash cannot find `adb`, use the `--adb-path` option with the full `adb.exe` path in the pair/alarm commands below.

## Configure local credentials

A fresh clone does not include working service credentials. Create these two ignored files locally. Do not commit them or share their contents in chat. The examples below show variable names and placeholders only.

### 1. Create the root `.env` for ElevenLabs

From the project root in Git Bash:

```bash
touch .env
code .env
```

If `code` is not recognized, open the project in VS Code and use **File → Open File**. Get an API key and a voice ID you are authorized to use from your ElevenLabs account, then add:

<<<<<<< Updated upstream
## Set up your own Clerk application

The project contains Clerk development authentication setup. To use keys from your own Clerk application:
=======
```text
ELEVENLABS_API_KEY=your_api_key
ELEVENLABS_VOICE_ID=your_voice_id
```
>>>>>>> Stashed changes

Do not add `NEXT_PUBLIC_` to these variable names. This file is read by the local Python speech client.

### 2. Create `frontend/.env.local` for Clerk and Tiger Cloud

<<<<<<< Updated upstream
## Set up TigerData and create the tables

Tiger Cloud is PostgreSQL with time-series features.
=======
From the project root:
>>>>>>> Stashed changes

```bash
touch frontend/.env.local
code frontend/.env.local
```

In the [Clerk Dashboard](https://dashboard.clerk.com/), create or select an application. Copy the **development** publishable and secret keys from that same application. In [Tiger Cloud Console](https://console.cloud.tigerdata.com/), create or select a database service and copy its connection details. Review any service costs before creating resources. If you are joining an existing team project, ask its administrator for access and a secure way to receive these values instead of creating replacement services.

Add the Clerk entries below, replacing the placeholders with your own matching development keys:

```text
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
```

Configure at least one sign-in method in Clerk. For the database, use either the service connection URL:

```text
TIMESCALE_SERVICE_URL=your_Tiger_Cloud_connection_URL
```

or the individual connection values:

```text
PGHOST=your_database_host
PGPORT=5432
PGUSER=your_database_user
PGPASSWORD=your_database_password
PGDATABASE=your_database_name
PGSSLMODE=require
```

Use one database configuration, not both. Never prefix secret keys or database credentials with `NEXT_PUBLIC_`; those values must stay server-side.

Confirm Git ignores both files:

```bash
git check-ignore .env frontend/.env.local
```

Both paths should print. If not, do not stage or commit the credential files; ask the repository maintainer to check `.gitignore`. The example file `frontend/.env.local.example` may not exist in every branch and is never a substitute for real credentials.

## Clerk sign-in setup
Use a matching publishable/secret key pair from the Clerk application configured in `frontend/.env.local`. Choose at least one sign-in method in the [Clerk Dashboard](https://dashboard.clerk.com/). For local development, use development keys; production keys belong on the deployed site.

The app has Clerk middleware and `/sign-in` and `/sign-up` pages. The signed-in account owns its paired clocks and data.

## Create the Tiger Cloud tables

After creating `frontend/.env.local` with valid Clerk and Tiger Cloud credentials, install the frontend packages and apply the schema from Git Bash:

```bash
cd frontend
npm ci
npm run db:migrate
cd ..
```

If migration fails to connect, check that the database service is running and its connection values in `frontend/.env.local` are correct. Migration is safe to run again.

The migration creates:

- `devices`: the Clerk user who owns the clock and the USB/ADB serial used to recognize it.
- `device_settings`: that clock’s saved song choice, Teto message/prompt, and volume.
- `device_pairing_codes`: short-lived, single-use codes for pairing.
- `device_tokens`: hashed companion tokens that can be revoked when a clock is removed.
- `alarm_sessions`: the clock’s time-series history of physical button dismissals.

The server uses `TIMESCALE_SERVICE_URL` if set, or the individual `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and `PGSSLMODE` variables. Database access stays in server-side Next.js API routes; the website never exposes the database password to the browser.

## Run the website locally
<<<<<<< Updated upstream
=======
The production site is available at [tetoclock.us](https://www.tetoclock.us); you do not need a local server just to visit it. For local development, open Git Bash at the project root and run:
>>>>>>> Stashed changes

```bash
cd frontend
npm ci
npm run dev
```

<<<<<<< Updated upstream
Open the local URL printed in the terminal, usually `http://localhost:3000`. Create an account or sign in, then choose **My TetoClock**. Stop the dev server with `Ctrl+C`.

`npm install` downloads frontend packages from `frontend\package-lock.json`. You generally need to run it once after cloning the project or after package dependencies change.
=======
Open `http://localhost:3000`, create an account or sign in, then choose **My TetoClock**. Keep the terminal open while using the local site; press `Ctrl+C` to stop the server. `npm ci` installs the exact packages from `frontend/package-lock.json`; run it after a fresh clone or dependency changes.
>>>>>>> Stashed changes

## Connect and pair a physical clock

Each board is registered as its own clock using its USB/ADB serial. A one-time pairing code associates that board with the signed-in user.

### 1. Wire and upload the sketch

1. Disconnect board power before wiring.
<<<<<<< Updated upstream
2. Wire the LCD: RS to D12, E to D11, D4 to D5, D5 to D4, D6 to D3, D7 to D2, and K to D6. Check the display module's backlight current requirements; add a current-limiting resistor if it does not already include one.
3. Connect the normally-open momentary dismiss switch between D9 and GND. The sketch uses `INPUT_PULLUP`; the switch does not need an external supply.
4. Connect the buzzer/tone output to D10 through suitable audio hardware. Connect the fan control to D7 through a transistor or motor driver.
5. Connect the hour and minute potentiometer wipers to A0 and A1, respectively, with their outer terminals wired to the board's appropriate power and ground.
6. From the project root, upload the updated sketch. Replace `COM6` with the port from `arduino-cli board list`:
=======
<<<<<<< Updated upstream
2. Connect a **normally open momentary push button** between UNO Q pin **D2** and **GND**. The sketch uses the internal pull-up resistor (`INPUT_PULLUP`); the button input does not need an external supply.
3. Leave pin 3 as a logic output. Do not connect a speaker, motor, or fan directly to it.
4. From the project root, upload the updated sketch. Replace `COM6` with the port from `arduino-cli board list`:
=======
2. Wire the LCD: RS to D12, E to D11, D4 to D5, D5 to D4, D6 to D3, D7 to D2, and K to D6. Check the display module's backlight current requirements; add a current-limiting resistor if it does not already include one.
3. Connect the normally-open momentary dismiss switch between D9 and GND. The sketch uses `INPUT_PULLUP`; the switch does not need an external supply.
4. Connect the buzzer/tone output on D10 to suitable audio hardware, following that hardware's pinout and voltage/current ratings.
5. Connect D7 only to the logic/control input of a suitable motor driver or transistor circuit—not directly to a motor. Power the fan from a supply rated for that fan, connect the supply ground to board ground, and follow the driver's wiring diagram. If the load is an inductive DC motor and the driver does not include protection, use the driver manufacturer's recommended flyback protection. Disconnect power before wiring; ask an experienced hardware teammate to check the circuit if unsure.
6. Connect the hour and minute potentiometer wipers to A0 and A1, respectively, with their outer terminals wired to the board's appropriate power and ground.
7. From the project root, upload the sketch. Replace `COM3` with the UNO Q port from `arduino-cli board list`:
>>>>>>> Stashed changes
>>>>>>> Stashed changes

   ```bash
   arduino-cli compile --profile uno_q --upload --port COM3 sketch
   ```

### 2. Generate a pairing code and pair over USB

1. Start the website with `npm run dev` from the `frontend` folder, sign in, then open **My TetoClock**.
2. Enter a clock name, such as `Bedroom clock`, then choose **Generate pairing code**.
3. Connect that UNO Q to the PC running the Python companion. Confirm it appears in ADB:

   ```bash
   adb devices -l
   ```

   The ADB serial shown here is not the upload port. If Git Bash says `adb: command not found`, install Android Platform-Tools as described above, reopen Git Bash, or provide the full `adb.exe` path using `--adb-path` in the companion command.

4. Open a **second Git Bash terminal** at the project root. Run the pairing command shown in the dashboard, changing `python` to the project virtual-environment interpreter:

   ```bash
   ./.venv313/Scripts/python.exe python/tetoclock_companion.py pair --code PASTE_THE_ONE_TIME_CODE_HERE --api-url http://localhost:3000
   ```

   Replace the example code immediately with the fresh one from the dashboard. Pair within 10 minutes. The companion checks the connected ADB serial and saves a device-specific token in this Windows user's Credential Manager. Only a hash of that token is stored in Tiger Cloud. Pair again on each new PC/user account.

5. Return to the dashboard and select **Refresh clock list after pairing**. Your clock should appear.

If more than one UNO Q is connected, add `--adb-serial SERIAL_FROM_ADB_DEVICES` to the pairing command. Each board must be paired separately.

### 3. Run an alarm and record its response time

1. Select the clock in the dashboard.
2. Choose its alarm options and exact words for Teto, then choose **Save settings**.
3. In Git Bash on the PC connected to that clock, run the dashboard’s alarm command using the virtual-environment Python. It looks like:

   ```bash
   ./.venv313/Scripts/python.exe python/tetoclock_companion.py alarm --device-id CLOCK_ID --api-url http://localhost:3000
   ```

4. Set the current time and alarm time using the potentiometers. Press D9 to switch between the current-time and alarm-time screens. The current time is initialized from the knob positions at boot; adjust it after startup as needed.
5. The board's melody and fan start locally when the clock reaches its alarm time. While the PC companion is connected and running, it plays the generated Teto speech once and records the session after dismissal. Press D9 to stop the alarm. Without the PC, the tone melody and fan still run until D9 is pressed, but there is no ElevenLabs speech.
6. Keep the board powered independently if you unplug it from the PC. The companion must remain running with the board connected over USB/ADB for speech and session recording.

The companion waits for the board's scheduled alarm; the board starts its tone and fan locally and keeps them on until D9 is pressed. Its software clock is not battery-backed, so set the time again after a power loss.

## Quick full test from Git Bash

Run these steps from the project root (the folder containing this README). Use three Git Bash terminals: one for the website, one for Python/ElevenLabs, and one for the board commands.

1. Start the website. In Terminal 1:

   ```bash
   cd frontend
   npm ci
   npm run db:migrate
   npm run dev
   ```

   Keep this terminal open. Visit `http://localhost:3000` and sign in. The `frontend/.env.local` file must contain working Clerk and TigerData settings.

2. Install the Python dependencies. In Terminal 2, from the project root:

   ```bash
   py -3.13 -m venv .venv313
   ./.venv313/Scripts/python.exe -m pip install -r python/requirements.txt
   ```

   If the environment already exists, the `venv` command is harmless; Python 3.13 is recommended so pygame can install from its Windows wheel.

3. Test ElevenLabs **by itself**, before connecting or alarming the board. In Terminal 2:

   ```bash
   ./.venv313/Scripts/python.exe -c "import sys, winsound; sys.path.insert(0, 'python'); from elevenlabs_api import generate_speech; clip = generate_speech('Independent Teto voice test'); print(f'Generated {clip.duration_ms} ms: {clip.path}'); winsound.PlaySound(str(clip.path), winsound.SND_FILENAME)"
   ```

   This reads `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` from the project-root `.env`, calls ElevenLabs, and plays the result through the PC's default audio output. It does not need the website, ADB, or the board. If this step fails, fix the `.env`, API/voice access, network, or PC audio before testing the integrated alarm. Never paste credentials into chat.

4. Upload the sketch. In Terminal 3, from the project root:

   ```bash
   arduino-cli board list
   arduino-cli compile --profile uno_q --upload --port COM3 sketch
   ```

   Replace `COM3` with the UNO Q port shown by `board list`. The selected firmware runs the melody locally, sets D7 high during the alarm, and stops the melody and D7 output when D9 is pressed. **Do not connect a motor directly to D7**; use a suitable driver and separately rated motor power supply with a shared ground.

5. Pair this PC if it has not been paired before. A saved token lives in this Windows user's Credential Manager, so moving to another PC requires a fresh pairing code even if the same clock already appears on the dashboard. In **My TetoClock**, generate a code, then run from Terminal 2:

   ```bash
   adb devices -l
   ./.venv313/Scripts/python.exe python/tetoclock_companion.py pair --code PASTE_FRESH_CODE_HERE --api-url http://localhost:3000
   ```

   If Git Bash says `adb: command not found`, install/locate `adb.exe` and add `--adb-path 'C:/path/to/adb.exe'` to the pairing and alarm commands. Save the clock ID printed after successful pairing.

6. Test speech plus a board output without waiting for the scheduled alarm:

   ```bash
   ./.venv313/Scripts/python.exe python/tests/speech_test.py --text "Teto voice and board output test."
   ```

   This independently checks ElevenLabs again and briefly drives the bridge's D7 output while playing speech through the PC. The actual fan can only be validated if its driver and external power wiring are correct.

7. Test the complete clock alarm and graph. In **My TetoClock**, save a script message and volume. Start the companion using the clock ID from pairing:

   ```bash
   ./.venv313/Scripts/python.exe python/tetoclock_companion.py alarm --device-id YOUR_CLOCK_ID --api-url http://localhost:3000
   ```

   Keep it running. Use the clock's display and D9 switch to select the current-time or alarm-time screen, then adjust the potentiometers so the alarm is a minute or two ahead. At the scheduled time, the board melody/fan and PC speech should run together; press D9 to dismiss. The companion stops the PC speech and submits the response time to TigerData. Dismiss within 120 seconds, then refresh the dashboard to see the graph update.

If the standalone ElevenLabs test passes but step 6 or 7 fails, the API itself works; use the exact companion error to diagnose the ADB/bridge or audio-playback path. If the standalone test fails, debug that first rather than the Arduino sketch.

## Use the app in production with Vercel

The frontend uses server-side API routes, so it cannot use static export.

1. Import the repository into Vercel and set the project’s **Root Directory** to `frontend`.
2. Add the two Clerk production keys in **Project → Settings → Environment Variables**:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk production publishable key.
   - `CLERK_SECRET_KEY` — Clerk production secret key. Mark it as sensitive/secret.
3. Add `TIMESCALE_SERVICE_URL` as a secret environment variable, or add `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and `PGSSLMODE`. Mark the connection string or password as secret. Do **not** use `NEXT_PUBLIC_` for database settings.
4. In Clerk, configure your Vercel production domain and redirect URLs.
5. Deploy from Vercel. Environment-variable changes take effect in a new deployment.
6. On the USB-connected Windows PC, run the companion command using the deployed HTTPS URL, for example:

   ```bash
   ./.venv313/Scripts/python.exe python/tetoclock_companion.py pair --code ONE_TIME_CODE --api-url https://YOUR-APP.vercel.app
   ```

Vercel cannot access USB devices connected to your home PC. Keep the Windows PC and companion running for laptop speech and session reporting; the board's tone-and-fan alarm works without them.

The ElevenLabs credentials are used by the **local Windows companion**, so keep them in the root `.env`; they do not need to be copied to Vercel for this version.

## What is supported and what is not

- Supported: local clock and scheduled alarm, LCD/knob time setting, original repeating tone pattern and fan operation without a PC, optional exact-text ElevenLabs speech from the connected PC companion, physical switch dismissal, and per-device TigerData history.
- Not yet supported: persistent real-time clock across power loss, song-file playback through the tone output, and generating speech from the vibe prompt.
- If a clock is removed in the dashboard, its companion token is revoked. Pair it again to reconnect it.

## Optional or legacy files (not deleted)

These remain in the repository and are **not required for the normal website-plus-companion setup**:

- Root `package-lock.json`: a leftover npm lockfile with no matching root `package.json`; frontend dependencies are managed by `frontend\package.json` and `frontend\package-lock.json`.
- `python\tests\speech_test.py`: a one-shot ElevenLabs speech and board-output check; use `python\tetoclock_companion.py` for scheduled, account-paired clock alarms.
- `python\main.py`: a standalone ElevenLabs WAV-generation helper; it is useful for testing speech without the dashboard or board.
- `frontend/.env.local.example`: an optional credential-free template; it may not be present in every branch and is not an active credentials file.

No non-environment extras were deleted or moved.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `node` or `npm` is not recognized | Install Node.js LTS, close/reopen VS Code, then try `node --version` and `npm --version`. |
<<<<<<< Updated upstream
| Python package install fails | Ensure the project venv exists; run `py -3 -m venv .venv`, then `.\.venv\Scripts\python.exe -m pip install -r python\requirements.txt`. |
| TigerData connection fails | Check the database variable names in `frontend\.env.local`; do not post or share their values. Verify the service is running and run `npm run db:migrate` from `frontend`. |
| Sign-in keys are invalid | Confirm the publishable and secret keys are both from the same Clerk application and environment; restart Next.js after editing `frontend\.env.local`. |
| `adb devices -l` shows no board | Use a USB data cable, reconnect the Uno Q, check App Lab/ADB installation, and approve any authorization prompt. |
<<<<<<< Updated upstream
| Companion reports `consume_alarm_started` is not available | Recompile and upload from the project root with `arduino-cli compile --profile uno_q --upload --port COM3 sketch`, replacing `COM3` with the Uno Q port. The profile pins the compatible Arduino Zephyr core and RouterBridge versions. |
=======
=======
| Python package install fails | Use Python 3.13 and the project environment: `py -3.13 -m venv .venv313`, then `./.venv313/Scripts/python.exe -m pip install -r python/requirements.txt`. |
| pygame install tries to compile from source or fails | Confirm the environment was created with Python 3.13, then rerun the requirements install using `./.venv313/Scripts/python.exe`. |
| ElevenLabs reports missing credentials | Check that the project-root `.env` contains `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`, without `NEXT_PUBLIC_`. Run the standalone speech test before debugging the board; do not share the values. |
| TigerData connection fails | Check the database values in `frontend/.env.local`; do not post or share them. Verify the service is running and run `cd frontend && npm run db:migrate` from Git Bash. |
| Sign-in keys are invalid | Confirm the publishable and secret keys are both from the same Clerk application and environment; restart Next.js after editing `frontend/.env.local`. |
| `adb devices -l` shows no board or `adb` is not found | Use a USB data cable, install Android Platform-Tools, reconnect the Uno Q, and approve any authorization prompt. The ADB serial differs from the Arduino upload port. |
| Companion reports `consume_alarm_started` is not available | Check that `sketch/sketch.yaml` pins Zephyr 1.0.0 and RouterBridge 0.4.3, then recompile/upload from the project root with `arduino-cli compile --profile uno_q --upload --port COM3 sketch`, replacing `COM3` with the UNO Q upload port. |
>>>>>>> Stashed changes
>>>>>>> Stashed changes
| More than one board appears in ADB | Pass `--adb-serial` with the intended board’s serial. |
| Pairing code expired | Generate a new code in the dashboard; each code expires after 10 minutes and can only be used once. |
| No button dismissal is detected | Check the normally-open button wiring between D9 and GND, verify the updated sketch was uploaded, and keep the companion polling the paired board if using PC speech. |
| Speech generation fails | Check `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` in the root `.env`, voice permissions, and PC network access.