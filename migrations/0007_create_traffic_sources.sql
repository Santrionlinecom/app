CREATE TABLE IF NOT EXISTS traffic_sources (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  last_clicked INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_traffic_org_source
  ON traffic_sources(organization_id, source);

CREATE INDEX IF NOT EXISTS idx_traffic_org_clicked
  ON traffic_sources(organization_id, last_clicked);
