-- DRM buku digital: akses privat, perangkat, progress halaman, dan log audit.

CREATE TABLE IF NOT EXISTS user_devices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  user_id TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  device_ip TEXT,
  last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, device_fingerprint)
);

CREATE TABLE IF NOT EXISTS user_book_access (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  chapter_id TEXT,
  access_type TEXT DEFAULT 'coin',
  coin_spent INTEGER DEFAULT 0,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, book_id, chapter_id)
);

CREATE TABLE IF NOT EXISTS reading_progress (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  chapter_id TEXT,
  current_page INTEGER DEFAULT 1,
  total_pages INTEGER DEFAULT 0,
  percentage REAL DEFAULT 0,
  last_read DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, book_id, chapter_id)
);

CREATE TABLE IF NOT EXISTS drm_access_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  chapter_id TEXT,
  device_fingerprint TEXT,
  action TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_book_access_user ON user_book_access(user_id, book_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_book_access_scope
  ON user_book_access(user_id, book_id, COALESCE(chapter_id, ''));
CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON reading_progress(user_id, book_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_progress_scope
  ON reading_progress(user_id, book_id, COALESCE(chapter_id, ''));
CREATE INDEX IF NOT EXISTS idx_drm_access_log_user ON drm_access_log(user_id, book_id, created_at);
