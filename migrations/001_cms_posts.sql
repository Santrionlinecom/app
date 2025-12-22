-- Migration: Add CMS posts table
CREATE TABLE IF NOT EXISTS cms_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cms_posts_slug ON cms_posts(slug);
CREATE INDEX IF NOT EXISTS idx_cms_posts_status ON cms_posts(status);
