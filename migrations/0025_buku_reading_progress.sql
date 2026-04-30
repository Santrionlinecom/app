-- Migration: Buku reading progress and bookmarks
CREATE TABLE IF NOT EXISTS buku_reading_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES buku_books(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES buku_chapters(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  last_read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, book_id)
);

CREATE TABLE IF NOT EXISTS buku_bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES buku_books(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES buku_chapters(id) ON DELETE CASCADE,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, book_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_buku_reading_progress_user ON buku_reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_buku_reading_progress_book ON buku_reading_progress(book_id);
CREATE INDEX IF NOT EXISTS idx_buku_reading_progress_last_read ON buku_reading_progress(last_read_at);
CREATE INDEX IF NOT EXISTS idx_buku_bookmarks_user ON buku_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_buku_bookmarks_book ON buku_bookmarks(book_id);
