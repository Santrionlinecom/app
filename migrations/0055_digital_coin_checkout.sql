-- Canonical, replay-safe Digital Store coin checkout.
ALTER TABLE digital_product_sales ADD COLUMN buyer_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE digital_product_sales ADD COLUMN purchase_key TEXT;

CREATE INDEX IF NOT EXISTS idx_digital_product_sales_buyer_user
  ON digital_product_sales(buyer_user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_digital_product_sales_purchase_key
  ON digital_product_sales(purchase_key)
  WHERE purchase_key IS NOT NULL;
