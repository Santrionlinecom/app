PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tpq_halaqoh (
	id TEXT PRIMARY KEY,
	institution_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	ustadz_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	schedule_json TEXT NOT NULL DEFAULT '{}',
	created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

CREATE INDEX IF NOT EXISTS idx_tpq_halaqoh_institution_created
	ON tpq_halaqoh(institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tpq_halaqoh_institution_ustadz
	ON tpq_halaqoh(institution_id, ustadz_user_id);

CREATE TABLE IF NOT EXISTS tpq_setoran (
	id TEXT PRIMARY KEY,
	institution_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	santri_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
	CHECK (ayat_from <= ayat_to)
);

CREATE INDEX IF NOT EXISTS idx_tpq_setoran_institution_date
	ON tpq_setoran(institution_id, date);
CREATE INDEX IF NOT EXISTS idx_tpq_setoran_institution_santri_date
	ON tpq_setoran(institution_id, santri_user_id, date);
CREATE INDEX IF NOT EXISTS idx_tpq_setoran_institution_ustadz_date
	ON tpq_setoran(institution_id, ustadz_user_id, date);
