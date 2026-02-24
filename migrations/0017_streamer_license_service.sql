-- Migration: streamer license API tables (prefixed to avoid conflict with existing app `licenses` tables)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS streamer_licenses (
  id TEXT PRIMARY KEY,
  license_key_hash TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly', 'lifetime')),
  expires_at INTEGER NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  max_devices INTEGER NOT NULL CHECK (max_devices > 0),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS streamer_license_devices (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL REFERENCES streamer_licenses(id) ON DELETE CASCADE,
  device_id_hash TEXT NOT NULL,
  activated_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  UNIQUE (license_id, device_id_hash)
);

CREATE TABLE IF NOT EXISTS streamer_license_events (
  id TEXT PRIMARY KEY,
  license_id TEXT NULL REFERENCES streamer_licenses(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  meta_json TEXT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_streamer_licenses_status ON streamer_licenses(status);
CREATE INDEX IF NOT EXISTS idx_streamer_license_devices_license ON streamer_license_devices(license_id);
CREATE INDEX IF NOT EXISTS idx_streamer_license_devices_hash ON streamer_license_devices(device_id_hash);
CREATE INDEX IF NOT EXISTS idx_streamer_license_events_license_time ON streamer_license_events(license_id, created_at DESC);
