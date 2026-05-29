CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  lembaga_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL DEFAULT 'santri',
  user_avatar_url TEXT,
  content TEXT NOT NULL CHECK(length(content) <= 500),
  media_url TEXT,
  media_type TEXT,
  reaction_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  is_reported INTEGER NOT NULL DEFAULT 0,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  hidden_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_posts_lembaga_created ON posts(lembaga_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);

CREATE TABLE IF NOT EXISTS post_reactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  lembaga_id TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT 'like',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON post_reactions(post_id);

CREATE TABLE IF NOT EXISTS post_comments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  lembaga_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar_url TEXT,
  content TEXT NOT NULL CHECK(length(content) <= 200),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON post_comments(post_id, created_at ASC);

CREATE TABLE IF NOT EXISTS post_reports (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  post_id TEXT NOT NULL,
  reporter_user_id TEXT NOT NULL,
  lembaga_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(post_id, reporter_user_id)
);

CREATE TABLE IF NOT EXISTS user_storage_usage (
  user_id TEXT PRIMARY KEY,
  lembaga_id TEXT NOT NULL,
  used_bytes INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
