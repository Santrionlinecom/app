-- Migration: Media library to reuse uploaded images
CREATE TABLE IF NOT EXISTS media_library (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT,
  size INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_created_at ON media_library(created_at DESC);
