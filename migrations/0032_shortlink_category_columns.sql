-- Ensure shortlink category and metadata columns exist in migration order
PRAGMA foreign_keys = ON;

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
FROM (
  SELECT
    id,
    slug,
    title,
    description,
    target_url,
    'other' AS category,
    NULL AS notes,
    is_active,
    created_by,
    created_at,
    updated_at
  FROM short_links
);

UPDATE short_links_category_migration_new
SET
  category = COALESCE(
    (SELECT category FROM short_links_category_metadata_backup WHERE short_links_category_metadata_backup.slug = short_links_category_migration_new.slug),
    category
  ),
  notes = COALESCE(
    (SELECT notes FROM short_links_category_metadata_backup WHERE short_links_category_metadata_backup.slug = short_links_category_migration_new.slug),
    notes
  )
WHERE EXISTS (
  SELECT 1
  FROM short_links_category_metadata_backup
  WHERE short_links_category_metadata_backup.slug = short_links_category_migration_new.slug
);

DROP TABLE short_links;

ALTER TABLE short_links_category_migration_new RENAME TO short_links;

INSERT INTO short_links_category_metadata_backup (slug, category, notes, updated_at)
SELECT slug, category, notes, CURRENT_TIMESTAMP
FROM short_links
WHERE 1
ON CONFLICT(slug) DO UPDATE SET
  category = excluded.category,
  notes = excluded.notes,
  updated_at = CURRENT_TIMESTAMP;

DROP TRIGGER IF EXISTS short_links_category_backup_insert;
DROP TRIGGER IF EXISTS short_links_category_backup_update;
DROP TRIGGER IF EXISTS short_links_category_backup_delete;

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
