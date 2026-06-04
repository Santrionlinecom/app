-- Migration: Add 'purchase' transaction type for coin transactions
-- This allows tracking coin usage for purchases (addon, digital products, etc)

-- Drop existing constraint and recreate with new type
-- Note: D1 doesn't support ALTER TABLE ... DROP CONSTRAINT, so we need to recreate the table

-- Create new table with updated constraint
CREATE TABLE IF NOT EXISTS coin_transactions_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('topup', 'unlock_chapter', 'purchase', 'adjustment', 'refund')),
  amount INTEGER NOT NULL,
  balance_after INTEGER,
  description TEXT,
  reference_type TEXT,
  reference_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Copy existing data
INSERT INTO coin_transactions_new 
SELECT * FROM coin_transactions;

-- Drop old table
DROP TABLE coin_transactions;

-- Rename new table
ALTER TABLE coin_transactions_new RENAME TO coin_transactions;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(type);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created ON coin_transactions(created_at DESC);
