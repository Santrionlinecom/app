-- Tambah kolom untuk berita RSS auto-generated di tabel CMS yang dipakai aplikasi.

ALTER TABLE cms_posts ADD COLUMN source_name TEXT;
ALTER TABLE cms_posts ADD COLUMN source_url TEXT;
ALTER TABLE cms_posts ADD COLUMN is_auto_generated INTEGER DEFAULT 0;
ALTER TABLE cms_posts ADD COLUMN kategori TEXT DEFAULT 'umum';
ALTER TABLE cms_posts ADD COLUMN tags TEXT DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_cms_posts_auto ON cms_posts(is_auto_generated);
CREATE INDEX IF NOT EXISTS idx_cms_posts_kategori ON cms_posts(kategori);
CREATE INDEX IF NOT EXISTS idx_cms_posts_source ON cms_posts(source_url);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cms_posts_source_unique
  ON cms_posts(source_url)
  WHERE source_url IS NOT NULL;
