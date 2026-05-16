-- Migration: Quran user bookmarks and reading progress

CREATE TABLE IF NOT EXISTS quran_bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  note TEXT,
  tags TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, surah_number, ayah_number)
);

CREATE TABLE IF NOT EXISTS quran_reading_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  juz_number INTEGER,
  last_read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_quran_bookmarks_user
  ON quran_bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_quran_bookmarks_lookup
  ON quran_bookmarks(user_id, surah_number, ayah_number);

CREATE INDEX IF NOT EXISTS idx_quran_reading_progress_user
  ON quran_reading_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_quran_reading_progress_last_read
  ON quran_reading_progress(last_read_at);
