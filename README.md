# TETO'Clock
Afraid of oversleeping on a special occasion, like a hackathon? It's time to say goodbye to multiple alarms… because it's TetO'Clock!

TetO'Clock forces lazy sleepers to actually get up from bed, and vigorously aim for our Kasane Teto-inspired steam train alarm clock. She'll make sure you won't go back to sleep... and turn your easy morning into an annoying, but active challenge with intention and meaning.

# About
[TETO'Clock](https://www.tetoclock.us) is a Kasane Teto-inspired alarm-clock project: a physical UNO Q clock, a companion running on the USB-connected PC, and a website for pairing clocks and viewing wake-up history. The site introduces the project and links to **My TetoClock**, where signed-in users manage their clocks and alarm settings.

## What runs where
| Component | Purpose |
| --- | --- |
| `frontend/` | Next.js website, Clerk sign-in, server-side API routes, and TigerData access. |
| `python/tetoclock_companion.py` | Windows companion: matches a USB-connected board, reads saved settings, waits for the board alarm, plays speech once, and records physical dismissal. |
| `board_app/` | Small Python app deployed to the UNO Q Linux side. It passes requests to the Arduino sketch using Arduino RouterBridge and reports alarm/dismissal events. |
| `sketch/sketch.ino` | Runs the LCD clock, knob-based time/alarm setting, D10 tone melody, D7 fan control, and D9 dismiss switch on the UNO Q microcontroller. |
| `python/elevenlabs_api.py` | Generates speech using the ElevenLabs credentials in the repository-root `.env`. |
| `python/main.py` | Optional utility that generates a WAV without running the hardware companion. |
| `python/tests/speech_test.py` | Optional one-shot ElevenLabs speech and board-output test, separate from the account-paired dashboard companion. |
| `frontend/migrations/0001_initial.sql` | Creates the database tables for paired devices, preferences, pairing codes, and alarm sessions. |

The Arduino sketch keeps the clock, melody, fan, and switch running locally while the board is powered, even without a PC. The clock time resets when the board loses power. ElevenLabs speech requires the USB-connected Windows PC, network access, and the running companion. The browser never connects directly to the Arduino or TigerData.

## Use the live website
Visit [tetoclock.us](https://www.tetoclock.us) for the public project homepage. It introduces the Teto-inspired alarm-clock concept, thanks SBUHacks and the NJIT community, and features a Kasane Teto song gallery. **Pair My TetoClock**, **Try TetoClock!**, and **My TetoClock** lead to the dashboard; sign in or create an account to manage your own clocks.

In **My TetoClock**, you can:
- Create a named clock and pair its UNO Q using the displayed one-time code.
- Choose **Machine Love**, enter **Exact Words** for Teto, set **Alarm Volume**, and save settings for the selected clock.
- View **Wake-Up History**, including average and quickest dismissal times, the session count in the selected range, and the **Time To Get Up** chart. The chart can show the latest 12 sessions or 7 days and refreshes every 10 seconds.

The dashboard also presents a **Vibe Prompt** option, but the current PC companion only generates speech from **Exact Words**. Selecting a vibe prompt does not make it speak; use Exact Words for a working voice alarm. The generated voice plays through the companion PC's audio output, while the clock melody and fan run locally on the board.

## Beginner setup: install the tools
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

### 1. Install Node.js and npm
1. Download the **LTS** Windows installer from [nodejs.org](https://nodejs.org/en/download/). npm is included with Node.js; you do not install it separately.
2. Run the installer with the default options, including the option to add Node.js to PATH.
3. Close and reopen Git Bash, then check:

   ```powershell
   node --version
   npm --version
   ```

   Both commands should print version numbers. If PowerShell says that a command is not recognized, restart Windows and try again.

### 2. Install Python
1. Install Python **3.13** from [python.org/downloads](https://www.python.org/downloads/) or with the Windows Python launcher:

   ```bash
   py install 3.13
   ```

2. Close and reopen Git Bash, then check:

   ```bash
   py -3.13 --version
   ```

   Python 3.13 is recommended: it has a Windows `pygame` wheel. Newer Python versions may not have one yet. If `py` is not found, install Python from python.org and reopen Git Bash.

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

   ```bash
   arduino-cli version
   ```

2. Connect the UNO Q with a USB **data** cable. Install the board core required by the sketch profile:

   ```bash
   arduino-cli core install arduino:zephyr@1.0.0
   ```

   The profile also pins `Arduino_RouterBridge` 0.4.3 and `Arduino_RPClite` 0.3.0. Arduino CLI installs these when compiling the sketch.
3. Install [Android SDK Platform-Tools](https://developer.android.com/tools/releases/platform-tools) if `adb` is not already available. Extract the download, then either add its `platform-tools` folder to Windows PATH and reopen Git Bash, or remember the full path to `adb.exe`.
4. Check the board and ADB:

   ```bash
   arduino-cli board list
   adb devices -l
   ```

   The upload port (such as `COM3`) and ADB serial are different identifiers. ADB should list the UNO Q as `device`, not `unauthorized`; accept any authorization prompt on the board. If Git Bash cannot find `adb`, use the `--adb-path` option with the full `adb.exe` path in the pair/alarm commands below.

## Environment files: exactly what to keep
There are **two real credential files** for local development:

1. **`<project folder>\.env`** — ElevenLabs credentials for the Windows Python companion and speech utility. It should contain:

   ```text
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id
   ```

   Open the existing `.env` file in VS Code and replace the example values with your own. Do not add `NEXT_PUBLIC_` to these names.

2. **`<project folder>\frontend\.env.local`** — Clerk’s local development keys and the TigerData database connection variables used by Next.js and its schema migration. This is the **exact file** in which to paste your own Clerk keys. It already contains Clerk and TigerData variable names.

   Open `frontend\.env.local` in VS Code. Replace **only** the values on these two Clerk lines with the keys for your Clerk application:

   ```text
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_with_your_key
   CLERK_SECRET_KEY=sk_test_replace_with_your_key
   ```

   Keep the other existing Clerk redirect settings and TigerData variables. Do not put `CLERK_SECRET_KEY` or database credentials into a `NEXT_PUBLIC_` variable.

`frontend\.env.local.example` is a **template only**, not a credentials file. It is safe to keep. The extra `frontend\tiger-cloud-tetoclock-credentials.env` copy was removed after verifying that its database connection settings were already in `frontend\.env.local`.

Never paste credentials into chat or commit credential files to Git. The project ignores the root `.env`, `frontend\.env.local`, and the redundant TigerData filename.

## Set up your own Clerk application
The project contains Clerk development authentication setup. To use keys from your own Clerk application:

1. Open the [Clerk Dashboard](https://dashboard.clerk.com/) and create or select an application.
2. In the Clerk application, open **API Keys**. Copy its **Publishable key** and **Secret key**.
3. In VS Code, open `frontend\.env.local`—not the root `.env`.
4. Replace the values for `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` with the matching keys from Clerk. Use **development** keys locally; use **production** keys on your live site.
5. Save the file and restart the frontend dev server (`Ctrl+C`, then `npm run dev`).
6. In Clerk’s dashboard, configure the sign-in methods you want to use. For deployment, configure your production domain and sign-in redirect URLs in Clerk.

The app already has Clerk middleware and `/sign-in` and `/sign-up` pages. The signed-in account owns its paired clocks and data.

## Set up TigerData and create the tables
Tiger Cloud is PostgreSQL with time-series features.

1. Sign in to [Tiger Cloud Console](https://console.cloud.tigerdata.com/) and create a service. Review its plan and pricing.
2. Open the service’s connection details and download the database configuration. Treat the database password like a secret.
3. The credential values supplied for this project have been copied into the ignored `frontend\.env.local`. If you replace the service, update its connection values in that file.
4. Open a terminal at the project root and move into the frontend folder:

   ```powershell
   cd frontend
   ```

5. Apply the schema to the configured TigerData database:

   ```powershell
   npm run db:migrate
   ```

   A successful migration reports how many schema statements it applied. It is safe to run again.

The migration creates:

- `devices`: the Clerk user who owns the clock and the USB/ADB serial used to recognize it.
- `device_settings`: that clock’s saved song choice, Teto message/prompt, and volume.
- `device_pairing_codes`: short-lived, single-use codes for pairing.
- `device_tokens`: hashed companion tokens that can be revoked when a clock is removed.
- `alarm_sessions`: the clock’s time-series history of physical button dismissals.

The server uses `TIMESCALE_SERVICE_URL` if set, or the individual `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and `PGSSLMODE` variables. Database access stays in server-side Next.js API routes; the website never exposes the database password to the browser.

## Run the website locally
The production site is already available at [tetoclock.us](https://www.tetoclock.us); you do not need to run a local server just to visit the project website. To develop the site from this repository, start a local server:

From PowerShell at the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Create an account or sign in, then choose **My TetoClock**. Stop the dev server with `Ctrl+C`.

`npm install` downloads frontend packages from `frontend\package-lock.json`. You generally need to run it once after cloning the project or after package dependencies change.

## Connect and pair a physical clock
Each board is registered as its own clock using its USB/ADB serial. A one-time pairing code associates that board with the signed-in user.

### 1. Wire and upload the sketch
1. Disconnect board power before wiring.
2. Wire the LCD: RS to D12, E to D11, D4 to D5, D5 to D4, D6 to D3, D7 to D2, and K to D6. Check the display module's backlight current requirements; add a current-limiting resistor if it does not already include one.
3. Connect the normally-open momentary dismiss switch between D9 and GND. The sketch uses `INPUT_PULLUP`; the switch does not need an external supply.
4. Connect the buzzer/tone output to D10 through suitable audio hardware. Connect the fan control to D7 through a transistor or motor driver.
5. Connect the hour and minute potentiometer wipers to A0 and A1, respectively, with their outer terminals wired to the board's appropriate power and ground.
6. From the project root, upload the updated sketch. Replace `COM6` with the port from `arduino-cli board list`:

   ```powershell
   arduino-cli compile --profile uno_q --upload --port COM6 sketch
   ```

### 2. Generate a pairing code and pair over USB
1. Start the website with `npm run dev` from the `frontend` folder, sign in, then open **My TetoClock**.
2. Enter a clock name, such as `Bedroom clock`, then choose **Generate pairing code**.
3. Connect that UNO Q to the PC running the Python companion. Confirm it appears in ADB:

   ```powershell
   adb devices -l
   ```

   If the command is not found, open the Arduino App Lab/Arduino CLI environment that includes ADB, or use the full `adb.exe` path via the companion’s optional `--adb-path` argument.

4. Open a **second** PowerShell terminal at the project root. Run the pairing command shown in the dashboard. It looks like:

   ```powershell
   .\.venv\Scripts\python.exe python\tetoclock_companion.py pair --code PASTE_THE_ONE_TIME_CODE_HERE --api-url http://localhost:3000
   ```

   Pair within 10 minutes. The companion checks the connected ADB serial and saves a device-specific token in Windows Credential Manager. Only a hash of that token is stored in TigerData.

5. Return to the dashboard and select **Refresh clock list after pairing**. Your clock should appear.

If more than one UNO Q is connected, add `--adb-serial SERIAL_FROM_ADB_DEVICES` to the pairing command. Each board must be paired separately.

### 3. Run an alarm and record its response time
1. Select the clock in the dashboard.
2. Choose its alarm options and exact words for Teto, then choose **Save settings**.
3. In the PowerShell terminal on the PC connected to that clock, run the dashboard’s alarm command. It looks like:

   ```powershell
   .\.venv\Scripts\python.exe python\tetoclock_companion.py alarm --device-id CLOCK_ID --api-url http://localhost:3000
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

   ```powershell
   .\.venv\Scripts\python.exe python\tetoclock_companion.py pair --code ONE_TIME_CODE --api-url https://YOUR-APP.vercel.app
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
- `python\tests\speech_test.py`: the older one-shot speech/LED integration test; use `python\tetoclock_companion.py` for account-paired clocks.
- `python\main.py`: a standalone ElevenLabs WAV-generation helper; it is useful for testing speech without the dashboard or board.
- `frontend\.env.local.example`: a credential-free environment template; it is not an active environment file.

No non-environment extras were deleted or moved.

## Troubleshooting
| Problem | What to check |
| --- | --- |
| `node` or `npm` is not recognized | Install Node.js LTS, close/reopen VS Code, then try `node --version` and `npm --version`. |
| Python package install fails | Ensure the project venv exists; run `py -3 -m venv .venv`, then `.\.venv\Scripts\python.exe -m pip install -r python\requirements.txt`. |
| TigerData connection fails | Check the database variable names in `frontend\.env.local`; do not post or share their values. Verify the service is running and run `npm run db:migrate` from `frontend`. |
| Sign-in keys are invalid | Confirm the publishable and secret keys are both from the same Clerk application and environment; restart Next.js after editing `frontend\.env.local`. |
| `adb devices -l` shows no board | Use a USB data cable, reconnect the Uno Q, check App Lab/ADB installation, and approve any authorization prompt. |
| Companion reports `consume_alarm_started` is not available | Recompile and upload from the project root with `arduino-cli compile --profile uno_q --upload --port COM3 sketch`, replacing `COM3` with the Uno Q port. The profile pins the compatible Arduino Zephyr core and RouterBridge versions. |
| More than one board appears in ADB | Pass `--adb-serial` with the intended board’s serial. |
| Pairing code expired | Generate a new code in the dashboard; each code expires after 10 minutes and can only be used once. |
| No button dismissal is detected | Check the normally-open button wiring between D9 and GND, verify the updated sketch was uploaded, and keep the companion polling the paired board if using PC speech. |
| Speech generation fails | Check `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` in the root `.env`, voice permissions, and PC network access.