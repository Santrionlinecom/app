-- Migration: Quran Asbabun Nuzul sources and entries

CREATE TABLE IF NOT EXISTS quran_asbab_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  publisher TEXT,
  language TEXT DEFAULT 'id',
  source_type TEXT DEFAULT 'book',
  source_url TEXT,
  license_note TEXT,
  priority INTEGER DEFAULT 100,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quran_asbab_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key TEXT NOT NULL,
  surah_number INTEGER NOT NULL,
  ayah_start INTEGER NOT NULL,
  ayah_end INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  riwayat TEXT,
  takhrij TEXT,
  grade TEXT,
  page_ref TEXT,
  status TEXT DEFAULT 'draft',
  verified_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quran_asbab_entries_lookup
  ON quran_asbab_entries(surah_number, ayah_start, ayah_end);

CREATE INDEX IF NOT EXISTS idx_quran_asbab_entries_source
  ON quran_asbab_entries(source_key);

CREATE INDEX IF NOT EXISTS idx_quran_asbab_entries_status
  ON quran_asbab_entries(status);

INSERT OR IGNORE INTO quran_asbab_sources (
  source_key,
  title,
  author,
  publisher,
  language,
  source_type,
  priority,
  is_active
) VALUES (
  'lpmq_asbabun_nuzul',
  'Asbabun Nuzul: Kronologi dan Sebab Turun Wahyu Al-Qur’an',
  'Lajnah Pentashihan Mushaf Al-Qur’an',
  'Kementerian Agama RI',
  'id',
  'book',
  10,
  1
);

INSERT OR IGNORE INTO quran_asbab_sources (
  source_key,
  title,
  author,
  language,
  source_type,
  priority,
  is_active
) VALUES (
  'suyuthi_lubabun_nuqul',
  'Lubabun Nuqul fi Asbabin Nuzul',
  'Imam Jalaluddin as-Suyuthi',
  'ar',
  'classical_book',
  20,
  1
);

INSERT OR IGNORE INTO quran_asbab_sources (
  source_key,
  title,
  author,
  language,
  source_type,
  priority,
  is_active
) VALUES (
  'wahidi_asbabun_nuzul',
  'Asbabun Nuzul',
  'Imam al-Wahidi',
  'ar',
  'classical_book',
  30,
  1
);

INSERT OR IGNORE INTO quran_asbab_sources (
  source_key,
  title,
  author,
  language,
  source_type,
  license_note,
  priority,
  is_active
) VALUES (
  'dataset_asbab_al_nuzul',
  'Asbab al-Nuzul Dataset',
  'Public dataset',
  'en',
  'dataset',
  'Dataset bantu. Perlu validasi sebelum dipublish.',
  90,
  1
);
