-- Setoran TPQ: menerima santri hasil pendataan (tanpa akun login).
--
-- Skema lama memaksa `santri_user_id NOT NULL REFERENCES users(id)`, sehingga
-- santri TPQ usia 5-12 tahun yang didata tanpa akun login mustahil dicatat
-- setorannya. Sejak kini setiap setoran menunjuk tepat satu di antara
-- `santri_id` (tabel santri) atau `santri_user_id` (akun lama).
--
-- Aman dijalankan: pada saat migrasi ini dibuat `tpq_setoran` berisi 0 baris
-- di produksi, jadi tidak ada data setoran yang dipindahkan atau hilang.
-- SQLite tidak bisa melonggarkan NOT NULL lewat ALTER, sehingga tabel
-- dibangun ulang.

DROP TABLE IF EXISTS tpq_setoran_baru;

CREATE TABLE tpq_setoran_baru (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  santri_id TEXT REFERENCES santri(id) ON DELETE CASCADE,
  santri_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  ustadz_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  halaqoh_id TEXT REFERENCES tpq_halaqoh(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hafalan', 'murojaah')),
  surah TEXT NOT NULL,
  ayat_from INTEGER NOT NULL CHECK (ayat_from > 0),
  ayat_to INTEGER NOT NULL CHECK (ayat_to > 0),
  quality TEXT NOT NULL CHECK (quality IN ('lancar', 'cukup', 'belum')),
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'approved', 'rejected')),
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  CHECK (ayat_from <= ayat_to),
  -- Tepat satu sumber santri wajib terisi: tidak boleh ada setoran tanpa
  -- santri, dan tidak boleh terisi dua-duanya sehingga laporan ganda.
  CHECK ((santri_id IS NOT NULL) + (santri_user_id IS NOT NULL) = 1)
);

-- Pindahkan baris lama bila ada (semuanya berasal dari akun users).
INSERT INTO tpq_setoran_baru (
  id, institution_id, santri_id, santri_user_id, ustadz_user_id, halaqoh_id,
  date, type, surah, ayat_from, ayat_to, quality, notes, status,
  reviewed_by, reviewed_at, created_at
)
SELECT
  id, institution_id, NULL, santri_user_id, ustadz_user_id, halaqoh_id,
  date, type, surah, ayat_from, ayat_to, quality, notes, status,
  reviewed_by, reviewed_at, created_at
FROM tpq_setoran;

DROP TABLE tpq_setoran;

ALTER TABLE tpq_setoran_baru RENAME TO tpq_setoran;

CREATE INDEX IF NOT EXISTS idx_tpq_setoran_institution_date
  ON tpq_setoran(institution_id, date);
CREATE INDEX IF NOT EXISTS idx_tpq_setoran_institution_santri_date
  ON tpq_setoran(institution_id, santri_user_id, date);
CREATE INDEX IF NOT EXISTS idx_tpq_setoran_institution_santri_id_date
  ON tpq_setoran(institution_id, santri_id, date);
CREATE INDEX IF NOT EXISTS idx_tpq_setoran_institution_ustadz_date
  ON tpq_setoran(institution_id, ustadz_user_id, date);
