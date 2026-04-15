-- Migration: super admin digital commerce studio
CREATE TABLE IF NOT EXISTS digital_products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  cover_url TEXT,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS digital_payment_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('bank', 'ewallet', 'qris', 'manual')),
  account_name TEXT,
  account_number TEXT,
  instructions TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS digital_product_payment_methods (
  product_id TEXT NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  payment_method_id TEXT NOT NULL REFERENCES digital_payment_methods(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (product_id, payment_method_id)
);

CREATE TABLE IF NOT EXISTS digital_product_sales (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  buyer_name TEXT,
  buyer_contact TEXT,
  amount INTEGER NOT NULL,
  payment_method_id TEXT REFERENCES digital_payment_methods(id) ON DELETE SET NULL,
  payment_method_name TEXT,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_digital_products_slug ON digital_products(slug);
CREATE INDEX IF NOT EXISTS idx_digital_products_status ON digital_products(status);
CREATE INDEX IF NOT EXISTS idx_digital_payment_methods_active ON digital_payment_methods(is_active, display_order, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_digital_product_payment_methods_product ON digital_product_payment_methods(product_id);
CREATE INDEX IF NOT EXISTS idx_digital_product_sales_created ON digital_product_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_digital_product_sales_product ON digital_product_sales(product_id, status);
