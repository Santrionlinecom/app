-- Enable FK constraints
PRAGMA foreign_keys = ON;

-- Users & auth (Lucia + Google)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  gender TEXT, -- 'pria' atau 'wanita'
  whatsapp TEXT,
  balance INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'santri',
  org_id TEXT,
  org_status TEXT NOT NULL DEFAULT 'active',
  googleId TEXT,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

-- Organizations (pondok/masjid/musholla)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  address TEXT,
  city TEXT,
  contact_phone TEXT,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_org_type_status ON organizations(type, status);
CREATE INDEX IF NOT EXISTS idx_org_slug ON organizations(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_type_slug ON organizations(type, slug);

-- PERUBAHAN DI SINI (Lucia v3 Format)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL -- Ini yang dicari oleh sistem Lucia v3
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

CREATE TABLE IF NOT EXISTS google_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_google_accounts_user_id ON google_accounts(user_id);

-- Hafalan tracking
CREATE TABLE IF NOT EXISTS hafalan_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('belum','setor','disetujui')),
  tanggal_setor TEXT,
  tanggal_approve TEXT,
  quality_status TEXT,
  UNIQUE (user_id, surah_number, ayah_number)
);
CREATE INDEX IF NOT EXISTS idx_hafalan_user_status ON hafalan_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_hafalan_status_date ON hafalan_progress(status, tanggal_approve);

-- Opsional, data surah; bisa di-seed dari SURAH_DATA jika mau persist di DB
CREATE TABLE IF NOT EXISTS surah (
  number INTEGER PRIMARY KEY,
  nama TEXT,
  total_ayat INTEGER
);

-- Kalender / catatan
CREATE TABLE IF NOT EXISTS calendar_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT,
  title TEXT NOT NULL,
  content TEXT,
  event_date TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_calendar_notes_event_date ON calendar_notes(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_notes_user ON calendar_notes(user_id);

-- Sertifikat pencapaian santri
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  santri_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ustadz_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  issued_at TEXT NOT NULL,
  duration_days INTEGER,
  total_hifz_ayat INTEGER DEFAULT 0,
  total_doa INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  certificate_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_certificates_santri ON certificates(santri_id);
CREATE INDEX IF NOT EXISTS idx_certificates_ustadz ON certificates(ustadz_id);

-- User role assignment tracking
CREATE TABLE IF NOT EXISTS user_role_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_role TEXT,
  new_role TEXT NOT NULL,
  changed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  changed_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_user_role_history_user ON user_role_history(user_id);

-- Muroja'ah tracking for independent memorization
CREATE TABLE IF NOT EXISTS muroja_tracking (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL,
  ayah_start INTEGER NOT NULL,
  ayah_end INTEGER NOT NULL,
  quality TEXT NOT NULL CHECK (quality IN ('lancar', 'kurang_lancar', 'belum_lancar')),
  notes TEXT,
  muroja_date TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_muroja_tracking_user ON muroja_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_muroja_tracking_date ON muroja_tracking(muroja_date);

-- Catatan transaksi PPOB
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL,
  destination_number TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, created_at);

-- Solusi Ummah (Zakat & Qurban)
CREATE TABLE IF NOT EXISTS program_amal (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nama_program TEXT NOT NULL,
  tahun INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_program_amal_org ON program_amal(organization_id);
CREATE INDEX IF NOT EXISTS idx_program_amal_status ON program_amal(status);

CREATE TABLE IF NOT EXISTS transaksi_zakat (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES program_amal(id) ON DELETE CASCADE,
  nama_muzakki TEXT NOT NULL,
  jumlah_jiwa INTEGER NOT NULL DEFAULT 1,
  jenis_bayar TEXT NOT NULL CHECK (jenis_bayar IN ('beras', 'uang')),
  nominal INTEGER NOT NULL,
  diterima_oleh TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_transaksi_zakat_program ON transaksi_zakat(program_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_zakat_jenis ON transaksi_zakat(jenis_bayar);

CREATE TABLE IF NOT EXISTS data_qurban (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES program_amal(id) ON DELETE CASCADE,
  jenis_hewan TEXT NOT NULL,
  nama_sohibul_qurban TEXT NOT NULL,
  status_hewan TEXT NOT NULL DEFAULT 'hidup' CHECK (status_hewan IN ('hidup', 'sembelih', 'bagi')),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_data_qurban_program ON data_qurban(program_id);
CREATE INDEX IF NOT EXISTS idx_data_qurban_status ON data_qurban(status_hewan);
