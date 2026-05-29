CREATE TABLE IF NOT EXISTS organization_memberships (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  user_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  org_type TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  invited_by TEXT,
  joined_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, org_id, role),
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON organization_memberships(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_memberships_org ON organization_memberships(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON organization_memberships(org_id, role, is_active);

INSERT OR IGNORE INTO organization_memberships (user_id, org_id, org_type, role, is_active)
SELECT
  u.id,
  u.org_id,
  COALESCE(o.type, 'tpq'),
  COALESCE(u.role, 'santri'),
  1
FROM users u
LEFT JOIN organizations o ON o.id = u.org_id
WHERE u.org_id IS NOT NULL AND u.role IS NOT NULL;
