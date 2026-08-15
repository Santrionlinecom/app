-- SantriPrint 1.3.6: three paid store SKUs mapped to one compatible runtime license product.
-- Store package identity stays on digital_products/license rows; desktop activation keeps santriprint-pro.
PRAGMA foreign_keys = ON;

ALTER TABLE digital_products ADD COLUMN license_product_id TEXT NULL REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE digital_products ADD COLUMN license_package TEXT NULL;
ALTER TABLE digital_products ADD COLUMN checkout_policy TEXT NOT NULL DEFAULT 'assigned_methods' CHECK (checkout_policy IN ('coin_only','assigned_methods'));
ALTER TABLE licenses ADD COLUMN source_sale_id TEXT NULL REFERENCES digital_product_sales(id) ON DELETE SET NULL;
ALTER TABLE licenses ADD COLUMN package_slug TEXT NULL;
CREATE TABLE IF NOT EXISTS digital_support_requests (
  id TEXT PRIMARY KEY, sale_id TEXT NOT NULL UNIQUE REFERENCES digital_product_sales(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending_contact' CHECK (status IN ('pending_contact','contacted','scheduled','completed','cancelled')),
  requested_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  updated_by TEXT NULL REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS digital_support_request_transitions (
  id TEXT PRIMARY KEY, support_request_id TEXT NOT NULL REFERENCES digital_support_requests(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL, to_status TEXT NOT NULL, actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_support_transitions_request_time ON digital_support_request_transitions(support_request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_digital_support_requests_user_status ON digital_support_requests(user_id, status, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_source_sale_id
  ON licenses(source_sale_id) WHERE source_sale_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_digital_products_license_product
  ON digital_products(license_product_id);

INSERT INTO products (
  id, slug, name, plan, status, default_max_devices, features_json, created_at, updated_at
) VALUES (
  'prod_santriprint_pro', 'santriprint-pro', 'SantriPrint Pro 1.3.6', 'pro', 'active', 2,
  '["print_layout","export_pdf","native_print","multi_page","templates"]',
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
)
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug, name = excluded.name, plan = excluded.plan, status = excluded.status,
  default_max_devices = excluded.default_max_devices, features_json = excluded.features_json,
  updated_at = excluded.updated_at;

INSERT INTO digital_products (
  id, title, slug, summary, description, price, cover_url, file_url, status, featured,
  created_at, updated_at, license_product_id, license_package, checkout_policy
) VALUES
(
  'dprod_santriprint_promo', 'SantriPrint Promo', 'santriprint-promo',
  'Lisensi SantriPrint 1.3.6 harga promo untuk 2 perangkat.',
  'Paket Promo SantriPrint 1.3.6 untuk membuat layout cetak foto, ekspor PDF, dan cetak langsung dari Windows. Harga sekali beli. Aktivasi maksimal 2 perangkat.',
  6900, 'https://files.santrionline.com/digital-products/santriprint/santriprint-pro-cover-1.3.6.png',
  'r2://digital-products/santriprint/SantriPrint_1.3.6_x64-setup.exe', 'published', 1,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  'prod_santriprint_pro', 'promo', 'coin_only'
),
(
  'dprod_santriprint_pro', 'SantriPrint Pro', 'santriprint-pro',
  'Lisensi SantriPrint 1.3.6 Pro untuk 2 perangkat.',
  'Paket Pro SantriPrint 1.3.6 untuk membuat layout cetak foto, ekspor PDF, dan cetak langsung dari Windows. Harga sekali beli. Aktivasi maksimal 2 perangkat.',
  12900, 'https://files.santrionline.com/digital-products/santriprint/santriprint-pro-cover-1.3.6.png',
  'r2://digital-products/santriprint/SantriPrint_1.3.6_x64-setup.exe', 'published', 1,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  'prod_santriprint_pro', 'pro', 'coin_only'
),
(
  'dprod_santriprint_bantuan', 'SantriPrint Bantuan', 'santriprint-bantuan',
  'Lisensi SantriPrint 1.3.6 dengan bantuan instalasi dan onboarding.',
  'Paket Bantuan SantriPrint 1.3.6 mencakup lisensi, bantuan instalasi, dan onboarding penggunaan. Membuat layout cetak foto, ekspor PDF, dan cetak langsung dari Windows. Harga sekali beli. Aktivasi maksimal 2 perangkat.',
  19900, 'https://files.santrionline.com/digital-products/santriprint/santriprint-pro-cover-1.3.6.png',
  'r2://digital-products/santriprint/SantriPrint_1.3.6_x64-setup.exe', 'published', 1,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  'prod_santriprint_pro', 'bantuan', 'coin_only'
)
ON CONFLICT(id) DO UPDATE SET
  title = excluded.title, slug = excluded.slug, summary = excluded.summary,
  description = excluded.description, price = excluded.price, cover_url = excluded.cover_url,
  file_url = excluded.file_url, status = excluded.status, featured = excluded.featured,
  license_product_id = excluded.license_product_id, license_package = excluded.license_package,
  checkout_policy = 'coin_only',
  updated_at = excluded.updated_at;

-- Launch policy: SantriPrint is coin-only; detach every manual/provider method.
DELETE FROM digital_product_payment_methods
WHERE product_id IN (SELECT id FROM digital_products WHERE slug IN ('santriprint-promo', 'santriprint-pro', 'santriprint-bantuan'));
