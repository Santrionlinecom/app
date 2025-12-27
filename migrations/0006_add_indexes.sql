-- Migration: add indexes for performance (Phase 1)
CREATE INDEX IF NOT EXISTS idx_hafalan_progress_user_id ON hafalan_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_cms_posts_slug ON cms_posts(slug);
