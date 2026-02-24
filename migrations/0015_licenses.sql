-- Migration: licensing for Santri Streamer desktop
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS licenses (
  license_key TEXT PRIMARY KEY,
  user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'studio')),
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked', 'expired')),
  device_limit INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NULL,
  notes TEXT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT NULL,
  activated_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  UNIQUE (license_key, device_id)
);

CREATE TABLE IF NOT EXISTS license_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT NULL REFERENCES licenses(license_key) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('generate', 'verify', 'activate', 'deactivate', 'revoke', 'reset_devices', 'fail')),
  created_at INTEGER NOT NULL,
  meta TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_devices_license_key ON devices(license_key);
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_licenses_user_email ON licenses(user_email);
CREATE INDEX IF NOT EXISTS idx_license_events_key_time ON license_events(license_key, created_at DESC);
