-- Migration: Add author-managed folders for Buku Studio
CREATE TABLE IF NOT EXISTS buku_folders (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(author_id, name)
);

ALTER TABLE buku_books ADD COLUMN folder_id TEXT;

CREATE INDEX IF NOT EXISTS idx_buku_folders_author ON buku_folders(author_id);
CREATE INDEX IF NOT EXISTS idx_buku_books_folder ON buku_books(folder_id);
