-- Idempotent outbox for WhatsApp payment-success notifications.
-- Recipient is intentionally stored as last 4 digits only; full phone remains in users.whatsapp.
CREATE TABLE IF NOT EXISTS payment_notification_deliveries (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  recipient_last4 TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'sending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  provider_message_id TEXT,
  last_error_code TEXT,
  last_error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sent_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_payment_notifications_order
  ON payment_notification_deliveries(order_id, channel, event_type);