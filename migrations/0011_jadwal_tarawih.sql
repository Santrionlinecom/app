-- Migration: jadwal tarawih
CREATE TABLE IF NOT EXISTS jadwal_tarawih (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  urut INTEGER NOT NULL,
  hari TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  imam TEXT NOT NULL,
  bilal TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_jadwal_tarawih_org ON jadwal_tarawih(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jadwal_tarawih_org_urut ON jadwal_tarawih(organization_id, urut);
