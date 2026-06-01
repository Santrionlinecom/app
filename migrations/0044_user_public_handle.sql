ALTER TABLE users ADD COLUMN public_handle TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_public_handle
  ON users(public_handle);
