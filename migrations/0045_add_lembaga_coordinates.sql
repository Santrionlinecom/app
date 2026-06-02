-- Tambah koordinat peta sebaran lembaga.
-- Tabel utama lembaga di repo ini adalah `organizations`.

ALTER TABLE organizations ADD COLUMN latitude REAL DEFAULT NULL;
ALTER TABLE organizations ADD COLUMN longitude REAL DEFAULT NULL;
ALTER TABLE organizations ADD COLUMN kota TEXT DEFAULT NULL;
ALTER TABLE organizations ADD COLUMN provinsi TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_org_coordinates
  ON organizations(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_provinsi_kota
  ON organizations(provinsi, kota);
