"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";

type AlarmSettings = {
  song: string;
  messageMode: "script" | "prompt";
  message: string;
  volume: number;
};

type Clock = {
  id: string;
  name: string;
  deviceSerial: string;
  createdAt: string;
  lastSeenAt: string | null;
  settings: AlarmSettings | null;
};

type AlarmSession = {
  id: string;
  dismissed_at: string;
  alarm_started_at: string;
  response_ms: number;
};

type ApiError = { error?: string };

const DEFAULT_SETTINGS: AlarmSettings = {
  song: "Teto's morning mix",
  messageMode: "script",
  message: "Good morning! The train is waiting for you!",
  volume: 68,
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  let result: T | ApiError;
  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }
  if (!response.ok) {
    const errorMessage =
      typeof result === "object" && result !== null && "error" in result
        ? result.error
        : undefined;
    throw new Error(
      typeof errorMessage === "string" ? errorMessage : "The request could not be completed.",
    );
  }
  return result as T;
}

function formatMinutes(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function ResponseChart({ sessions }: { sessions: AlarmSession[] }) {
  const points = [...sessions].reverse().map((session, index, all) => {
    const minutes = session.response_ms / 60_000;
    const x = all.length < 2 ? 360 : 48 + (index * 624) / (all.length - 1);
    const maxMinutes = Math.max(
      2,
      Math.ceil(Math.max(...all.map((item) => item.response_ms / 60_000), 0) / 2) * 2,
    );
    const y = 22 + ((maxMinutes - minutes) / maxMinutes) * 174;
    return {
      x,
      y,
      day: new Date(session.dismissed_at)
        .toLocaleDateString(undefined, { weekday: "short" })
        .toUpperCase(),
    };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length
    ? `${points[0].x},196 ${line} ${points[points.length - 1].x},196`
    : "";
  const maxMinutes = Math.max(
    2,
    Math.ceil(Math.max(...sessions.map((item) => item.response_ms / 60_000), 0) / 2) * 2,
  );
  const ticks = [maxMinutes, maxMinutes * 0.75, maxMinutes * 0.5, maxMinutes * 0.25, 0];

  if (sessions.length === 0) {
    return <div className="chart-empty">Dismiss an alarm with the physical clock button to start your history.</div>;
  }

  return (
    <div className="chart-wrap">
      <div className="chart-axis-label">TIME TO STOP ALARM · MINUTES</div>
      <svg
        className="response-chart"
        viewBox="0 0 720 238"
        role="img"
        aria-label={`Alarm dismissal times for ${sessions.length} sessions`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#d72727" stopOpacity=".22" />
            <stop offset="100%" stopColor="#d72727" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => {
          const y = 22 + ((maxMinutes - tick) / maxMinutes) * 174;
          return (
            <g key={tick}>
              <line x1="48" x2="690" y1={y} y2={y} className="chart-gridline" />
              <text x="36" y={y + 4} className="chart-tick" textAnchor="end">
                {Number.isInteger(tick) ? tick : tick.toFixed(1)}
              </text>
            </g>
          );
        })}
        <polygon points={area} fill="url(#chart-fill)" />
        <polyline points={line} className="chart-line" />
        {points.map((point, index) => (
          <g key={`${point.day}-${index}`}>
            <circle cx={point.x} cy={point.y} r="5" className="chart-point" />
            <text x={point.x} y="220" className="chart-tick" textAnchor="middle">
              {point.day}
            </text>
          </g>
        ))}
      </svg>
      <div className="chart-legend"><span /> Alarm stop time</div>
    </div>
  );
}

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const [clocks, setClocks] = useState<Clock[]>([]);
  const [selectedClockId, setSelectedClockId] = useState("");
  const [settings, setSettings] = useState<AlarmSettings>(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState<AlarmSession[]>([]);
  const [range, setRange] = useState("12 sessions");
  const [clockName, setClockName] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [pairingCommand, setPairingCommand] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [apiOrigin, setApiOrigin] = useState("");
  const selectedClock = clocks.find((clock) => clock.id === selectedClockId);

  const loadClocks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await requestJson<{ clocks: Clock[] }>("/api/clocks");
      setClocks(result.clocks);
      setSelectedClockId((current) =>
        result.clocks.some((clock) => clock.id === current)
          ? current
          : result.clocks[0]?.id ?? "",
      );
      setSignedOut(false);
      setNotice("");
      setNoticeError(false);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Sign in")) {
        setSignedOut(true);
      } else {
        setNoticeError(true);
        setNotice(error instanceof Error ? error.message : "Could not load your clocks.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setApiOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      void loadClocks();
    } else {
      setSignedOut(true);
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, loadClocks]);

  useEffect(() => {
    if (!selectedClock) {
      setSettings(DEFAULT_SETTINGS);
      setSessions([]);
      return;
    }

    setSettings(selectedClock.settings ?? DEFAULT_SETTINGS);
    let active = true;
    const query = range === "7 days" ? "?range=7days" : "";
    void requestJson<{ sessions: AlarmSession[] }>(
      `/api/clocks/${selectedClock.id}/sessions${query}`,
    )
      .then((result) => {
        if (active) setSessions(result.sessions);
      })
      .catch((error: unknown) => {
        if (active) {
          setNoticeError(true);
          setNotice(error instanceof Error ? error.message : "Could not load alarm history.");
        }
      });

    return () => {
      active = false;
    };
  }, [selectedClock, range]);

  const stats = useMemo(() => {
    if (sessions.length === 0) {
      return { average: null, quickest: null, count: 0 };
    }
    const times = sessions.map((session) => session.response_ms);
    return {
      average: times.reduce((total, time) => total + time, 0) / times.length,
      quickest: Math.min(...times),
      count: sessions.length,
    };
  }, [sessions]);

  function updateSettings(patch: Partial<AlarmSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
    setSaved(false);
    setNotice("");
    setNoticeError(false);
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClock) return;
    setSaving(true);
    try {
      await requestJson(`/api/clocks/${selectedClock.id}/settings`, {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setClocks((current) =>
        current.map((clock) =>
          clock.id === selectedClock.id ? { ...clock, settings } : clock,
        ),
      );
      setSaved(true);
      setNoticeError(false);
      setNotice("Settings saved to your TigerData account for this clock.");
    } catch (error) {
      setSaved(false);
      setNoticeError(true);
      setNotice(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function addClock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = clockName.trim();
    if (!name) return;
    try {
      const result = await requestJson<{
        pairingCode: string;
      }>("/api/clocks", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setPairingCode(result.pairingCode);
      setPairingCommand(
        `python python\\tetoclock_companion.py pair --code ${result.pairingCode} --api-url ${window.location.origin}`,
      );
      setClockName("");
      setNotice("Pairing code created. Connect the clock within 10 minutes.");
      setNoticeError(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create a pairing code.");
      setNoticeError(true);
    }
  }

  async function removeClock() {
    if (!selectedClock || !window.confirm(`Remove ${selectedClock.name} and revoke its companion access?`)) {
      return;
    }
    try {
      await requestJson(`/api/clocks/${selectedClock.id}`, { method: "DELETE" });
      setPairingCode("");
      setPairingCommand("");
      await loadClocks();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not remove this clock.");
      setNoticeError(true);
    }
  }

  async function copyPairingCommand() {
    try {
      await navigator.clipboard.writeText(pairingCommand);
      setNotice("Pairing command copied.");
      setNoticeError(false);
    } catch {
      setNotice("Clipboard access is blocked. Copy the command manually.");
      setNoticeError(true);
    }
  }

  if (signedOut) {
    return (
      <div className="sign-in-panel panel">
        <p className="eyebrow">Your private dashboard</p>
        <h2>Sign in to see your clocks</h2>
        <p>Your devices, alarm preferences, and history are saved to your account.</p>
        <SignInButton mode="modal">
          <button className="button button--primary" type="button">Sign in to continue</button>
        </SignInButton>
      </div>
    );
  }

  const companionCommand = selectedClock
    ? `python python\\tetoclock_companion.py alarm --device-id ${selectedClock.id}${apiOrigin ? ` --api-url ${apiOrigin}` : ""}`
    : "";

  return (
    <div className="dashboard-grid">
      <section className="settings-card panel">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Your connected hardware</p>
            <h2>My clocks</h2>
          </div>
          <span className="card-icon" aria-hidden="true">✳</span>
        </div>

        {clocks.length > 0 && (
          <>
            <label className="field-label" htmlFor="clock-select">Selected clock</label>
            <div className="select-wrap">
              <select
                id="clock-select"
                value={selectedClockId}
                onChange={(event) => setSelectedClockId(event.target.value)}
              >
                {clocks.map((clock) => (
                  <option key={clock.id} value={clock.id}>{clock.name}</option>
                ))}
              </select>
              <span aria-hidden="true">⌄</span>
            </div>
            <p className="field-hint">
              USB / ADB serial: <code>{selectedClock?.deviceSerial}</code>
            </p>
            <p className="field-hint">
              {selectedClock?.lastSeenAt
                ? `Last companion check-in: ${new Date(selectedClock.lastSeenAt).toISOString()}`
                : "The companion has not checked in yet."}
            </p>
            <button className="remove-clock-button" type="button" onClick={removeClock}>
              Remove selected clock
            </button>
          </>
        )}

        <form className="add-clock-form" onSubmit={addClock}>
          <label className="field-label" htmlFor="clock-name">Add another clock</label>
          <div className="add-clock-row">
            <input
              id="clock-name"
              value={clockName}
              maxLength={60}
              onChange={(event) => setClockName(event.target.value)}
              placeholder="e.g. Bedroom clock"
              required
            />
            <button className="button button--primary" type="submit">Generate pairing code</button>
          </div>
          <p className="field-hint">Each connected Uno Q gets its own history and settings.</p>
        </form>

        {pairingCode && (
          <div className="pairing-panel" aria-live="polite">
            <strong>One-time pairing code</strong>
            <code className="pairing-code">{pairingCode}</code>
            <p>On the USB-connected PC, open a terminal in the project folder and run:</p>
            <code className="companion-command">{pairingCommand}</code>
            <button className="copy-command-button" type="button" onClick={copyPairingCommand}>
              Copy pairing command
            </button>
            <button className="copy-command-button" type="button" onClick={() => void loadClocks()}>
              Refresh clock list after pairing
            </button>
            <p className="field-hint">
              The code expires after 10 minutes. Pairing saves the board token in Windows Credential Manager.
            </p>
          </div>
        )}

        {selectedClock && (
          <div className="companion-help">
            <span className="field-label">Run one alarm from the connected PC</span>
            <code className="companion-command">{companionCommand}</code>
            <p className="field-hint">
              The companion reads this clock&apos;s saved settings, plays the voice clip at your chosen volume,
              and waits for the physical button.
            </p>
          </div>
        )}
        {loading && <p className="field-hint">Loading your clocks…</p>}
        {!loading && clocks.length === 0 && (
          <p className="empty-clocks">
            Add your first clock above. A pairing code will connect its USB/ADB serial to this account.
          </p>
        )}
      </section>

      <section className="settings-card panel">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Saved per selected clock</p>
            <h2>Alarm settings</h2>
          </div>
          <span className="card-icon" aria-hidden="true">♫</span>
        </div>
        <form onSubmit={saveSettings}>
          <label className="field-label" htmlFor="song">Alarm song</label>
          <div className="select-wrap">
            <select
              id="song"
              value={settings.song}
              disabled={!selectedClock}
              onChange={(event) => updateSettings({ song: event.target.value })}
            >
              <option>Teto&apos;s morning mix</option>
              <option>Triple Baka (morning edit)</option>
              <option>Showtime! — Teto&apos;s pick</option>
              <option>Quiet sunrise</option>
            </select>
            <span aria-hidden="true">⌄</span>
          </div>
          <p className="field-hint">
            The selection is stored with this clock. The current companion prototype plays the Teto voice clip;
            song audio files are not included yet.
          </p>

          <fieldset className="voice-fieldset" disabled={!selectedClock}>
            <legend className="field-label">What should Teto say?</legend>
            <div className="choice-tabs">
              <label className={settings.messageMode === "script" ? "choice-tab choice-tab--active" : "choice-tab"}>
                <input
                  type="radio"
                  name="message-mode"
                  value="script"
                  checked={settings.messageMode === "script"}
                  onChange={() => updateSettings({ messageMode: "script" })}
                />
                Exact words
              </label>
              <label className={settings.messageMode === "prompt" ? "choice-tab choice-tab--active" : "choice-tab"}>
                <input
                  type="radio"
                  name="message-mode"
                  value="prompt"
                  checked={settings.messageMode === "prompt"}
                  onChange={() => updateSettings({ messageMode: "prompt" })}
                />
                Vibe prompt
              </label>
            </div>
            <textarea
              aria-label={settings.messageMode === "script" ? "Exact words for Teto" : "Prompt for Teto's voice"}
              value={settings.message}
              maxLength={500}
              disabled={!selectedClock}
              onChange={(event) => updateSettings({ message: event.target.value })}
              placeholder={settings.messageMode === "script" ? "Write exactly what Teto should say…" : "e.g. Friendly Teto in the morning"}
              rows={3}
            />
            <p className="field-hint">
              {settings.messageMode === "script"
                ? "Teto will say these exact words."
                : "Prompts are saved, but prompt-to-speech generation is not connected yet."}
            </p>
          </fieldset>

          <div className="volume-heading">
            <label className="field-label" htmlFor="volume">Alarm volume</label>
            <span className="volume-value">{settings.volume}<small>%</small></span>
          </div>
          <input
            className="volume-slider"
            id="volume"
            type="range"
            min="0"
            max="100"
            value={settings.volume}
            disabled={!selectedClock}
            style={{ "--range-progress": `${settings.volume}%` } as CSSProperties}
            onChange={(event) => updateSettings({ volume: Number(event.target.value) })}
          />
          <div className="range-ends"><span>QUIET</span><span>LOUD</span></div>
          <div className="form-actions">
            <button className="button button--primary" type="submit" disabled={!selectedClock || saving}>
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save settings"}
            </button>
          </div>
          <p
            className={`settings-notice${notice ? " settings-notice--visible" : ""}${noticeError ? " settings-notice--error" : ""}`}
            aria-live="polite"
          >
            {notice}
          </p>
        </form>
      </section>

      <section className="stats-card panel">
        <div className="card-heading stats-heading">
          <div>
            <p className="eyebrow">Physical button dismissals</p>
            <h2>Wake-up history</h2>
          </div>
          <span className="demo-pill demo-pill--live"><span /> LIVE DATA</span>
        </div>
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-label">AVERAGE</span>
            <strong>{stats.average === null ? "—" : formatMinutes(stats.average)}<small>{stats.average === null ? "" : " min"}</small></strong>
            <span className="stat-note">time to dismiss</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">QUICKEST</span>
            <strong>{stats.quickest === null ? "—" : formatMinutes(stats.quickest)}<small>{stats.quickest === null ? "" : " min"}</small></strong>
            <span className="stat-note">your best morning</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">IN RANGE</span>
            <strong>{stats.count}<small>×</small></strong>
            <span className="stat-note">for this clock</span>
          </div>
        </div>
        <div className="chart-heading">
          <div>
            <h3>Time to get up</h3>
            <p>From alarm start until you press the clock button.</p>
          </div>
          <label className="range-select">
            <span className="sr-only">Chart time range</span>
            <select value={range} onChange={(event) => setRange(event.target.value)}>
              <option>12 sessions</option>
              <option>7 days</option>
            </select>
            <span aria-hidden="true">⌄</span>
          </label>
        </div>
        <ResponseChart sessions={sessions} />
        <div className="data-note">
          <span aria-hidden="true">ⓘ</span>
          {selectedClock
            ? `Showing only ${selectedClock.name}. Each saved session is tied to this clock's USB/ADB identity.`
            : "Connect a clock and dismiss an alarm to see its time-series history."}
        </div>
      </section>
    </div>
  );
}
