-- Asrama pondok + hasil ujian tahfidz.
-- Idempotent: aman dijalankan ulang.

CREATE TABLE IF NOT EXISTS pondok_asrama (
	id TEXT PRIMARY KEY,
	organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	capacity INTEGER NOT NULL DEFAULT 4 CHECK (capacity > 0 AND capacity <= 40),
	notes TEXT,
	created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

CREATE INDEX IF NOT EXISTS idx_pondok_asrama_org
	ON pondok_asrama(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS pondok_asrama_santri (
	organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	room_id TEXT NOT NULL REFERENCES pondok_asrama(id) ON DELETE CASCADE,
	santri_id TEXT NOT NULL,
	assigned_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
	PRIMARY KEY (organization_id, santri_id)
);

CREATE INDEX IF NOT EXISTS idx_pondok_asrama_santri_room
	ON pondok_asrama_santri(room_id);

CREATE TABLE IF NOT EXISTS tahfidz_ujian (
	id TEXT PRIMARY KEY,
	organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	santri_id TEXT NOT NULL,
	judul TEXT NOT NULL,
	surah TEXT NOT NULL,
	ayat_from INTEGER NOT NULL CHECK (ayat_from > 0),
	ayat_to INTEGER NOT NULL CHECK (ayat_to > 0),
	nilai INTEGER NOT NULL CHECK (nilai >= 0 AND nilai <= 100),
	catatan TEXT,
	created_by TEXT,
	created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
	CHECK (ayat_from <= ayat_to)
);

CREATE INDEX IF NOT EXISTS idx_tahfidz_ujian_org
	ON tahfidz_ujian(organization_id, created_at DESC);
