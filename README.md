# TETO'Clock
Afraid of oversleeping on a special occasion, like a hackathon? It's time to say goodbye to multiple alarms… because it's TetO'Clock!

TetO'Clock forces lazy sleepers to actually get up from bed, and vigorously aims for our Kasane Teto-inspired steam train alarm clock. She'll make sure you won't go back to sleep… and turn your easy morning into an annoying, but active challenge with intention and meaning.

# About
[TETO'Clock](https://www.tetoclock.us) is a Kasane Teto-inspired alarm-clock project: a physical UNO Q clock, a companion running on the USB-connected PC, and a website for pairing clocks and viewing wake-up history. The site introduces the project and links to **My TetoClock**, where signed-in users manage their clocks and alarm settings.

## What runs where
| Component | Purpose |
| --- | --- |
| `frontend/` | Next.js website, Clerk sign-in, server-side API routes, and TigerData access. |
| `python/tetoclock_companion.py` | Windows companion: matches a USB-connected board, reads saved settings, waits for the board alarm, plays speech once, and records physical dismissal. |
| `board_app/` | Small Python app deployed to the UNO Q Linux side. It passes requests to the Arduino sketch using Arduino RouterBridge and reports alarm/dismissal events. |
| `sketch/sketch.ino` | Runs the LCD clock, knob-based time/alarm setting, Machine Love melody on D10, fan control on D7, and dismiss switch on D9. |
| `python/elevenlabs_api.py` | Generates speech using the ElevenLabs credentials in the repository-root `.env`. |
| `python/main.py` | Optional utility that generates a WAV without running the hardware companion. |
| `python/tests/speech_test.py` | Optional one-shot ElevenLabs speech and board-output test. Not required for normal use. |
| `frontend/migrations/0001_initial.sql` | Creates the database tables for paired devices, preferences, pairing codes, and alarm sessions. |

The Arduino sketch keeps the clock, melody, fan, and switch running locally while the board is powered, even without a PC. The clock time resets when the board loses power. ElevenLabs speech requires the USB-connected Windows PC, network access, and the running companion. The browser never connects directly to the Arduino or TigerData.

## Use the live website
Visit [tetoclock.us](https://www.tetoclock.us) for the public project homepage. **Pair My TetoClock**, **Try TetoClock!**, and **My TetoClock** lead to the dashboard; sign in or create an account to manage your own clocks.

In **My TetoClock**, you can:

- Create a named clock and pair its UNO Q using the displayed one-time code.
- Choose **Machine Love**, enter **Exact Words** for Teto, set **Alarm Volume**, and save settings for the selected clock.
- View **Wake-Up History**, including average and quickest dismissal times, the session count in the selected range, and the **Time To Get Up** chart. The chart can show the latest 12 sessions or 7 days and refreshes every 10 seconds.

The dashboard also presents a **Vibe Prompt** option, but the current PC companion only generates speech from **Exact Words**. Selecting a vibe prompt does not make it speak; use Exact Words for a working voice alarm. The generated voice plays through the companion PC's audio output, while the clock melody and fan run locally on the board.

---

# Beginner setup
The commands in this document are written for **Git Bash on Windows** (installed with Git for Windows). The **project root** is the `tetoclock` folder containing this README. Every command starting with `./` assumes Git Bash is open in that folder.

If a command starts with `./.venv313/Scripts/python.exe`, that is the project's Python virtual environment. You do not need to "activate" it; typing the full path always works.

## 0. Get the project
1. Install [Git for Windows](https://git-scm.com/download/win) (this includes Git Bash) and [Visual Studio Code](https://code.visualstudio.com/).
2. In Git Bash, clone the repository and enter it:

   ```bash
   git clone https://github.com/peiyuxs/tetoclock.git
   cd tetoclock
   ```

   If a teammate has already given you the project folder, open Git Bash inside that folder instead and skip the `git clone`.

3. Confirm you are at the project root:

   ```bash
   pwd
   ls
   ```

   You should see `README.md`, `frontend`, `python`, and `sketch`.

## 1. Install Node.js
1. Download the **LTS** Windows installer from [nodejs.org](https://nodejs.org/en/download/). npm is included; you do not install it separately.
2. Run the installer with defaults, including the option to add Node.js to PATH.
3. Close and reopen Git Bash, then check:

   ```bash
   node --version
   npm --version
   ```

   Both should print a version number.

## 2. Install Python 3.13
1. Install Python **3.13** from [python.org/downloads](https://www.python.org/downloads/) or with the Windows Python launcher:

   ```bash
   py install 3.13
   ```

2. Close and reopen Git Bash, then check:

   ```bash
   py -3.13 --version
   ```

   Python 3.13 is recommended: it has a Windows `pygame` wheel. Newer Python versions may not.

## 3. Create the Python environment and install packages
Run these from the project root. The virtual environment keeps this project's packages separate from your system Python:

```bash
py -3.13 -m venv .venv313
./.venv313/Scripts/python.exe -m pip install --upgrade pip
./.venv313/Scripts/python.exe -m pip install -r python/requirements.txt
```

Use `./.venv313/Scripts/python.exe` for every Python command in this document. No activation is needed; the path always works.

## 4. Install Arduino CLI, the board core, and ADB
This is the longest setup step. Do it in order.

### 4a. Arduino CLI
1. Install [Arduino CLI](https://arduino.github.io/arduino-cli/installation/) for Windows.
2. Reopen Git Bash and check:

   ```bash
   arduino-cli version
   ```

   If the command is not found, the CLI folder is not on PATH. Close and reopen Git Bash (PATH changes need a new shell), and try again.

### 4b. The UNO Q board core
Connect the UNO Q to the PC with a USB **data** cable, then install the board core required by the sketch profile:

```bash
arduino-cli core install arduino:zephyr@1.0.0
```

The profile also pins `Arduino_RouterBridge` 0.4.3 and `Arduino_RPClite` 0.3.0. Arduino CLI installs these automatically when compiling the sketch; you do not install them yourself.

### 4c. ADB (Android Debug Bridge)
The companion talks to the UNO Q's Linux side over ADB. Follow these steps exactly.

1. Download **Android SDK Platform-Tools** from [developer.android.com/tools/releases/platform-tools](https://developer.android.com/tools/releases/platform-tools). Choose the Windows download.
2. Extract the ZIP. Move the extracted `platform-tools` folder somewhere permanent, for example:

   ```text
   C:\Users\<your-name>\platform-tools
   ```

   Do **not** leave it inside your Downloads folder or inside the project folder; both can be cleaned up later.

3. Add that folder to PATH:
   - Press **Win**, type **environment variables**, and choose **Edit the system environment variables**.
   - Click **Environment Variables…**
   - Under **User variables**, select **Path** and click **Edit…**
   - Click **New**, paste the full path to `platform-tools` (for example `C:\Users\caaby\platform-tools`), click **OK**, **OK**, **OK**.
4. Close and reopen Git Bash. This is required; PATH changes don't apply to already-open terminals.
5. Verify ADB is visible:

   ```bash
   adb version
   ```

   It should print something like `Android Debug Bridge version 1.0.41`. If you see `command not found`, the PATH step did not take effect — reopen Git Bash and try again, and double-check that `adb.exe` is directly inside the folder you added.

6. Connect the UNO Q with the USB data cable, then check:

   ```bash
   adb devices -l
   ```

   You should see one line ending in `device`. If it says `unauthorized`, look at the board for an authorization prompt and accept it. If the list is empty:
   - Try a different USB port.
   - Try a different USB cable (some are power-only).
   - Run `adb kill-server` then `adb devices -l` again.

   If Git Bash still can't find `adb` after step 5, you can skip the PATH step entirely and pass the full path with the companion's `--adb-path` argument (for example `--adb-path 'C:/Users/caaby/platform-tools/adb.exe'`). The companion accepts this on every `pair` and `alarm` command.

### 4d. Confirm both tools see the board
```bash
arduino-cli board list
adb devices -l
```

`arduino-cli board list` shows an upload port such as `COM3`. `adb devices -l` shows the ADB serial. These are **different identifiers** — the upload port is used for `arduino-cli --upload`, the ADB serial is used for pairing and alarm commands. Note both down.

---

# Environment files: exactly what to keep
There are **two real credential files** for local development.

1. **`<project root>/.env`** — ElevenLabs credentials for the Windows Python companion and speech utility. It should contain:

   ```text
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id
   ```

   Open the existing `.env` in VS Code and replace the example values with your own. Do not add `NEXT_PUBLIC_` to these names.

2. **`<project root>/frontend/.env.local`** — Clerk's local development keys and the TigerData database connection variables used by Next.js and its schema migration. Open it in VS Code and replace **only** the two Clerk lines with the keys for your Clerk application:

   ```text
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_with_your_key
   CLERK_SECRET_KEY=sk_test_replace_with_your_key
   ```

   Keep the other existing Clerk redirect settings and TigerData variables. Do not put `CLERK_SECRET_KEY` or database credentials into a `NEXT_PUBLIC_` variable.

`frontend/.env.local.example` is a **template only**, not a credentials file. It is safe to keep.

Never paste credentials into chat or commit credential files to Git. The project's `.gitignore` already excludes the root `.env` and `frontend/.env.local`.

## Set up your own Clerk application
The project contains Clerk development authentication setup. To use keys from your own Clerk application:

1. Open the [Clerk Dashboard](https://dashboard.clerk.com/) and create or select an application.
2. In the Clerk application, open **API Keys**. Copy its **Publishable key** and **Secret key**.
3. In VS Code, open `frontend/.env.local` — not the root `.env`.
4. Replace `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` with the matching keys. Use **development** keys locally; use **production** keys on your live site.
5. Save the file and restart the frontend dev server (`Ctrl+C`, then `npm run dev`).
6. In Clerk's dashboard, configure the sign-in methods you want. For deployment, configure your production domain and sign-in redirect URLs in Clerk.

The app already has Clerk middleware and `/sign-in` and `/sign-up` pages. The signed-in account owns its paired clocks and data.

## Set up TigerData and create the tables
Tiger Cloud is PostgreSQL with time-series features.

1. Sign in to [Tiger Cloud Console](https://console.cloud.tigerdata.com/) and create a service. Review its plan and pricing.
2. Open the service's connection details and download the database configuration. Treat the database password like a secret.
3. The credential values supplied for this project have been copied into the ignored `frontend/.env.local`. If you replace the service, update its connection values in that file.
4. From the project root, apply the schema:

   ```bash
   cd frontend
   npm install
   npm run db:migrate
   cd ..
   ```

   A successful migration reports how many schema statements it applied. It is safe to run again.

The migration creates `devices`, `device_settings`, `device_pairing_codes`, `device_tokens`, and `alarm_sessions`. The server uses `TIMESCALE_SERVICE_URL` if set, or the individual `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and `PGSSLMODE` variables. Database access stays in server-side Next.js API routes; the website never exposes the database password to the browser.

---

# Run the website
The production site is already available at [tetoclock.us](https://www.tetoclock.us). You only need to run it locally if you are developing the site.

From the project root:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Create an account or sign in, then choose **My TetoClock**. Stop the dev server with `Ctrl+C`.

`npm install` downloads packages from `frontend/package-lock.json`. Re-run it after pulling package dependency changes.

---

# Connect and pair a physical clock
Each board is registered as its own clock using its USB/ADB serial. A one-time pairing code associates that board with the signed-in user.

## 1. Wire and upload the sketch
1. Disconnect board power before wiring.
2. Wire the LCD: RS to D12, E to D11, D4 to D5, D5 to D4, D6 to D3, D7 to D2, and K to D6. Check the display module's backlight current requirements; add a current-limiting resistor if it does not already include one.
3. Connect the normally-open momentary dismiss switch between D9 and GND. The sketch uses `INPUT_PULLUP`; the switch does not need an external supply.
4. Connect the buzzer/tone output to D10 through suitable audio hardware. Connect the fan control to D7 through a transistor or motor driver. **Do not connect a motor directly to D7**; use a suitable driver and separately rated motor power supply with a shared ground.
5. Connect the hour and minute potentiometer wipers to A0 and A1, with outer terminals wired to the board's appropriate power and ground.
6. From the project root, upload the sketch. Replace `COM3` with the port from `arduino-cli board list`:

   ```bash
   arduino-cli compile --profile uno_q --upload --port COM3 sketch
   ```

## 2. Generate a pairing code and pair over USB
1. If the website is not already running, start it from the project root:

   ```bash
   cd frontend
   npm run dev
   ```

   Leave this terminal open. Visit `http://localhost:3000`, sign in, open **My TetoClock**.

2. Enter a clock name, such as `Bedroom clock`, then choose **Generate pairing code**. Copy the code.

3. Open a **second** Git Bash terminal at the project root. Confirm the board appears in ADB:

   ```bash
   adb devices -l
   ```

4. Run the pairing command from that second terminal, pasting the code from step 2:

   ```bash
   ./.venv313/Scripts/python.exe python/tetoclock_companion.py pair --code PASTE_THE_ONE_TIME_CODE_HERE --api-url http://localhost:3000
   ```

   If you are pairing against the live site instead of your local server, change `--api-url http://localhost:3000` to `--api-url https://www.tetoclock.us`.

   Pair within 10 minutes. The companion checks the connected ADB serial and saves a device-specific token in Windows Credential Manager. Only a hash of that token is stored in TigerData.

5. Return to the dashboard, choose **Refresh clock list after pairing**. Your clock should appear. Note the **clock ID** printed by the pairing command; you will need it in step 3.

If more than one UNO Q is connected, add `--adb-serial SERIAL_FROM_ADB_DEVICES` (the serial from `adb devices -l`) to the pairing and alarm commands. Each board must be paired separately.

## 3. Run an alarm and record its response time
1. In **My TetoClock**, select the clock, choose its alarm options and exact words for Teto, then choose **Save settings**. Confirm the volume is nonzero.
2. In the Git Bash terminal at the project root, run the alarm command:

   ```bash
   ./.venv313/Scripts/python.exe python/tetoclock_companion.py alarm --device-id YOUR_CLOCK_ID --api-url http://localhost:3000
   ```

   Again, replace `--api-url http://localhost:3000` with `--api-url https://www.tetoclock.us` if you are using the live site. Leave the terminal running.

3. On the board, use the potentiometers and D9 switch to set the current time and alarm time. Press D9 to switch between the **CURRENT TIME** and **SET ALARM TIME** screens. The current time is initialized from the knob positions at boot; adjust after startup.

   **Important:** after every reset or replug, the alarm time defaults back to the current time, which means it will not fire until the same time tomorrow. Always set the alarm after the last reset.

4. At the scheduled time, the board starts the Machine Love melody and fan locally, and the PC companion plays the Teto speech once. Press D9 to dismiss. The companion stops the PC speech and submits the response time to TigerData.

5. Dismiss within 120 seconds, then refresh the dashboard to see the graph update.

Without the PC, the melody and fan still run until D9 is pressed, but there is no ElevenLabs speech and no session is recorded.

---

# Test the pieces independently
Use this section only if something in step 3 does not work. Run each test in its own terminal at the project root.

## Test ElevenLabs alone
This reads `.env`, calls ElevenLabs, saves a WAV, and plays it through the PC's default audio output. It does not touch the board, the website, or ADB:

```bash
./.venv313/Scripts/python.exe -c "import sys, winsound; sys.path.insert(0, 'python'); from elevenlabs_api import generate_speech; clip = generate_speech('Independent Teto voice test'); print(f'Generated {clip.duration_ms} ms: {clip.path}'); winsound.PlaySound(str(clip.path), winsound.SND_FILENAME)"
```

If this fails, fix `.env`, API/voice access, network, or PC audio before testing the integrated alarm. Never paste credentials into chat.

## Test the board bridge without waiting for the alarm
This drives the bridge's `D7` output briefly while playing speech through the PC. The actual fan can only be validated if its driver and external power wiring are correct:

```bash
./.venv313/Scripts/python.exe python/tests/speech_test.py --text "Teto voice and board output test."
```

## Read board-side logs
If the alarm command reports `Timed out waiting for the Uno Q Bridge app` or a Bridge error, get the board-side logs:

```bash
adb shell arduino-app-cli app logs /home/arduino/TetoClockBridge
```

---

# Use the app in production with Vercel
The frontend uses server-side API routes, so it cannot use static export.

1. Import the repository into Vercel and set the project's **Root Directory** to `frontend`.
2. Add the two Clerk production keys in **Project → Settings → Environment Variables**:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk production publishable key.
   - `CLERK_SECRET_KEY` — Clerk production secret key. Mark it as sensitive.
3. Add `TIMESCALE_SERVICE_URL` as a secret environment variable, or add `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and `PGSSLMODE`. Mark the connection string or password as secret. Do **not** use `NEXT_PUBLIC_` for database settings.
4. In Clerk, configure your Vercel production domain and redirect URLs.
5. Deploy from Vercel. Environment-variable changes take effect in a new deployment.
6. On the USB-connected Windows PC, run the companion commands using the deployed HTTPS URL:

   ```bash
   ./.venv313/Scripts/python.exe python/tetoclock_companion.py pair --code ONE_TIME_CODE --api-url https://YOUR-APP.vercel.app
   ```

Vercel cannot access USB devices connected to your home PC. Keep the Windows PC and companion running for laptop speech and session reporting; the board's melody-and-fan alarm works without them.

The ElevenLabs credentials are used by the **local Windows companion**, so keep them in the root `.env`; they do not need to be copied to Vercel for this version.

---

# What is supported and what is not
- Supported: local clock and scheduled alarm, LCD/knob time setting, Machine Love melody and fan operation without a PC, optional exact-text ElevenLabs speech from the connected PC companion, physical switch dismissal, and per-device TigerData history.
- Not yet supported: persistent real-time clock across power loss, song-file playback through the tone output, and generating speech from the vibe prompt.
- If a clock is removed in the dashboard, its companion token is revoked. Pair it again to reconnect it.

## Optional or legacy files (not deleted)
- Root `package-lock.json`: a leftover npm lockfile with no matching root `package.json`; frontend dependencies are managed by `frontend/package.json` and `frontend/package-lock.json`.
- `python/tests/speech_test.py`: the older one-shot speech/LED integration test; use `python/tetoclock_companion.py` for account-paired clocks, or this test only for diagnosing.
- `python/main.py`: a standalone ElevenLabs WAV-generation helper; useful for testing speech without the dashboard or board.
- `frontend/.env.local.example`: a credential-free environment template; not an active environment file.

---

# Troubleshooting
| Problem | What to check |
| --- | --- |
| `node` or `npm` is not recognized | Install Node.js LTS, close/reopen Git Bash, then try `node --version` and `npm --version`. |
| `python.exe` is not found at `./.venv313/Scripts/` | Run `pwd` and confirm you are at the project root; run `ls` and confirm `.venv313` exists; if not, repeat step 3. |
| Python package install fails | Confirm you installed Python 3.13 (`py -3.13 --version`), then rerun `py -3.13 -m venv .venv313` and the pip install. |
| `adb: command not found` | PATH step (4c) did not take effect. Reopen Git Bash, run `adb version`. If still missing, use `--adb-path 'C:/path/to/adb.exe'` on every `pair`/`alarm` command instead of editing PATH. |
| `adb devices -l` shows no board | Use a USB data cable, reconnect the Uno Q, check App Lab/ADB installation, and approve any authorization prompt on the board. Try `adb kill-server` then `adb devices -l`. |
| `adb devices -l` shows `unauthorized` | Look at the board for a prompt and accept it, then rerun `adb devices -l`. |
| More than one board appears in ADB | Pass `--adb-serial` with the intended board's serial (from `adb devices -l`). |
| Companion reports `consume_alarm_started` is not available | Recompile and upload with `arduino-cli compile --profile uno_q --upload --port COM3 sketch`, replacing `COM3` with the Uno Q port. The profile pins the compatible Zephyr core and RouterBridge versions. |
| `Timed out waiting for the Uno Q Bridge app` | Read the board-side logs with `adb shell arduino-app-cli app logs /home/arduino/TetoClockBridge`. Common causes: the board was still booting when the companion tried to start the app (retry once), or a bridge method name changed on the board. |
| Pairing code expired | Generate a new code in the dashboard; each code expires after 10 minutes and can only be used once. |
| No button dismissal is detected | Check the normally-open button wiring between D9 and GND, verify the updated sketch was uploaded, and keep the companion polling the paired board if using PC speech. |
| Speech generation fails | Check `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` in the root `.env`, voice permissions, and PC network access. |
| Alarm never fires while the companion is polling | After every reset, the alarm defaults to the current time (24 h away). Press D9, set an alarm 1–2 minutes ahead, then press D9 again to return to the current-time screen. |
