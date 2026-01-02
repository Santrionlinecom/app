-- Migration: relasi santri memilih ustadz/ustadzah
CREATE TABLE IF NOT EXISTS santri_ustadz (
  santri_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  ustadz_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

CREATE INDEX IF NOT EXISTS idx_santri_ustadz_ustadz ON santri_ustadz(ustadz_id);
CREATE INDEX IF NOT EXISTS idx_santri_ustadz_org ON santri_ustadz(org_id);
