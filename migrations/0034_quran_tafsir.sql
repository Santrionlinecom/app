-- Migration: Quran Tafsir Indonesia sources and entries

CREATE TABLE IF NOT EXISTS quran_tafsir_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  publisher TEXT,
  language TEXT DEFAULT 'id',
  source_type TEXT DEFAULT 'tafsir',
  source_url TEXT,
  license_note TEXT,
  priority INTEGER DEFAULT 100,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quran_tafsir_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key TEXT NOT NULL,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  summary TEXT,
  page_ref TEXT,
  status TEXT DEFAULT 'draft',
  verified_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quran_tafsir_entries_lookup
  ON quran_tafsir_entries(surah_number, ayah_number);

CREATE INDEX IF NOT EXISTS idx_quran_tafsir_entries_source
  ON quran_tafsir_entries(source_key);

CREATE INDEX IF NOT EXISTS idx_quran_tafsir_entries_status
  ON quran_tafsir_entries(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quran_tafsir_entries_unique
  ON quran_tafsir_entries(source_key, surah_number, ayah_number);

INSERT OR IGNORE INTO quran_tafsir_sources (
  source_key,
  title,
  author,
  publisher,
  language,
  source_type,
  priority,
  is_active
) VALUES (
  'kemenag_tafsir_ringkas',
  'Tafsir Ringkas/Wajiz Kementerian Agama RI',
  'Lajnah Pentashihan Mushaf Al-Qur’an',
  'Kementerian Agama RI',
  'id',
  'tafsir',
  10,
  1
);
