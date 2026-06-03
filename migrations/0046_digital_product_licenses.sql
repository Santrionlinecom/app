-- Migration: digital product licenses for SantriOnline ecosystem
PRAGMA foreign_keys = ON;

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

ALTER TABLE licenses ADD COLUMN product_id TEXT NULL REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE licenses ADD COLUMN license_key_hash TEXT NULL;
ALTER TABLE licenses ADD COLUMN max_devices INTEGER NULL;
ALTER TABLE licenses ADD COLUMN features_json TEXT NULL;
ALTER TABLE licenses ADD COLUMN activated_at INTEGER NULL;
ALTER TABLE licenses ADD COLUMN updated_at INTEGER NULL;

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
CREATE INDEX IF NOT EXISTS idx_licenses_user_status ON licenses(user_id, status);
CREATE INDEX IF NOT EXISTS idx_licenses_user_email_status ON licenses(user_email, status);
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at ON licenses(expires_at);
CREATE INDEX IF NOT EXISTS idx_license_activations_license_status
  ON license_activations(license_id, status);
CREATE INDEX IF NOT EXISTS idx_license_activations_device_hash
  ON license_activations(device_hash);
CREATE INDEX IF NOT EXISTS idx_license_activations_last_seen
  ON license_activations(last_seen_at);

UPDATE licenses
SET max_devices = device_limit
WHERE max_devices IS NULL;

INSERT INTO products (id, slug, name, plan, status, default_max_devices, features_json, created_at, updated_at)
VALUES
  (
    'prod_santri_cleaner_free',
    'santri-cleaner-free',
    'Santri Cleaner Free',
    'free',
    'active',
    1,
    '["basic_scan","basic_cleaner"]',
    CAST(strftime('%s', 'now') AS INTEGER) * 1000,
    CAST(strftime('%s', 'now') AS INTEGER) * 1000
  ),
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
    'prod_santri_studio_free',
    'santri-studio-free',
    'Santri Studio Free',
    'free',
    'active',
    1,
    '["basic_studio"]',
    CAST(strftime('%s', 'now') AS INTEGER) * 1000,
    CAST(strftime('%s', 'now') AS INTEGER) * 1000
  ),
  (
    'prod_santri_studio_pro',
    'santri-studio-pro',
    'Santri Studio Pro',
    'pro',
    'active',
    3,
    '["advanced_studio","export_assets","premium_templates"]',
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
