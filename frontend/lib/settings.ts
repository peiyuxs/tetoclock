export const DEFAULT_SETTINGS = {
  song: "Machine Love",
  message_mode: "script",
  message: "Good morning! The train is waiting for you!",
  volume: 68,
} as const;

export const ALARM_SONGS = ["Machine Love"] as const;

export type ClockSettings = {
  song: string;
  messageMode: "script" | "prompt";
  message: string;
  volume: number;
};

export function parseSettings(value: unknown): ClockSettings | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const settings = value as Record<string, unknown>;
  if (
    typeof settings.song !== "string" ||
    !ALARM_SONGS.includes(settings.song as (typeof ALARM_SONGS)[number]) ||
    (settings.messageMode !== "script" && settings.messageMode !== "prompt") ||
    typeof settings.message !== "string" ||
    settings.message.trim().length === 0 ||
    settings.message.length > 500 ||
    !Number.isInteger(settings.volume) ||
    (settings.volume as number) < 0 ||
    (settings.volume as number) > 100
  ) {
    return null;
  }

  return {
    song: settings.song,
    messageMode: settings.messageMode,
    message: settings.message,
    volume: settings.volume as number,
  };
}
