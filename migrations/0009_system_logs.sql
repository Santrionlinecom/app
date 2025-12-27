CREATE TABLE IF NOT EXISTS system_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  metadata TEXT,
  ip_address TEXT,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_action_created_at ON system_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_created_at ON system_logs(user_id, created_at);
