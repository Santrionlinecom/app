-- migrations/0073_halaqah_anggota_rapor.sql
-- Tahap B & C: keanggotaan halaqah + penopang rapor.
--
-- Temuan audit 2026-08-21 (skema produksi diverifikasi langsung):
-- - tpq_halaqoh SUDAH ADA tapi hanya menyimpan ustadz_user_id. Tidak ada
--   cara mengetahui SIAPA SAJA anggota sebuah halaqah — padahal justru
--   kelompok kecil yang saling kenal itulah inti "rasa mondok".
-- - tpq_setoran SUDAH ADA lengkap (notes, reviewed_by, status), jadi alur
--   "setoran dibalas manusia" TIDAK PERLU tabel baru. Cukup dibukakan
--   jalannya untuk santri.
--
-- Karena itu migrasi ini sengaja kecil: hanya menambah yang benar-benar
-- belum ada, bukan membangun ulang yang sudah jalan.

-- ——— Keanggotaan halaqah ———
CREATE TABLE IF NOT EXISTS halaqah_anggota (
  id             TEXT PRIMARY KEY,
  halaqoh_id     TEXT NOT NULL REFERENCES tpq_halaqoh(id) ON DELETE CASCADE,
  santri_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'aktif'
                   CHECK (status IN ('aktif','keluar')),
  joined_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  left_at        INTEGER,
  -- Satu santri hanya boleh sekali terdaftar di satu halaqah yang sama.
  UNIQUE(halaqoh_id, santri_user_id)
);

CREATE INDEX IF NOT EXISTS idx_halaqah_anggota_halaqoh
  ON halaqah_anggota(halaqoh_id, status);
CREATE INDEX IF NOT EXISTS idx_halaqah_anggota_santri
  ON halaqah_anggota(santri_user_id, status);

-- Batas ukuran halaqah. Halaqah yang membesar tanpa batas berhenti terasa
-- sebagai kelompok kecil yang saling kenal, dan musyrif tidak lagi sanggup
-- membalas setiap setoran secara pribadi.
ALTER TABLE tpq_halaqoh ADD COLUMN kapasitas INTEGER NOT NULL DEFAULT 12;

-- ——— Penopang rapor (Tahap C) ———
-- certificates sudah diperluas di 0072 (org_id, jenis, slug, payload,
-- is_public). Yang kurang hanya jejak siapa yang menerbitkan dan kapan
-- rapor dicabut kembali dari publik.
ALTER TABLE certificates ADD COLUMN diterbitkan_oleh TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE certificates ADD COLUMN dicabut_at INTEGER;
