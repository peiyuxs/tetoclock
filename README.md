# TETO'Clock

TETO'Clock combines an Arduino UNO Q, a Windows PC companion, and a Next.js dashboard. Sign in, pair each USB-connected clock with its own name and history, save alarm preferences per device, and chart how long it takes to dismiss an alarm.

> **Hardware safety:** the current sketch uses digital pin 3 as a low-current logic output. Do not connect a speaker, motor, or fan directly to pin 3. A normally-open momentary push button between D2 and GND is used to dismiss an alarm. Disconnect board power before changing wiring and verify the UNO Q pinout before connecting anything.

## What runs where

| Component | Purpose |
| --- | --- |
| `frontend/` | Next.js website, Clerk sign-in, server-side API routes, and TigerData access. |
| `python/tetoclock_companion.py` | Windows companion: matches a USB-connected board, reads saved settings, plays speech, and reports a physical button dismissal. |
| `board_app/` | Small Python app deployed to the UNO Q Linux side. It passes authenticated-PC requests to the Arduino sketch using Arduino RouterBridge and reports button events back. |
| `sketch/sketch.ino` | Runs on the UNO Q's microcontroller. Controls the LED and pin 3 output and detects the D2 dismiss button. |
| `python/elevenlabs_api.py` | Generates speech using the ElevenLabs credentials in the repository-root `.env`. |
| `python/main.py` | Optional utility that generates a WAV without running the hardware companion. |
| `python/tests/speech_test.py` | Optional older one-shot speech and hardware test; it is separate from the account-paired dashboard companion. |
| `frontend/migrations/0001_initial.sql` | Creates the database tables for paired devices, preferences, pairing codes, and alarm sessions. |

The Uno Q is connected to a nearby Windows PC by USB-C. The PC runs the companion and sends data over HTTPS to the website. The browser never connects directly to the Arduino or TigerData.

## Beginner setup: install the tools

Use **Windows PowerShell** in VS Code. Whenever these steps say “project folder,” they mean the folder containing `README.md`.

### 1. Install Node.js and npm

1. Download the **LTS** Windows installer from [nodejs.org](https://nodejs.org/en/download/). npm is included with Node.js; you do not install it separately.
2. Run the installer with the default options, including the option to add Node.js to PATH.
3. Close and reopen VS Code.
4. Open **Terminal → New Terminal** and check:

   ```powershell
   node --version
   npm --version
   ```

   Both commands should print version numbers. If PowerShell says that a command is not recognized, restart Windows and try again.

### 2. Install Python

1. Download Python 3.10 or later from [python.org/downloads](https://www.python.org/downloads/).
2. On the first installer screen, select **Add python.exe to PATH**, then install Python.
3. Close and reopen VS Code. In a new PowerShell terminal, check:

   ```powershell
   py --version
   ```

   If `py` is not recognized, reinstall Python and select **Add python.exe to PATH**.

### 3. Create and use a Python virtual environment

A virtual environment (`venv`) keeps this project’s Python packages separate from other projects. Open PowerShell in the project folder and run:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r python\requirements.txt
```

The activation step is optional. You can always use `.venv\Scripts\python.exe` as shown above. If you prefer activation:

```powershell
.\.venv\Scripts\Activate.ps1
python --version
```

If PowerShell refuses to run the activation script, skip activation and keep using `.venv\Scripts\python.exe`. No execution-policy change is needed.

### 4. Install Arduino CLI and check the board

1. Follow the official [Arduino CLI installation guide](https://arduino.github.io/arduino-cli/installation/) for Windows.
2. Connect the UNO Q to the PC with a USB **data** cable, reopen the terminal, and check:

   ```powershell
   arduino-cli version
   arduino-cli board list
   ```

3. The sketch uses the `arduino:zephyr` 0.52.0 core. Install that version if needed:

   ```powershell
   arduino-cli core install arduino:zephyr@0.52.0
   ```

The board’s upload port (for example, `COM6`) is for uploading the sketch. ADB is used separately to communicate with the UNO Q App Lab application.

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

From PowerShell at the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed in the terminal, usually `http://localhost:3000`. Create an account or sign in, then choose **My TetoClock**. Stop the dev server with `Ctrl+C`.

`npm install` downloads frontend packages from `frontend\package-lock.json`. You generally need to run it once after cloning the project or after package dependencies change.

## Connect and pair a physical clock

Each board is registered as its own clock using its USB/ADB serial. A one-time pairing code associates that board with the signed-in user.

### 1. Wire and upload the sketch

1. Disconnect board power before wiring.
2. Connect a **normally open momentary push button** between UNO Q pin **D2** and **GND**. The sketch uses the internal pull-up resistor (`INPUT_PULLUP`); the button input does not need an external supply.
3. Leave pin 3 as a logic output. Do not connect a speaker, motor, or fan directly to it.
4. From the project root, upload the updated sketch. Replace `COM6` with the port from `arduino-cli board list`:

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

4. The PC generates the Teto speech clip, starts the board’s LED and pin 3 signal, and plays the clip on the PC speakers in a loop at the chosen volume.
5. Press the clock’s physical D2 button to dismiss the alarm. The companion stops audio and outputs, then records the session in TigerData. Refresh the dashboard to see the response-time chart.

The hardware has a 120-second safety limit. The current companion starts an alarm **when you run its command**; scheduled/automatic alarms are not implemented.

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

Vercel cannot access USB devices connected to your home PC. Keep the Windows PC and companion involved when running the hardware alarm.

The ElevenLabs credentials are used by the **local Windows companion**, so keep them in the root `.env`; they do not need to be copied to Vercel for this version.

## What is supported and what is not

- Supported: multiple per-user clocks, one-time USB/ADB serial pairing, per-clock saved settings, exact-text ElevenLabs speech, physical button dismissal, and per-device TigerData history.
- Not yet supported: scheduled alarms that run without manually starting the companion, song audio playback (song choices are currently saved preferences only), and generating speech from the vibe prompt (prompts are saved but require an additional voice-generation integration).
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
| More than one board appears in ADB | Pass `--adb-serial` with the intended board’s serial. |
| Pairing code expired | Generate a new code in the dashboard; each code expires after 10 minutes and can only be used once. |
| No button dismissal is detected | Check the normally-open button wiring between D2 and GND, verify the updated sketch was uploaded, and keep the companion polling the paired board. |
| Speech generation fails | Check `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` in the root `.env`, voice permissions, and PC network access. |

## Further hardware safety

- **Speaker:** the salvaged laptop speaker is not part of the current setup. Never connect it directly to a GPIO pin, 3.3 V, 5 V, or GND. A speaker needs a correctly rated audio amplifier.
- **Motor/fan:** pin 3 is a low-current logic signal. Never connect a motor directly to pin 3 or an Arduino power pin.
- Disconnect board power before changing any wiring.
