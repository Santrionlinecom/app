-- Migration: public kitab library managed from CMS Hub
CREATE TABLE IF NOT EXISTS kitab_catalog (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  description TEXT,
  cover_url TEXT,
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
