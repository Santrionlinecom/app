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
  role TEXT NOT NULL DEFAULT 'ustadz',
  work_status TEXT CHECK (work_status IN ('freelance', 'owner', 'employee')),
  expertise TEXT,
  org_id TEXT,
  org_status TEXT NOT NULL DEFAULT 'active',
  googleId TEXT,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata TEXT,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_created_at ON activity_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created_at ON activity_logs(user_id, created_at);

-- System logs (analytics)
CREATE TABLE IF NOT EXISTS system_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  metadata TEXT,
  ip_address TEXT,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_action_created_at ON system_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_created_at ON system_logs(user_id, created_at);

-- Organizations (TPQ-only)
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

-- Enforce TPQ-only organization type
CREATE TRIGGER IF NOT EXISTS trg_tpq_only_org_insert
BEFORE INSERT ON organizations
FOR EACH ROW
WHEN lower(trim(coalesce(NEW.type, ''))) <> 'tpq'
BEGIN
  SELECT RAISE(ABORT, 'TPQ_ONLY: organization.type must be tpq');
END;

CREATE TRIGGER IF NOT EXISTS trg_tpq_only_org_update
BEFORE UPDATE OF type ON organizations
FOR EACH ROW
WHEN lower(trim(coalesce(NEW.type, ''))) <> 'tpq'
BEGIN
  SELECT RAISE(ABORT, 'TPQ_ONLY: organization.type must be tpq');
END;

