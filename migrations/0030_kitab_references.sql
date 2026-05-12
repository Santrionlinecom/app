-- Migration: referensi kitab untuk pencarian AI dan import OpenITI
CREATE TABLE IF NOT EXISTS kitab_referensi (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  halaman TEXT,
  jilid TEXT,
  isi_teks TEXT NOT NULL,
  kitab_slug TEXT,
  source_type TEXT,
  source_ref TEXT,
  source_note TEXT,
  chapter TEXT,
  section_title TEXT,
  chunk_index INTEGER,
  author TEXT,
  category TEXT,
  madhhab TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kitab_referensi_judul ON kitab_referensi(judul);
CREATE INDEX IF NOT EXISTS idx_kitab_referensi_slug_chunk ON kitab_referensi(kitab_slug, chunk_index);
CREATE INDEX IF NOT EXISTS idx_kitab_referensi_source_type ON kitab_referensi(source_type);
