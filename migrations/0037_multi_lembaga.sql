-- Migration: v1 -> v2 Multi-Lembaga
-- Dibuat: Mei 2026
-- Author: SantriOnline Dev Studio
--
-- Catatan repo:
-- - Migration ini memakai nomor 0037 karena repo sudah memiliki migration sampai 0036.
-- - Model v2 memakai tabel existing `users` sebagai akun admin dan `organizations`
--   sebagai lembaga, bukan membuat tabel paralel `akun_admin`/`lembaga`.
-- - Tidak ada DROP TABLE / DROP COLUMN. Data existing di users, organizations,
--   sessions, dan tabel TPQ lama tidak dihapus.

PRAGMA foreign_keys = ON;

-- ============================================================
-- STEP 0: Buka kembali arsitektur multi-lembaga
-- Migration 0014 pernah memasang guard TPQ-only. Guard ini harus dilepas
-- supaya tipe masjid, musholla, pondok, dan rumah tahfidz bisa dibuat lagi.
-- ============================================================

DROP TRIGGER IF EXISTS trg_tpq_only_org_insert;
DROP TRIGGER IF EXISTS trg_tpq_only_org_update;
DROP TRIGGER IF EXISTS trg_tpq_only_user_role_insert;
DROP TRIGGER IF EXISTS trg_tpq_only_user_role_update;

-- ============================================================
-- STEP 1: ALTER TABLE organizations
-- Tambah kolom yang dibutuhkan v2.
-- Kolom lama (type, name, status, address) tetap dipertahankan supaya
-- route existing tidak rusak saat transisi.
-- ============================================================

ALTER TABLE organizations ADD COLUMN akun_admin_id TEXT REFERENCES users(id);
ALTER TABLE organizations ADD COLUMN logo_url TEXT;
ALTER TABLE organizations ADD COLUMN is_aktif INTEGER DEFAULT 1;

-- Isi is_aktif dari kolom status existing.
UPDATE organizations
SET is_aktif = CASE
  WHEN LOWER(TRIM(COALESCE(status, ''))) = 'active' THEN 1
  ELSE 0
END;

-- Isi akun_admin_id: sambungkan lembaga ke admin yang punya org_id sama.
UPDATE organizations
SET akun_admin_id = (
  SELECT id
  FROM users
  WHERE org_id = organizations.id
    AND (
      LOWER(TRIM(COALESCE(role, ''))) = 'admin'
      OR UPPER(REPLACE(REPLACE(TRIM(COALESCE(role, '')), '-', '_'), ' ', '_')) = 'SUPER_ADMIN'
    )
  ORDER BY
    CASE WHEN LOWER(TRIM(COALESCE(role, ''))) = 'admin' THEN 0 ELSE 1 END,
    created_at ASC
  LIMIT 1
);

-- ============================================================
-- STEP 2: Buat tabel addon_lembaga
-- ============================================================

CREATE TABLE IF NOT EXISTS addon_lembaga (
  id TEXT PRIMARY KEY,
  lembaga_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tipe_addon TEXT NOT NULL CHECK(tipe_addon IN (
    'lembaga_tambahan',
    'modul_masjid',
    'modul_tahfidz',
    'modul_musholla',
    'santri_unlimited',
    'raport_premium'
  )),
  status TEXT NOT NULL DEFAULT 'aktif' CHECK(status IN ('aktif','expired','trial')),
  berlaku_hingga INTEGER,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

-- ============================================================
-- STEP 3: Buat tabel santri terpisah dari users
-- ============================================================

CREATE TABLE IF NOT EXISTS santri (
  id TEXT PRIMARY KEY,
  lembaga_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  -- Bridge ke users lama. Null untuk santri baru yang belum punya akun login.
  nama TEXT NOT NULL,
  nis TEXT,
  kelas TEXT,
  wali_nama TEXT,
  wali_hp TEXT,
  foto_url TEXT,
  is_aktif INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

-- Migrasi data: users dengan role santri -> tabel santri baru.
-- Hanya santri yang sudah punya org_id.
INSERT OR IGNORE INTO santri (id, lembaga_id, user_id, nama, is_aktif, created_at)
SELECT
  'santri_' || u.id,
  u.org_id,
  u.id,
  COALESCE(NULLIF(TRIM(u.username), ''), u.email, 'Santri'),
  CASE WHEN LOWER(TRIM(COALESCE(u.org_status, 'active'))) = 'active' THEN 1 ELSE 0 END,
  COALESCE(u.created_at, CAST(strftime('%s', 'now') AS INTEGER) * 1000)
FROM users u
WHERE LOWER(TRIM(COALESCE(u.role, ''))) = 'santri'
  AND u.org_id IS NOT NULL
  AND TRIM(u.org_id) != '';

-- ============================================================
-- STEP 4: Buat tabel jamaah untuk Masjid/Musholla
-- ============================================================

CREATE TABLE IF NOT EXISTS jamaah (
  id TEXT PRIMARY KEY,
  lembaga_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  alamat TEXT,
  no_hp TEXT,
  kategori TEXT DEFAULT 'umum',
  is_aktif INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

-- ============================================================
-- STEP 5: Buat tabel billing addon
-- Repo belum punya tabel billing existing, jadi migration membuat tabel baru
-- alih-alih ALTER TABLE billing.
-- ============================================================

CREATE TABLE IF NOT EXISTS billing (
  id TEXT PRIMARY KEY,
  akun_admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lembaga_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  addon_tipe TEXT CHECK(addon_tipe IN (
    'lembaga_tambahan',
    'modul_masjid',
    'modul_tahfidz',
    'modul_musholla',
    'santri_unlimited',
    'raport_premium'
  )),
  nominal INTEGER NOT NULL DEFAULT 0,
  metode TEXT CHECK(metode IN ('coin','midtrans','bsi')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sukses','gagal')),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

-- ============================================================
-- STEP 6: Index performa
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_org_akun_admin ON organizations(akun_admin_id);
CREATE INDEX IF NOT EXISTS idx_org_is_aktif ON organizations(is_aktif);

CREATE UNIQUE INDEX IF NOT EXISTS idx_addon_lembaga_unique
  ON addon_lembaga(lembaga_id, tipe_addon);
CREATE INDEX IF NOT EXISTS idx_addon_lembaga_status
  ON addon_lembaga(lembaga_id, status, berlaku_hingga);

CREATE INDEX IF NOT EXISTS idx_santri_lembaga ON santri(lembaga_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_santri_user ON santri(user_id);

CREATE INDEX IF NOT EXISTS idx_jamaah_lembaga ON jamaah(lembaga_id);

CREATE INDEX IF NOT EXISTS idx_billing_akun_admin ON billing(akun_admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_lembaga ON billing(lembaga_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_status_created ON billing(status, created_at DESC);

-- ============================================================
-- VERIFIKASI SETELAH MIGRASI:
--
--   SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
--   SELECT akun_admin_id, is_aktif, name FROM organizations;
--   SELECT id, nama, lembaga_id FROM santri;
--   SELECT tipe_addon, status FROM addon_lembaga;
--   SELECT addon_tipe, status, metode FROM billing;
-- ============================================================
