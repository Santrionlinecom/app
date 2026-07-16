-- SantriOnline Business Agent MVP
-- Patterns adapted conceptually from Custodian Kernel, Mom-n-Pop Skills,
-- CashFromChaos, and Loop Engineering. D1 remains the source of truth.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS business_leads (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK(source IN ('web', 'telegram', 'admin', 'referral', 'import')),
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_whatsapp TEXT,
  organization_name TEXT,
  need_summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK(status IN ('new', 'discovery', 'qualified', 'quoted', 'lost')),
  created_by TEXT NOT NULL,
  assigned_to TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK(length(trim(contact_name)) BETWEEN 2 AND 120),
  CHECK(length(trim(need_summary)) BETWEEN 10 AND 4000),
  CHECK(contact_email IS NOT NULL OR contact_whatsapp IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_business_leads_status
  ON business_leads(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_leads_created_by
  ON business_leads(created_by, created_at DESC);

CREATE TABLE IF NOT EXISTS business_quotes (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES business_leads(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0),
  currency TEXT NOT NULL DEFAULT 'IDR',
  subtotal INTEGER NOT NULL CHECK(subtotal >= 0),
  discount INTEGER NOT NULL DEFAULT 0 CHECK(discount >= 0),
  total INTEGER NOT NULL CHECK(total >= 0),
  package_snapshot_json TEXT NOT NULL,
  assumptions_json TEXT NOT NULL DEFAULT '[]',
  payload_hash TEXT NOT NULL CHECK(length(payload_hash) = 64),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft', 'awaiting_approval', 'revision_required', 'approved', 'rejected', 'sent', 'accepted', 'expired', 'cancelled')),
  expires_at INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(lead_id, version),
  CHECK(total = subtotal - discount),
  CHECK(discount <= subtotal)
);

CREATE INDEX IF NOT EXISTS idx_business_quotes_lead
  ON business_quotes(lead_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_business_quotes_status
  ON business_quotes(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS business_approvals (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL
    CHECK(action_type IN ('quote_approval', 'send_quote', 'create_midtrans_invoice', 'refund', 'revoke_license', 'manage_policy')),
  resource_type TEXT NOT NULL CHECK(resource_type IN ('quote', 'order', 'license', 'policy')),
  resource_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL CHECK(length(payload_hash) = 64),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  requested_by TEXT NOT NULL,
  requested_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  decided_by TEXT,
  decided_at INTEGER,
  decision_note TEXT,
  CHECK(decided_by IS NULL OR decided_by <> requested_by)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_approvals_one_pending
  ON business_approvals(action_type, resource_type, resource_id)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_business_approvals_status
  ON business_approvals(status, expires_at);

CREATE TABLE IF NOT EXISTS business_orders (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES business_leads(id) ON DELETE RESTRICT,
  quote_id TEXT NOT NULL UNIQUE REFERENCES business_quotes(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'created'
    CHECK(status IN ('created', 'awaiting_payment', 'paid', 'provisioning', 'provisioning_failed', 'active', 'completed', 'expired', 'cancelled')),
  payment_order_id TEXT UNIQUE,
  license_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_business_orders_status
  ON business_orders(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_orders_payment
  ON business_orders(payment_order_id);

CREATE TABLE IF NOT EXISTS business_state_transitions (
  id TEXT PRIMARY KEY,
  aggregate_type TEXT NOT NULL CHECK(aggregate_type IN ('lead', 'quote', 'order', 'license')),
  aggregate_id TEXT NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK(actor_type IN ('admin', 'agent', 'system', 'payment_webhook')),
  actor_id TEXT NOT NULL,
  reason TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_business_transitions_resource
  ON business_state_transitions(aggregate_type, aggregate_id, created_at);

CREATE TABLE IF NOT EXISTS business_audit_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK(actor_type IN ('admin', 'agent', 'system', 'payment_webhook')),
  actor_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_business_audit_resource
  ON business_audit_events(resource_type, resource_id, created_at);
CREATE INDEX IF NOT EXISTS idx_business_audit_created
  ON business_audit_events(created_at DESC);

-- Audit trail is append-only at the database boundary.
CREATE TRIGGER IF NOT EXISTS business_audit_events_no_update
BEFORE UPDATE ON business_audit_events
BEGIN
  SELECT RAISE(ABORT, 'business audit events are append-only');
END;

CREATE TRIGGER IF NOT EXISTS business_audit_events_no_delete
BEFORE DELETE ON business_audit_events
BEGIN
  SELECT RAISE(ABORT, 'business audit events are append-only');
END;

CREATE TABLE IF NOT EXISTS business_idempotency_keys (
  scope TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL CHECK(length(request_hash) = 64),
  resource_id TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY(scope, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_business_idempotency_expiry
  ON business_idempotency_keys(expires_at);

CREATE TABLE IF NOT EXISTS business_kill_switches (
  scope TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0, 1)),
  reason TEXT,
  updated_by TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO business_kill_switches (scope, enabled, reason, updated_by, updated_at)
VALUES
  ('global', 0, 'Default safe state', 'migration', CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('midtrans_invoice', 1, 'Enable only after sandbox approval', 'migration', CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('telegram_approval', 1, 'Dedicated approval bot not configured', 'migration', CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  ('license_activation', 1, 'Enable only after provisioning tests', 'migration', CAST(strftime('%s', 'now') AS INTEGER) * 1000);

CREATE TABLE IF NOT EXISTS business_agent_jobs (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  input_json TEXT NOT NULL DEFAULT '{}',
  result_summary TEXT,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 3 CHECK(max_attempts BETWEEN 1 AND 10),
  token_budget INTEGER NOT NULL DEFAULT 12000 CHECK(token_budget BETWEEN 0 AND 100000),
  available_at INTEGER NOT NULL,
  lease_expires_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_business_agent_jobs_dispatch
  ON business_agent_jobs(status, available_at, created_at);
