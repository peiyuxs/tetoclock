"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";

type AlarmSettings = {
  song: string;
  messageMode: "script" | "prompt";
  message: string;
  volume: number;
};

const demoSessions = [
  { day: "MON", minutes: 8.2 },
  { day: "TUE", minutes: 5.6 },
  { day: "WED", minutes: 7.1 },
  { day: "THU", minutes: 4.4 },
  { day: "FRI", minutes: 3.8 },
  { day: "SAT", minutes: 6.3 },
  { day: "SUN", minutes: 4.9 },
  { day: "MON", minutes: 3.2 },
  { day: "TUE", minutes: 5.1 },
  { day: "WED", minutes: 2.7 },
  { day: "THU", minutes: 4.1 },
  { day: "FRI", minutes: 3.5 },
];

function formatMinutes(minutes: number) {
  const wholeMinutes = Math.floor(minutes);
  const seconds = Math.round((minutes - wholeMinutes) * 60);
  return `${wholeMinutes}:${String(seconds).padStart(2, "0")}`;
}

function ResponseChart({ range }: { range: string }) {
  const visibleSessions = range === "7 days" ? demoSessions.slice(-7) : demoSessions;
  const points = visibleSessions.map((session, index) => {
    const x = 48 + (index * 624) / Math.max(visibleSessions.length - 1, 1);
    const y = 22 + ((10 - session.minutes) / 10) * 174;
    return { ...session, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${points[0].x},196 ${line} ${points[points.length - 1].x},196`;
  const yTicks = [10, 7.5, 5, 2.5, 0];

  return (
    <div className="chart-wrap">
      <div className="chart-axis-label">TIME TO STOP ALARM · MINUTES</div>
      <svg
        className="response-chart"
        viewBox="0 0 720 238"
        role="img"
        aria-label={`Demo chart showing alarm response times for the last ${range}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#d72727" stopOpacity=".22" />
            <stop offset="100%" stopColor="#d72727" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => {
          const y = 22 + ((10 - tick) / 10) * 174;
          return (
            <g key={tick}>
              <line x1="48" x2="690" y1={y} y2={y} className="chart-gridline" />
              <text x="36" y={y + 4} className="chart-tick" textAnchor="end">{tick}</text>
            </g>
          );
        })}
        <polygon points={area} fill="url(#chart-fill)" />
        <polyline points={line} className="chart-line" />
        {points.map((point, index) => (
          <g key={`${point.day}-${index}`}>
            <circle cx={point.x} cy={point.y} r="5" className="chart-point" />
            <text x={point.x} y="220" className="chart-tick" textAnchor="middle">{point.day}</text>
          </g>
        ))}
      </svg>
      <div className="chart-legend"><span /> Alarm stop time</div>
    </div>
  );
}

export default function Dashboard() {
  const [settings, setSettings] = useState<AlarmSettings>({
    song: "Teto's morning mix",
    messageMode: "script",
    message: "Good morning! The train is waiting for you!",
    volume: 68,
  });
  const [saved, setSaved] = useState(false);
  const [range, setRange] = useState("12 sessions");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const avg = useMemo(
    () => demoSessions.reduce((total, session) => total + session.minutes, 0) / demoSessions.length,
    [],
  );

  useEffect(() => {
    try {
      const storedSettings = window.localStorage.getItem("tetoclock-settings");
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings) as Partial<AlarmSettings>;
        if (
          typeof parsed.song === "string" &&
          (parsed.messageMode === "script" || parsed.messageMode === "prompt") &&
          typeof parsed.message === "string" &&
          typeof parsed.volume === "number" &&
          parsed.volume >= 0 &&
          parsed.volume <= 100
        ) {
          setSettings({
            song: parsed.song,
            messageMode: parsed.messageMode,
            message: parsed.message,
            volume: parsed.volume,
          });
        } else {
          setNoticeError(true);
          setNotice("Saved settings are incomplete. Save your preferences again.");
        }
      }
    } catch {
      setNoticeError(true);
      setNotice("Saved settings could not be read. Check browser storage, then try again.");
    }
  }, []);

  function updateSettings(patch: Partial<AlarmSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
    setSaved(false);
    setNotice("");
    setNoticeError(false);
  }

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      window.localStorage.setItem("tetoclock-settings", JSON.stringify(settings));
      setSaved(true);
      setNoticeError(false);
      setNotice("Settings saved on this device.");
    } catch {
      setSaved(false);
      setNoticeError(true);
      setNotice("Could not save settings in this browser. Check storage permissions.");
    }
  }

  function playPreview() {
    setNoticeError(false);
    setNotice("Audio preview is not connected in this frontend demo.");
  }

  return (
    <div className="dashboard-grid">
      <section className="settings-card panel">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Make it yours</p>
            <h2>Alarm settings</h2>
          </div>
          <span className="card-icon" aria-hidden="true">✳</span>
        </div>
        <form onSubmit={saveSettings}>
          <label className="field-label" htmlFor="song">Alarm song</label>
          <div className="select-wrap">
            <select id="song" value={settings.song} onChange={(event) => updateSettings({ song: event.target.value })}>
              <option>Teto&apos;s morning mix</option>
              <option>Triple Baka (morning edit)</option>
              <option>Showtime! — Teto&apos;s pick</option>
              <option>Quiet sunrise</option>
            </select>
            <span aria-hidden="true">⌄</span>
          </div>
          <p className="field-hint">Choose the soundtrack that gets you moving.</p>

          <fieldset className="voice-fieldset">
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
              id="teto-message"
              aria-label={settings.messageMode === "script" ? "Exact words for Teto" : "Prompt for Teto's voice"}
              value={settings.message}
              onChange={(event) => updateSettings({ message: event.target.value })}
              placeholder={settings.messageMode === "script" ? "Write exactly what Teto should say…" : "e.g. Friendly Teto in the morning"}
              rows={3}
            />
            <p className="field-hint">
              {settings.messageMode === "script"
                ? "Teto will say these exact words."
                : "Describe the delivery, e.g. “friendly Teto in the morning”."}
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
            style={{ "--range-progress": `${settings.volume}%` } as CSSProperties}
            onChange={(event) => updateSettings({ volume: Number(event.target.value) })}
          />
          <div className="range-ends"><span>QUIET</span><span>LOUD</span></div>
          <div className="form-actions">
            <button className="button button--primary" type="submit">
              {saved ? "Saved ✓" : "Save settings"}
            </button>
            <button className="preview-button" type="button" onClick={playPreview}>
              <span aria-hidden="true">▶</span> Preview
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
            <p className="eyebrow">The proof you got up</p>
            <h2>Your wake-up stats</h2>
          </div>
          <span className="demo-pill"><span /> DEMO DATA</span>
        </div>
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-label">AVERAGE</span>
            <strong>{formatMinutes(avg)}<small> min</small></strong>
            <span className="stat-note">time to stop alarm</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">QUICKEST</span>
            <strong>{formatMinutes(Math.min(...demoSessions.map((session) => session.minutes)))}<small> min</small></strong>
            <span className="stat-note">your best morning</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">SESSIONS</span>
            <strong>{demoSessions.length}<small>×</small></strong>
            <span className="stat-note">alarms tracked</span>
          </div>
        </div>
        <div className="chart-heading">
          <div>
            <h3>Time to get up</h3>
            <p>How long from alarm start until you stop it.</p>
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
        <ResponseChart range={range} />
        <div className="data-note">
          <span aria-hidden="true">ⓘ</span>
          Sample visualization only. Live TigerData connection awaits a secure data service and device events.
        </div>
      </section>
    </div>
  );
}
