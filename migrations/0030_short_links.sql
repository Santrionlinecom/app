-- Migration: standalone shortlink analytics

CREATE TABLE IF NOT EXISTS short_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  target_url TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS short_link_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id INTEGER,
  slug TEXT NOT NULL,
  source TEXT,
  campaign TEXT,
  medium TEXT,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  colo TEXT,
  ip_hash TEXT,
  date_key TEXT NOT NULL,
  clicked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS short_link_daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id INTEGER,
  slug TEXT NOT NULL,
  date_key TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  unique_clicks INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(slug, date_key)
);

CREATE INDEX IF NOT EXISTS idx_short_links_slug ON short_links(slug);
CREATE INDEX IF NOT EXISTS idx_short_links_active ON short_links(is_active);
CREATE INDEX IF NOT EXISTS idx_short_link_clicks_slug_clicked_at ON short_link_clicks(slug, clicked_at);
CREATE INDEX IF NOT EXISTS idx_short_link_clicks_date_key ON short_link_clicks(date_key);
CREATE INDEX IF NOT EXISTS idx_short_link_clicks_source ON short_link_clicks(source);
CREATE INDEX IF NOT EXISTS idx_short_link_daily_stats_slug_date ON short_link_daily_stats(slug, date_key);

INSERT OR IGNORE INTO short_links (slug, title, target_url, is_active)
VALUES (
  'gotrade',
  'GoTrade - Belajar Saham Global',
  'https://example.com/gotrade-affiliate-link',
  1
);
