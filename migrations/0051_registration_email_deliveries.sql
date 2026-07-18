CREATE TABLE IF NOT EXISTS registration_email_deliveries (
	user_id TEXT PRIMARY KEY,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
	provider_message_id TEXT,
	attempts INTEGER NOT NULL DEFAULT 0,
	last_error_code TEXT,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL,
	sent_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_registration_email_deliveries_status_updated
	ON registration_email_deliveries(status, updated_at);
