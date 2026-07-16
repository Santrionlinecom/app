-- Security remediation after independent Business Agent review.
-- Production migration 0049 has already been applied; keep this migration additive.

ALTER TABLE business_leads ADD COLUMN mutation_token TEXT;
ALTER TABLE business_quotes ADD COLUMN mutation_token TEXT;
ALTER TABLE business_approvals ADD COLUMN mutation_token TEXT;

-- Default to fail-closed for every mutable Business Agent route.
UPDATE business_kill_switches
SET enabled = 1,
    reason = 'Security review remediation; explicit activation required',
    updated_by = 'migration-0050',
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE scope = 'global';

-- State history is immutable at the database boundary, just like audit events.
CREATE TRIGGER IF NOT EXISTS business_state_transitions_no_update
BEFORE UPDATE ON business_state_transitions
BEGIN
  SELECT RAISE(ABORT, 'business state transitions are append-only');
END;

CREATE TRIGGER IF NOT EXISTS business_state_transitions_no_delete
BEFORE DELETE ON business_state_transitions
BEGIN
  SELECT RAISE(ABORT, 'business state transitions are append-only');
END;

CREATE TRIGGER IF NOT EXISTS business_approvals_integrity_insert
BEFORE INSERT ON business_approvals
WHEN
  NEW.expires_at <= NEW.requested_at
  OR (NEW.status = 'pending' AND (NEW.decided_by IS NOT NULL OR NEW.decided_at IS NOT NULL OR NEW.decision_note IS NOT NULL))
  OR (NEW.status IN ('approved', 'rejected') AND (NEW.decided_by IS NULL OR NEW.decided_at IS NULL))
  OR NOT (
    (NEW.action_type IN ('quote_approval', 'send_quote', 'create_midtrans_invoice') AND NEW.resource_type = 'quote')
    OR (NEW.action_type = 'refund' AND NEW.resource_type = 'order')
    OR (NEW.action_type = 'revoke_license' AND NEW.resource_type = 'license')
    OR (NEW.action_type = 'manage_policy' AND NEW.resource_type = 'policy')
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid business approval integrity');
END;

CREATE TRIGGER IF NOT EXISTS business_approvals_integrity_update
BEFORE UPDATE ON business_approvals
WHEN
  NEW.expires_at <= NEW.requested_at
  OR (NEW.status = 'pending' AND (NEW.decided_by IS NOT NULL OR NEW.decided_at IS NOT NULL OR NEW.decision_note IS NOT NULL))
  OR (NEW.status IN ('approved', 'rejected') AND (NEW.decided_by IS NULL OR NEW.decided_at IS NULL))
  OR NOT (
    (NEW.action_type IN ('quote_approval', 'send_quote', 'create_midtrans_invoice') AND NEW.resource_type = 'quote')
    OR (NEW.action_type = 'refund' AND NEW.resource_type = 'order')
    OR (NEW.action_type = 'revoke_license' AND NEW.resource_type = 'license')
    OR (NEW.action_type = 'manage_policy' AND NEW.resource_type = 'policy')
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid business approval integrity');
END;

CREATE TRIGGER IF NOT EXISTS business_quote_approval_resource_insert
BEFORE INSERT ON business_approvals
WHEN NEW.resource_type = 'quote'
 AND NOT EXISTS (SELECT 1 FROM business_quotes WHERE id = NEW.resource_id)
BEGIN
  SELECT RAISE(ABORT, 'business quote approval resource missing');
END;

CREATE TRIGGER IF NOT EXISTS business_quote_approval_resource_update
BEFORE UPDATE OF resource_type, resource_id ON business_approvals
WHEN NEW.resource_type = 'quote'
 AND NOT EXISTS (SELECT 1 FROM business_quotes WHERE id = NEW.resource_id)
BEGIN
  SELECT RAISE(ABORT, 'business quote approval resource missing');
END;
