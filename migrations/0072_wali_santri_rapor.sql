-- migrations/0072_wali_santri_rapor.sql
-- Tahap A: relasi wali↔santri berbasis akun + kode undangan + perluasan
-- certificates menjadi rapor lembaga dengan slug publik.
--
-- Keputusan yang ditegakkan skema ini (lihat docs/RANCANGAN_DASHBOARD_WALI.md):
-- 1. Relasi wali memakai users(id) di KEDUA sisi — bukan santri.wali_hp.
--    Nomor HP bisa diketik siapa saja dan tidak membuktikan apa pun; memakainya
--    sebagai dasar otorisasi berarti siapa pun yang tahu nomor wali bisa
--    membaca data anak orang lain.
-- 2. Wali tidak mengklaim anak; lembaga/santri menerbitkan kode undangan
--    sekali pakai dan berumur pendek.
-- 3. Satu anak boleh punya lebih dari satu wali (ayah DAN ibu).
-- 4. Rapor adalah dokumen beku (payload JSON snapshot), bukan kueri hidup.

-- ——— 1. Relasi wali ↔ santri ———
CREATE TABLE IF NOT EXISTS wali_santri (
  id             TEXT PRIMARY KEY,
  wali_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  santri_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hubungan       TEXT NOT NULL CHECK (hubungan IN ('ayah','ibu','wali')),
  lembaga_id     TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'aktif'
                   CHECK (status IN ('aktif','dicabut')),
  dibuat_oleh    TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  revoked_at     INTEGER,
  UNIQUE(wali_user_id, santri_user_id)
);

CREATE INDEX IF NOT EXISTS idx_wali_santri_wali
  ON wali_santri(wali_user_id, status);
CREATE INDEX IF NOT EXISTS idx_wali_santri_santri
  ON wali_santri(santri_user_id, status);

-- ——— 2. Kode undangan wali (sekali pakai, kedaluwarsa) ———
CREATE TABLE IF NOT EXISTS wali_undangan (
  kode             TEXT PRIMARY KEY,
  santri_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lembaga_id       TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  hubungan         TEXT NOT NULL CHECK (hubungan IN ('ayah','ibu','wali')),
  diterbitkan_oleh TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at       INTEGER NOT NULL,
  dipakai_oleh     TEXT REFERENCES users(id) ON DELETE SET NULL,
  dipakai_at       INTEGER,
  created_at       INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_wali_undangan_santri
  ON wali_undangan(santri_user_id);

-- ——— 3. Afiliasi utama santri ↔ lembaga ———
-- Santri boleh anggota beberapa lembaga (TPQ + rumah tahfidz), tapi satu
-- menjadi induk pendidikannya — dipakai untuk rapor dan "aku santri di…".
-- Maksimal satu is_primary=1 per user; ditegakkan di lapisan service.
ALTER TABLE organization_memberships ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_memberships_primary
  ON organization_memberships(user_id, is_primary);

-- ——— 4. Perluasan certificates menjadi rapor lembaga ———
ALTER TABLE certificates ADD COLUMN org_id TEXT REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE certificates ADD COLUMN jenis TEXT NOT NULL DEFAULT 'sertifikat';
ALTER TABLE certificates ADD COLUMN periode_mulai TEXT;
ALTER TABLE certificates ADD COLUMN periode_selesai TEXT;
ALTER TABLE certificates ADD COLUMN slug TEXT;
ALTER TABLE certificates ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0;
ALTER TABLE certificates ADD COLUMN payload TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_slug
  ON certificates(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_certificates_org
  ON certificates(org_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_certificates_santri
  ON certificates(santri_id, issued_at DESC);
