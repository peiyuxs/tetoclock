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