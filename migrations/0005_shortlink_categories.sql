-- Migration: shortlink categories and affiliate tracking metadata
--
-- Cloudflare D1's SQLite build does not support ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
-- This migration rebuilds short_links into the desired shape so the file can be
-- executed more than once without duplicate-column errors.

CREATE TABLE IF NOT EXISTS short_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  target_url TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS short_links_category_metadata_backup (
  slug TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'other' CHECK (
    category IN (
      'affiliate_marketplace',
      'affiliate_app',
      'affiliate_course',
      'campaign_dakwah',
      'campaign_jasa',
      'internal_app',
      'internal_docs',
      'other'
    )
  ),
  tags TEXT,
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS short_links_category_migration_new;

CREATE TABLE short_links_category_migration_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  target_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other' CHECK (
    category IN (
      'affiliate_marketplace',
      'affiliate_app',
      'affiliate_course',
      'campaign_dakwah',
      'campaign_jasa',
      'internal_app',
      'internal_docs',
      'other'
    )
  ),
  tags TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO short_links_category_migration_new (
  id,
  slug,
  title,
  description,
  target_url,
  is_active,
  created_by,
  created_at,
  updated_at
)
SELECT
  id,
  slug,
  title,
  description,
  target_url,
  is_active,
  created_by,
  created_at,
  updated_at
FROM short_links;

UPDATE short_links_category_migration_new
SET
  category = COALESCE(
    (SELECT category FROM short_links_category_metadata_backup WHERE short_links_category_metadata_backup.slug = short_links_category_migration_new.slug),
    category
  ),
  tags = (SELECT tags FROM short_links_category_metadata_backup WHERE short_links_category_metadata_backup.slug = short_links_category_migration_new.slug),
  notes = (SELECT notes FROM short_links_category_metadata_backup WHERE short_links_category_metadata_backup.slug = short_links_category_migration_new.slug)
WHERE EXISTS (
  SELECT 1
  FROM short_links_category_metadata_backup
  WHERE short_links_category_metadata_backup.slug = short_links_category_migration_new.slug
);

DROP TABLE short_links;

ALTER TABLE short_links_category_migration_new RENAME TO short_links;

INSERT INTO short_links_category_metadata_backup (slug, category, tags, notes, updated_at)
SELECT slug, category, tags, notes, CURRENT_TIMESTAMP
FROM short_links
WHERE 1
ON CONFLICT(slug) DO UPDATE SET
  category = excluded.category,
  tags = excluded.tags,
  notes = excluded.notes,
  updated_at = CURRENT_TIMESTAMP;

DROP TRIGGER IF EXISTS short_links_category_backup_insert;
DROP TRIGGER IF EXISTS short_links_category_backup_update;
DROP TRIGGER IF EXISTS short_links_category_backup_delete;

CREATE TRIGGER short_links_category_backup_insert
AFTER INSERT ON short_links
BEGIN
  INSERT INTO short_links_category_metadata_backup (slug, category, tags, notes, updated_at)
  VALUES (NEW.slug, NEW.category, NEW.tags, NEW.notes, CURRENT_TIMESTAMP)
  ON CONFLICT(slug) DO UPDATE SET
    category = excluded.category,
    tags = excluded.tags,
    notes = excluded.notes,
    updated_at = CURRENT_TIMESTAMP;
END;

CREATE TRIGGER short_links_category_backup_update
AFTER UPDATE OF slug, category, tags, notes ON short_links
BEGIN
  DELETE FROM short_links_category_metadata_backup WHERE slug = OLD.slug AND OLD.slug <> NEW.slug;
  INSERT INTO short_links_category_metadata_backup (slug, category, tags, notes, updated_at)
  VALUES (NEW.slug, NEW.category, NEW.tags, NEW.notes, CURRENT_TIMESTAMP)
  ON CONFLICT(slug) DO UPDATE SET
    category = excluded.category,
    tags = excluded.tags,
    notes = excluded.notes,
    updated_at = CURRENT_TIMESTAMP;
END;

CREATE TRIGGER short_links_category_backup_delete
AFTER DELETE ON short_links
BEGIN
  DELETE FROM short_links_category_metadata_backup WHERE slug = OLD.slug;
END;

CREATE INDEX IF NOT EXISTS idx_short_links_slug ON short_links(slug);
CREATE INDEX IF NOT EXISTS idx_short_links_active ON short_links(is_active);
CREATE INDEX IF NOT EXISTS idx_short_links_category ON short_links(category);
CREATE INDEX IF NOT EXISTS idx_short_links_category_active ON short_links(category, is_active);