-- Organization media gallery
CREATE TABLE IF NOT EXISTS org_media (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_org_media_org ON org_media(organization_id, created_at DESC);

-- Organization assets
CREATE TABLE IF NOT EXISTS org_assets (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  condition TEXT,
  location TEXT,
  notes TEXT,
  acquired_at TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_org_assets_org ON org_assets(organization_id, created_at DESC);

-- Relasi santri memilih ustadz/ustadzah
CREATE TABLE IF NOT EXISTS santri_ustadz (
  santri_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  ustadz_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_santri_ustadz_ustadz ON santri_ustadz(ustadz_id);
CREATE INDEX IF NOT EXISTS idx_santri_ustadz_org ON santri_ustadz(org_id);

-- TPQ Academic Workflow v1 (setoran harian -> review -> riwayat)
CREATE TABLE IF NOT EXISTS tpq_halaqoh (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ustadz_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  schedule_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);
CREATE INDEX IF NOT EXISTS idx_tpq_halaqoh_institution_created ON tpq_halaqoh(institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tpq_halaqoh_institution_ustadz ON tpq_halaqoh(institution_id, ustadz_user_id);

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
CREATE INDEX IF NOT EXISTS idx_tpq_setoran_institution_date ON tpq_setoran(institution_id, date);
CREATE INDEX IF NOT EXISTS idx_tpq_setoran_institution_santri_date ON tpq_setoran(institution_id, santri_user_id, date);
CREATE INDEX IF NOT EXISTS idx_tpq_setoran_institution_ustadz_date ON tpq_setoran(institution_id, ustadz_user_id, date);

-- PERUBAHAN DI SINI (Lucia v3 Format)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL -- Ini yang dicari oleh sistem Lucia v3
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Block legacy community roles for TPQ-only mode
CREATE TRIGGER IF NOT EXISTS trg_tpq_only_user_role_insert
BEFORE INSERT ON users
FOR EACH ROW
WHEN lower(trim(coalesce(NEW.role, ''))) IN ('jamaah', 'tamir', 'bendahara')
BEGIN
  SELECT RAISE(ABORT, 'TPQ_ONLY: community roles are disabled');
END;

CREATE TRIGGER IF NOT EXISTS trg_tpq_only_user_role_update
BEFORE UPDATE OF role ON users
FOR EACH ROW
WHEN lower(trim(coalesce(NEW.role, ''))) IN ('jamaah', 'tamir', 'bendahara')
BEGIN
  SELECT RAISE(ABORT, 'TPQ_ONLY: community roles are disabled');
END;

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

-- Jadwal Imam
CREATE TABLE IF NOT EXISTS jadwal_imam (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL,
  hari TEXT,
  waktu TEXT NOT NULL,
  imam TEXT NOT NULL,
  catatan TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_jadwal_imam_org ON jadwal_imam(organization_id, tanggal);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jadwal_imam_org_tanggal_waktu ON jadwal_imam(organization_id, tanggal, waktu);

-- Jadwal Khotib Jumat
CREATE TABLE IF NOT EXISTS jadwal_khotib_jumat (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL,
  hari TEXT,
  khotib TEXT NOT NULL,
  imam TEXT,
  catatan TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_jadwal_khotib_org ON jadwal_khotib_jumat(organization_id, tanggal);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jadwal_khotib_org_tanggal ON jadwal_khotib_jumat(organization_id, tanggal);

-- Jadwal Tarawih
CREATE TABLE IF NOT EXISTS jadwal_tarawih (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  urut INTEGER NOT NULL,
  hari TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  imam TEXT NOT NULL,
  bilal TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_jadwal_tarawih_org ON jadwal_tarawih(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jadwal_tarawih_org_urut ON jadwal_tarawih(organization_id, urut);

-- Licensing (Santri Streamer desktop)
CREATE TABLE IF NOT EXISTS licenses (
  license_key TEXT PRIMARY KEY,
  user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'studio')),
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked', 'expired')),
  device_limit INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NULL,
  notes TEXT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT NULL,
  activated_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  UNIQUE (license_key, device_id)
);

CREATE TABLE IF NOT EXISTS license_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT NULL REFERENCES licenses(license_key) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('generate', 'verify', 'activate', 'deactivate', 'revoke', 'reset_devices', 'fail')),
  created_at INTEGER NOT NULL,
  meta TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_devices_license_key ON devices(license_key);
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_licenses_user_email ON licenses(user_email);
CREATE INDEX IF NOT EXISTS idx_license_events_key_time ON license_events(license_key, created_at DESC);

-- Digital commerce for super admin CMS
CREATE TABLE IF NOT EXISTS digital_products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  cover_url TEXT,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_digital_products_slug ON digital_products(slug);
CREATE INDEX IF NOT EXISTS idx_digital_products_status ON digital_products(status);

CREATE TABLE IF NOT EXISTS digital_payment_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('bank', 'ewallet', 'qris', 'manual')),
  account_name TEXT,
  account_number TEXT,
  asset_url TEXT,
  instructions TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_digital_payment_methods_active ON digital_payment_methods(is_active, display_order, updated_at DESC);

CREATE TABLE IF NOT EXISTS digital_product_payment_methods (
  product_id TEXT NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  payment_method_id TEXT NOT NULL REFERENCES digital_payment_methods(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (product_id, payment_method_id)
);
CREATE INDEX IF NOT EXISTS idx_digital_product_payment_methods_product ON digital_product_payment_methods(product_id);

CREATE TABLE IF NOT EXISTS digital_product_sales (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  buyer_name TEXT,
  buyer_contact TEXT,
  amount INTEGER NOT NULL,
  reference_code TEXT UNIQUE,
  payment_method_id TEXT REFERENCES digital_payment_methods(id) ON DELETE SET NULL,
  payment_method_name TEXT,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  proof_url TEXT,
  proof_key TEXT,
  proof_mime_type TEXT,
  proof_size INTEGER,
  proof_uploaded_at INTEGER,
  admin_notes TEXT,
  verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  verified_at INTEGER,
  access_token TEXT,
  paid_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_digital_product_sales_created ON digital_product_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_digital_product_sales_product ON digital_product_sales(product_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_digital_product_sales_reference_code ON digital_product_sales(reference_code);
CREATE INDEX IF NOT EXISTS idx_digital_product_sales_status_created ON digital_product_sales(status, created_at DESC);

-- Public kitab library managed from CMS Hub
CREATE TABLE IF NOT EXISTS kitab_catalog (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  description TEXT,
  cover_url TEXT,
  category TEXT,
  source_type TEXT NOT NULL DEFAULT 'pdf' CHECK (source_type IN ('pdf', 'drive')),
  source_url TEXT NOT NULL,
  storage_key TEXT,
  mime_type TEXT,
  file_size INTEGER,
  page_count INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kitab_catalog_slug ON kitab_catalog(slug);
CREATE INDEX IF NOT EXISTS idx_kitab_catalog_status ON kitab_catalog(status);
CREATE INDEX IF NOT EXISTS idx_kitab_catalog_updated_at ON kitab_catalog(updated_at DESC);

-- SantriOnline digital book/novel foundation with coin ledger
CREATE TABLE IF NOT EXISTS buku_books (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_url TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'archived')),
  free_chapter_limit INTEGER NOT NULL DEFAULT 7,
  price_per_chapter INTEGER NOT NULL DEFAULT 300,
  admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_buku_books_author ON buku_books(author_id);
CREATE INDEX IF NOT EXISTS idx_buku_books_slug ON buku_books(slug);
CREATE INDEX IF NOT EXISTS idx_buku_books_status ON buku_books(status);

CREATE TABLE IF NOT EXISTS buku_chapters (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES buku_books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id, chapter_number)
);
CREATE INDEX IF NOT EXISTS idx_buku_chapters_book ON buku_chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_buku_chapters_book_number ON buku_chapters(book_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_buku_chapters_status ON buku_chapters(status);

CREATE TABLE IF NOT EXISTS buku_unlocks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES buku_books(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES buku_chapters(id) ON DELETE CASCADE,
  coin_spent INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, chapter_id)
);
CREATE INDEX IF NOT EXISTS idx_buku_unlocks_user ON buku_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_buku_unlocks_chapter ON buku_unlocks(chapter_id);

CREATE TABLE IF NOT EXISTS coin_wallets (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('topup', 'unlock_chapter', 'adjustment', 'refund')),
  amount INTEGER NOT NULL,
  balance_after INTEGER,
  description TEXT,
  reference_type TEXT,
  reference_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(type);

CREATE TABLE IF NOT EXISTS coin_topup_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_rupiah INTEGER NOT NULL,
  coin_amount INTEGER NOT NULL,
  proof_url TEXT,
  user_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_coin_topup_requests_user ON coin_topup_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_topup_requests_status ON coin_topup_requests(status);

CREATE TABLE IF NOT EXISTS buku_author_wallets (
  author_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_earned_coin INTEGER NOT NULL DEFAULT 0,
  pending_coin INTEGER NOT NULL DEFAULT 0,
  paid_coin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buku_author_royalty_ledger (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES buku_books(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES buku_chapters(id) ON DELETE CASCADE,
  unlock_id TEXT NOT NULL UNIQUE REFERENCES buku_unlocks(id) ON DELETE CASCADE,
  reader_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gross_coin INTEGER NOT NULL,
  author_coin INTEGER NOT NULL,
  platform_coin INTEGER NOT NULL,
  author_share_bps INTEGER NOT NULL DEFAULT 7000,
  platform_share_bps INTEGER NOT NULL DEFAULT 3000,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'reversed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_author ON buku_author_royalty_ledger(author_id);
CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_book ON buku_author_royalty_ledger(book_id);
CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_chapter ON buku_author_royalty_ledger(chapter_id);
CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_reader ON buku_author_royalty_ledger(reader_id);
CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_status ON buku_author_royalty_ledger(status);
CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_created ON buku_author_royalty_ledger(created_at);
