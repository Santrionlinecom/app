-- Payment order metadata for external payment providers.
-- Keep provider order_id short; store business metadata here instead.

CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'midtrans',
  purpose TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  lembaga_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  product_slug TEXT NOT NULL,
  package_name TEXT,
  gross_amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'IDR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sukses','gagal','expired','canceled','denied','refunded')),
  provider_status TEXT,
  provider_token TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user
  ON payment_orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_orders_status
  ON payment_orders(provider, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_orders_lembaga
  ON payment_orders(lembaga_id, created_at DESC);
