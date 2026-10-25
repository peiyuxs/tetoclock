"""ADB deployment and command transport for the Uno Q App Lab bridge."""

import shutil
import subprocess
import sys
import time
import uuid
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
APP_SOURCE = PROJECT_ROOT / "board_app"
APP_PATH = "/home/arduino/TetoClockBridge"
BRIDGE_DATA_PATH = f"{APP_PATH}/.bridge"
REQUEST_PATH = f"{BRIDGE_DATA_PATH}/request"
ACK_PATH = f"{BRIDGE_DATA_PATH}/ack"
ACK_TIMEOUT_SECONDS = 20


def find_adb(explicit_path: Path | None = None) -> Path:
    """Find ADB on PATH or in the standard Arduino CLI installation."""
    if explicit_path:
        if explicit_path.is_file():
            return explicit_path
        raise RuntimeError(f"ADB executable not found: {explicit_path}")

    path_adb = shutil.which("adb")
    if path_adb:
        return Path(path_adb)

    adb_root = (
        Path.home()
        / "AppData"
        / "Local"
        / "Arduino15"
        / "packages"
        / "arduino"
        / "tools"
        / "adb"
    )
    candidates = sorted(adb_root.glob("*/adb.exe"), reverse=True)
    if candidates:
        return candidates[0]

    raise RuntimeError(
        "Could not find adb.exe. Install Android Debug Bridge or pass "
        "--adb-path with the adb.exe bundled with Arduino CLI."
    )


class UnoQBridge:
    """Deploy and communicate with the Uno Q's RouterBridge App Lab app."""

    def __init__(self, adb_path: Path, device_serial: str | None = None) -> None:
        self.adb_path = adb_path
        self.device_serial = device_serial

    def _run(
        self,
        *arguments: str,
        check: bool = True,
        timeout: float = 30,
    ) -> subprocess.CompletedProcess[str]:
        command = [str(self.adb_path)]
        if self.device_serial:
            command.extend(["-s", self.device_serial])
        command.extend(arguments)

        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False,
            )
        except subprocess.TimeoutExpired as error:
            raise TimeoutError(
                f"ADB command timed out after {timeout} seconds: "
                f"{' '.join(arguments)}"
            ) from error

        if check and result.returncode != 0:
            details = (result.stderr or result.stdout).strip()
            raise RuntimeError(
                f"ADB command failed ({' '.join(arguments)}): "
                f"{details or f'exit code {result.returncode}'}"
            )
        return result

    def connect(self) -> None:
        """Select the connected Uno Q, requiring an explicit choice if needed."""
        result = self._run("devices")
        devices = [
            line.split()[0]
            for line in result.stdout.splitlines()[1:]
            if len(line.split()) >= 2 and line.split()[1] == "device"
        ]

        if self.device_serial:
            if self.device_serial not in devices:
                raise RuntimeError(
                    f"ADB device {self.device_serial} is not connected. "
                    "Run `adb devices -l` and check the Uno Q connection."
                )
        elif len(devices) == 1:
            self.device_serial = devices[0]
        elif not devices:
            raise RuntimeError(
                "ADB found no connected devices. Connect the Uno Q and run "
                "`adb devices -l` to check its connection."
            )
        else:
            raise RuntimeError(
                "More than one ADB device is connected. Rerun with "
                "--adb-serial and choose the Uno Q serial shown by "
                "`adb devices -l`."
            )

    def deploy_and_start_app(self) -> None:
        """Copy and start the Python bridge app on the Uno Q."""
        self._run(
            "shell",
            "mkdir",
            "-p",
            f"{APP_PATH}/python",
            BRIDGE_DATA_PATH,
        )
        self._run(
            "push",
            str(APP_SOURCE / "app.yaml"),
            f"{APP_PATH}/app.yaml",
        )
        self._run(
            "push",
            str(APP_SOURCE / "python" / "main.py"),
            f"{APP_PATH}/python/main.py",
        )
        self._run(
            "shell",
            "arduino-app-cli",
            "app",
            "stop",
            APP_PATH,
            check=False,
        )

        result = self._run(
            "shell",
            "env",
            "TMPDIR=/tmp",
            "arduino-app-cli",
            "app",
            "start",
            APP_PATH,
            timeout=90,
        )
        if result.stdout.strip():
            print(result.stdout.strip())
        if result.stderr.strip():
            print(result.stderr.strip(), file=sys.stderr)

    def stop_app(self) -> None:
        """Stop the bridge app after the playback session."""
        result = self._run(
            "shell",
            "arduino-app-cli",
            "app",
            "stop",
            APP_PATH,
            check=False,
        )
        if result.returncode != 0:
            details = (result.stderr or result.stdout).strip()
            raise RuntimeError(
                "Could not stop the Uno Q bridge app: "
                f"{details or f'exit code {result.returncode}'}"
            )

    def send_command(self, action: str, duration_ms: int | None = None) -> str:
        """Send a request and wait for its matching App Lab acknowledgement."""
        request_id = uuid.uuid4().hex
        fields = [request_id, action]
        if duration_ms is not None:
            fields.append(str(duration_ms))
        request = " ".join(fields)

        remote_command = (
            f"echo '{request}' > {REQUEST_PATH}.tmp && "
            f"mv {REQUEST_PATH}.tmp {REQUEST_PATH}"
        )
        self._run("shell", remote_command)

        deadline = time.monotonic() + ACK_TIMEOUT_SECONDS
        while time.monotonic() < deadline:
            response = self._run(
                "shell",
                f"cat {ACK_PATH} 2>/dev/null || true",
            ).stdout.strip()
            if response.startswith(f"{request_id} "):
                status = response[len(request_id) + 1 :]
                valid_statuses = {"IDLE", "DISMISSED"} if action == "POLL" else {"OK"}
                if status not in valid_statuses:
                    raise RuntimeError(f"Uno Q Bridge returned an error: {status}")
                return status
            time.sleep(0.2)

        logs = self._run(
            "shell",
            "arduino-app-cli",
            "app",
            "logs",
            APP_PATH,
            check=False,
        )
        log_text = (logs.stdout or logs.stderr).strip()
        raise TimeoutError(
            "Timed out waiting for the Uno Q Bridge app. "
            "Check the board app logs with "
            "`adb shell arduino-app-cli app logs "
            f"{APP_PATH}`.{f' App logs: {log_text}' if log_text else ''}"
        )
