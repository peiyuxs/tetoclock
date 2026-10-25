CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id TEXT NOT NULL,
  device_serial TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS devices_owner_active_idx
  ON devices (owner_user_id, created_at)
  WHERE revoked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS devices_serial_active_uidx
  ON devices (device_serial)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS device_settings (
  device_id UUID PRIMARY KEY REFERENCES devices(id),
  song TEXT NOT NULL DEFAULT 'Teto''s morning mix',
  message_mode TEXT NOT NULL DEFAULT 'script'
    CHECK (message_mode IN ('script', 'prompt')),
  message TEXT NOT NULL DEFAULT 'Good morning! The train is waiting for you!',
  volume SMALLINT NOT NULL DEFAULT 68 CHECK (volume BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_pairing_codes (
  code_hash TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS device_pairing_codes_expiration_idx
  ON device_pairing_codes (expires_at);

CREATE TABLE IF NOT EXISTS device_tokens (
  token_hash TEXT PRIMARY KEY,
  device_id UUID NOT NULL UNIQUE REFERENCES devices(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS alarm_sessions (
  time TIMESTAMPTZ NOT NULL,
  session_id UUID NOT NULL,
  device_id UUID NOT NULL REFERENCES devices(id),
  alarm_started_at TIMESTAMPTZ NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL,
  response_ms INTEGER NOT NULL CHECK (response_ms BETWEEN 0 AND 120000),
  PRIMARY KEY (time, session_id),
  CHECK (dismissed_at >= alarm_started_at)
) WITH (
  tsdb.hypertable,
  tsdb.segmentby = 'device_id',
  tsdb.orderby = 'time DESC'
);

CREATE INDEX IF NOT EXISTS alarm_sessions_device_time_idx
  ON alarm_sessions (device_id, time DESC);
