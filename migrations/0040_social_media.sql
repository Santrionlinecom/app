CREATE TABLE IF NOT EXISTS social_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  lembaga_id TEXT NULL,
  content TEXT NOT NULL,
  image_url TEXT NULL,
  visibility TEXT NOT NULL DEFAULT 'lembaga',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NULL,
  deleted_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS social_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS social_likes (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_social_posts_created_at
  ON social_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_posts_user_id
  ON social_posts(user_id);

CREATE INDEX IF NOT EXISTS idx_social_posts_lembaga_id
  ON social_posts(lembaga_id);

CREATE INDEX IF NOT EXISTS idx_social_comments_post_id
  ON social_comments(post_id);

CREATE INDEX IF NOT EXISTS idx_social_likes_post_id
  ON social_likes(post_id);

CREATE INDEX IF NOT EXISTS idx_social_likes_user_id
  ON social_likes(user_id);
