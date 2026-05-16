-- Remove unused shortlink tags metadata.
PRAGMA foreign_keys = OFF;

DROP TRIGGER IF EXISTS short_links_category_backup_insert;
DROP TRIGGER IF EXISTS short_links_category_backup_update;
DROP TRIGGER IF EXISTS short_links_category_backup_delete;

DROP TABLE IF EXISTS short_links_without_tags;

CREATE TABLE short_links_without_tags (
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
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO short_links_without_tags (
  id,
  slug,
  title,
  description,
  target_url,
  category,
  notes,
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
  CASE
    WHEN category IN (
      'affiliate_marketplace',
      'affiliate_app',
      'affiliate_course',
      'campaign_dakwah',
      'campaign_jasa',
      'internal_app',
      'internal_docs',
      'other'
    ) THEN category
    ELSE 'other'
  END,
  notes,
  is_active,
  created_by,
  created_at,
  updated_at
FROM short_links;

DROP TABLE short_links;
ALTER TABLE short_links_without_tags RENAME TO short_links;

DROP TABLE IF EXISTS short_links_category_metadata_backup_without_tags;

CREATE TABLE short_links_category_metadata_backup_without_tags (
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
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO short_links_category_metadata_backup_without_tags (
  slug,
  category,
  notes,
  updated_at
)
SELECT
  slug,
  CASE
    WHEN category IN (
      'affiliate_marketplace',
      'affiliate_app',
      'affiliate_course',
      'campaign_dakwah',
      'campaign_jasa',
      'internal_app',
      'internal_docs',
      'other'
    ) THEN category
    ELSE 'other'
  END,
  notes,
  updated_at
FROM short_links_category_metadata_backup;

DROP TABLE short_links_category_metadata_backup;
ALTER TABLE short_links_category_metadata_backup_without_tags RENAME TO short_links_category_metadata_backup;

CREATE TRIGGER short_links_category_backup_insert
AFTER INSERT ON short_links
BEGIN
  INSERT INTO short_links_category_metadata_backup (slug, category, notes, updated_at)
  VALUES (NEW.slug, NEW.category, NEW.notes, CURRENT_TIMESTAMP)
  ON CONFLICT(slug) DO UPDATE SET
    category = excluded.category,
    notes = excluded.notes,
    updated_at = CURRENT_TIMESTAMP;
END;

CREATE TRIGGER short_links_category_backup_update
AFTER UPDATE OF slug, category, notes ON short_links
BEGIN
  DELETE FROM short_links_category_metadata_backup WHERE slug = OLD.slug AND OLD.slug <> NEW.slug;
  INSERT INTO short_links_category_metadata_backup (slug, category, notes, updated_at)
  VALUES (NEW.slug, NEW.category, NEW.notes, CURRENT_TIMESTAMP)
  ON CONFLICT(slug) DO UPDATE SET
    category = excluded.category,
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

PRAGMA foreign_keys = ON;
