-- Coin/top-up/tool pricing hardening
-- Safe after read-only production audit on 2026-08-08:
-- digital_product_sales has 0 rows, so the paid-owner unique index cannot conflict.
PRAGMA foreign_keys = ON;

ALTER TABLE coin_transactions ADD COLUMN balance_before INTEGER;
ALTER TABLE coin_transactions ADD COLUMN order_id TEXT;

-- Fail closed inside the migration transaction if ownership duplicates appeared
-- after preflight and before index creation. No customer row is deleted/reconciled silently.
CREATE TABLE migration_0058_paid_owner_guard (
  duplicate_count INTEGER NOT NULL CHECK (duplicate_count = 0)
);
INSERT INTO migration_0058_paid_owner_guard (duplicate_count)
SELECT COUNT(*)
FROM (
  SELECT buyer_user_id, product_id
  FROM digital_product_sales
  WHERE buyer_user_id IS NOT NULL AND status = 'paid'
  GROUP BY buyer_user_id, product_id
  HAVING COUNT(*) > 1
);
DROP TABLE migration_0058_paid_owner_guard;

CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_transactions_order_type
  ON coin_transactions(order_id, type)
  WHERE order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_digital_product_sales_paid_owner
  ON digital_product_sales(buyer_user_id, product_id)
  WHERE buyer_user_id IS NOT NULL AND status = 'paid';

UPDATE digital_products
SET price = 9900,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE slug IN (
  'santriprint-pro',
  'santri-ocr-pro',
  'santri-cleaner-pro',
  'santri-subtitle-pro'
);
