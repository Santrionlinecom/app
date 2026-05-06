-- =============================================
-- FITUR: Rapor Hafalan Santri
-- Migration: 0026
-- Catatan: Melengkapi hafalan_progress dan tpq_setoran
--          dengan kategori, item, pencapaian akhir, dan periode rapor.
-- =============================================

CREATE TABLE IF NOT EXISTS hafalan_kategori (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT NOT NULL,
  nama TEXT NOT NULL,
  icon TEXT,
  urutan INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hafalan_kategori_org_nama
  ON hafalan_kategori(org_id, nama);

CREATE INDEX IF NOT EXISTS idx_hafalan_kategori_org_urutan
  ON hafalan_kategori(org_id, urutan);

CREATE TABLE IF NOT EXISTS hafalan_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kategori_id INTEGER NOT NULL,
  nama TEXT NOT NULL,
  fadhilah TEXT,
  level TEXT DEFAULT 'wajib',
  urutan INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (kategori_id) REFERENCES hafalan_kategori(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hafalan_item_kategori_nama
  ON hafalan_item(kategori_id, nama);

CREATE INDEX IF NOT EXISTS idx_hafalan_item_kategori_urutan
  ON hafalan_item(kategori_id, urutan);

CREATE TABLE IF NOT EXISTS hafalan_pencapaian (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  santri_id TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  guru_id TEXT NOT NULL,
  status TEXT DEFAULT 'belum',
  nilai INTEGER DEFAULT 0,
  catatan TEXT,
  tanggal_setor TEXT,
  tanggal_lulus TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(santri_id, item_id),
  FOREIGN KEY (santri_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES hafalan_item(id) ON DELETE CASCADE,
  FOREIGN KEY (guru_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_hafalan_pencapaian_santri
  ON hafalan_pencapaian(santri_id);

CREATE INDEX IF NOT EXISTS idx_hafalan_pencapaian_item_status
  ON hafalan_pencapaian(item_id, status);

CREATE INDEX IF NOT EXISTS idx_hafalan_pencapaian_guru
  ON hafalan_pencapaian(guru_id);

CREATE TABLE IF NOT EXISTS rapor_periode (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT NOT NULL,
  nama TEXT NOT NULL,
  tanggal_mulai TEXT NOT NULL,
  tanggal_selesai TEXT NOT NULL,
  is_aktif INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rapor_periode_org_aktif
  ON rapor_periode(org_id, is_aktif);
