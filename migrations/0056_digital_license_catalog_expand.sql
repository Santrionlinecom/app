-- Migration: expand digital license product catalog + hardening notes
-- Unified desktop products: SantriPrint, SantriOCR, Santri Cleaner, Santri Subtitle
PRAGMA foreign_keys = ON;

-- Ensure products table exists (idempotent for environments that only partial-migrated)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  default_max_devices INTEGER NOT NULL DEFAULT 1 CHECK (default_max_devices > 0),
  features_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS license_activations (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
  device_hash TEXT NOT NULL,
  device_name TEXT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'deactivated')),
  activated_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  deactivated_at INTEGER NULL,
  metadata_json TEXT NULL,
  UNIQUE (license_id, device_hash)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_license_key_hash
  ON licenses(license_key_hash)
  WHERE license_key_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_licenses_product_id ON licenses(product_id);
CREATE INDEX IF NOT EXISTS idx_license_activations_license_status
  ON license_activations(license_id, status);
CREATE INDEX IF NOT EXISTS idx_license_activations_device_hash
  ON license_activations(device_hash);

INSERT INTO products (id, slug, name, plan, status, default_max_devices, features_json, created_at, updated_at)
VALUES
  (
    'prod_santri_cleaner_pro',
    'santri-cleaner-pro',
    'Santri Cleaner Pro',
    'pro',
    'active',
    3,
    '["deep_scan","developer_cleaner","creator_cleaner","export_pdf","ai_assistant"]',
    CAST(strftime('%s', 'now') AS INTEGER) * 1000,
    CAST(strftime('%s', 'now') AS INTEGER) * 1000
  ),
  (
    'prod_santriprint_pro',
    'santriprint-pro',
    'SantriPrint Pro',
    'pro',
    'active',
    2,
    '["print_layout","export_pdf","native_print","multi_page","templates"]',
    CAST(strftime('%s', 'now') AS INTEGER) * 1000,
    CAST(strftime('%s', 'now') AS INTEGER) * 1000
  ),
  (
    'prod_santri_ocr_pro',
    'santri-ocr-pro',
    'SantriOCR Pro',
    'pro',
    'active',
    2,
    '["ocr_arabic","ocr_indonesia","multi_page","export_docx","export_txt","offline_privacy"]',
    CAST(strftime('%s', 'now') AS INTEGER) * 1000,
    CAST(strftime('%s', 'now') AS INTEGER) * 1000
  ),
  (
    'prod_santri_subtitle_pro',
    'santri-subtitle-pro',
    'Santri Subtitle Pro',
    'pro',
    'active',
    2,
    '["subtitle_edit","export_srt","batch_export","templates"]',
    CAST(strftime('%s', 'now') AS INTEGER) * 1000,
    CAST(strftime('%s', 'now') AS INTEGER) * 1000
  )
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  name = excluded.name,
  plan = excluded.plan,
  status = excluded.status,
  default_max_devices = excluded.default_max_devices,
  features_json = excluded.features_json,
  updated_at = excluded.updated_at;

-- Also upsert by slug if id differs in older envs
INSERT INTO products (id, slug, name, plan, status, default_max_devices, features_json, created_at, updated_at)
SELECT id, slug, name, plan, status, default_max_devices, features_json, created_at, updated_at
FROM (
  SELECT
    'prod_santriprint_pro' AS id,
    'santriprint-pro' AS slug,
    'SantriPrint Pro' AS name,
    'pro' AS plan,
    'active' AS status,
    2 AS default_max_devices,
    '["print_layout","export_pdf","native_print","multi_page","templates"]' AS features_json,
    CAST(strftime('%s', 'now') AS INTEGER) * 1000 AS created_at,
    CAST(strftime('%s', 'now') AS INTEGER) * 1000 AS updated_at
) AS src
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'santriprint-pro');

INSERT INTO products (id, slug, name, plan, status, default_max_devices, features_json, created_at, updated_at)
SELECT id, slug, name, plan, status, default_max_devices, features_json, created_at, updated_at
FROM (
  SELECT
    'prod_santri_ocr_pro' AS id,
    'santri-ocr-pro' AS slug,
    'SantriOCR Pro' AS name,
    'pro' AS plan,
    'active' AS status,
    2 AS default_max_devices,
    '["ocr_arabic","ocr_indonesia","multi_page","export_docx","export_txt","offline_privacy"]' AS features_json,
    CAST(strftime('%s', 'now') AS INTEGER) * 1000 AS created_at,
    CAST(strftime('%s', 'now') AS INTEGER) * 1000 AS updated_at
) AS src
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'santri-ocr-pro');

INSERT INTO products (id, slug, name, plan, status, default_max_devices, features_json, created_at, updated_at)
SELECT id, slug, name, plan, status, default_max_devices, features_json, created_at, updated_at
FROM (
  SELECT
    'prod_santri_subtitle_pro' AS id,
    'santri-subtitle-pro' AS slug,
    'Santri Subtitle Pro' AS name,
    'pro' AS plan,
    'active' AS status,
    2 AS default_max_devices,
    '["subtitle_edit","export_srt","batch_export","templates"]' AS features_json,
    CAST(strftime('%s', 'now') AS INTEGER) * 1000 AS created_at,
    CAST(strftime('%s', 'now') AS INTEGER) * 1000 AS updated_at
) AS src
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'santri-subtitle-pro');
