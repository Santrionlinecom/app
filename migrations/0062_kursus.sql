-- Kursus: materi belajar berbayar koin atau gratis.
--
-- Melengkapi tiga pilar yang sudah ada (buku, produk digital, lembaga).
-- Pembayaran memakai ulang dompet koin yang sudah berjalan (coin_wallets +
-- coin_transactions) lewat deductCoins, sehingga tidak ada sumber saldo kedua.

CREATE TABLE IF NOT EXISTS kursus (
	id TEXT PRIMARY KEY,
	slug TEXT UNIQUE NOT NULL,
	judul TEXT NOT NULL,
	ringkasan TEXT,
	deskripsi TEXT,
	-- 0 berarti gratis. Nilai minus ditolak di lapisan aplikasi.
	harga_koin INTEGER NOT NULL DEFAULT 0,
	level TEXT NOT NULL DEFAULT 'dasar',
	kategori TEXT,
	sampul_url TEXT,
	durasi_menit INTEGER NOT NULL DEFAULT 0,
	status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
	urutan INTEGER NOT NULL DEFAULT 0,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kursus_status_urutan ON kursus(status, urutan);

-- Satu kursus terdiri atas beberapa materi berurutan.
CREATE TABLE IF NOT EXISTS kursus_materi (
	id TEXT PRIMARY KEY,
	kursus_id TEXT NOT NULL REFERENCES kursus(id) ON DELETE CASCADE,
	judul TEXT NOT NULL,
	isi TEXT NOT NULL,
	urutan INTEGER NOT NULL DEFAULT 0,
	durasi_menit INTEGER NOT NULL DEFAULT 0,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kursus_materi_kursus ON kursus_materi(kursus_id, urutan);

-- Pendaftaran mencatat harga yang benar-benar dibayar saat itu, sehingga
-- perubahan harga di kemudian hari tidak mengubah riwayat.
CREATE TABLE IF NOT EXISTS kursus_pendaftaran (
	id TEXT PRIMARY KEY,
	kursus_id TEXT NOT NULL REFERENCES kursus(id) ON DELETE CASCADE,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	harga_dibayar INTEGER NOT NULL DEFAULT 0,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL,
	UNIQUE (kursus_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_kursus_pendaftaran_user ON kursus_pendaftaran(user_id, created_at);

-- Kemajuan belajar per materi.
CREATE TABLE IF NOT EXISTS kursus_progres (
	id TEXT PRIMARY KEY,
	pendaftaran_id TEXT NOT NULL REFERENCES kursus_pendaftaran(id) ON DELETE CASCADE,
	materi_id TEXT NOT NULL REFERENCES kursus_materi(id) ON DELETE CASCADE,
	selesai_at INTEGER,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL,
	UNIQUE (pendaftaran_id, materi_id)
);

CREATE INDEX IF NOT EXISTS idx_kursus_progres_pendaftaran ON kursus_progres(pendaftaran_id);
