-- Migration: SantriOnline digital book/novel foundation with coin ledger
CREATE TABLE IF NOT EXISTS buku_books (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_url TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'archived')),
  free_chapter_limit INTEGER NOT NULL DEFAULT 7,
  price_per_chapter INTEGER NOT NULL DEFAULT 300,
  admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buku_chapters (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES buku_books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id, chapter_number)
);

CREATE TABLE IF NOT EXISTS buku_unlocks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES buku_books(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES buku_chapters(id) ON DELETE CASCADE,
  coin_spent INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, chapter_id)
);

CREATE TABLE IF NOT EXISTS coin_wallets (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('topup', 'unlock_chapter', 'adjustment', 'refund')),
  amount INTEGER NOT NULL,
  balance_after INTEGER,
  description TEXT,
  reference_type TEXT,
  reference_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coin_topup_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_rupiah INTEGER NOT NULL,
  coin_amount INTEGER NOT NULL,
  proof_url TEXT,
  user_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_buku_books_author ON buku_books(author_id);
CREATE INDEX IF NOT EXISTS idx_buku_books_slug ON buku_books(slug);
CREATE INDEX IF NOT EXISTS idx_buku_books_status ON buku_books(status);
CREATE INDEX IF NOT EXISTS idx_buku_chapters_book ON buku_chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_buku_chapters_book_number ON buku_chapters(book_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_buku_chapters_status ON buku_chapters(status);
CREATE INDEX IF NOT EXISTS idx_buku_unlocks_user ON buku_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_buku_unlocks_chapter ON buku_unlocks(chapter_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(type);
CREATE INDEX IF NOT EXISTS idx_coin_topup_requests_user ON coin_topup_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_topup_requests_status ON coin_topup_requests(status);
