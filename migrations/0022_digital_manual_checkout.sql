-- Migration: manual checkout flow for digital products
ALTER TABLE digital_payment_methods ADD COLUMN asset_url TEXT;

ALTER TABLE digital_product_sales ADD COLUMN reference_code TEXT;
ALTER TABLE digital_product_sales ADD COLUMN proof_url TEXT;
ALTER TABLE digital_product_sales ADD COLUMN proof_key TEXT;
ALTER TABLE digital_product_sales ADD COLUMN proof_mime_type TEXT;
ALTER TABLE digital_product_sales ADD COLUMN proof_size INTEGER;
ALTER TABLE digital_product_sales ADD COLUMN proof_uploaded_at INTEGER;
ALTER TABLE digital_product_sales ADD COLUMN admin_notes TEXT;
ALTER TABLE digital_product_sales ADD COLUMN verified_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE digital_product_sales ADD COLUMN verified_at INTEGER;
ALTER TABLE digital_product_sales ADD COLUMN access_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_digital_product_sales_reference_code ON digital_product_sales(reference_code);
CREATE INDEX IF NOT EXISTS idx_digital_product_sales_status_created ON digital_product_sales(status, created_at DESC);
