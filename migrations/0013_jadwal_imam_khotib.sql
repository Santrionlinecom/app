CREATE TABLE IF NOT EXISTS jadwal_imam (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL,
  hari TEXT,
  waktu TEXT NOT NULL,
  imam TEXT NOT NULL,
  catatan TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_jadwal_imam_org ON jadwal_imam(organization_id, tanggal);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jadwal_imam_org_tanggal_waktu ON jadwal_imam(organization_id, tanggal, waktu);

CREATE TABLE IF NOT EXISTS jadwal_khotib_jumat (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL,
  hari TEXT,
  khotib TEXT NOT NULL,
  imam TEXT,
  catatan TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_jadwal_khotib_org ON jadwal_khotib_jumat(organization_id, tanggal);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jadwal_khotib_org_tanggal ON jadwal_khotib_jumat(organization_id, tanggal);
