-- Migration: organization media gallery
CREATE TABLE IF NOT EXISTS org_media (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_org_media_org ON org_media(organization_id, created_at DESC);
