CREATE TABLE IF NOT EXISTS ai_generations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  post_id TEXT,
  user_id TEXT NOT NULL,
  topik TEXT NOT NULL,
  model_used TEXT DEFAULT 'meta-llama/llama-4-scout-17b-16e-instruct',
  tokens_used INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  audio_id_url TEXT,
  audio_ar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_user_created ON ai_generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_post ON ai_generations(post_id);
