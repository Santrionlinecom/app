-- Migration: Buku author royalty ledger for paid chapter unlocks
CREATE TABLE IF NOT EXISTS buku_author_wallets (
  author_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_earned_coin INTEGER NOT NULL DEFAULT 0,
  pending_coin INTEGER NOT NULL DEFAULT 0,
  paid_coin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buku_author_royalty_ledger (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES buku_books(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES buku_chapters(id) ON DELETE CASCADE,
  unlock_id TEXT NOT NULL UNIQUE REFERENCES buku_unlocks(id) ON DELETE CASCADE,
  reader_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gross_coin INTEGER NOT NULL,
  author_coin INTEGER NOT NULL,
  platform_coin INTEGER NOT NULL,
  author_share_bps INTEGER NOT NULL DEFAULT 7000,
  platform_share_bps INTEGER NOT NULL DEFAULT 3000,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'reversed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_author ON buku_author_royalty_ledger(author_id);
CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_book ON buku_author_royalty_ledger(book_id);
CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_chapter ON buku_author_royalty_ledger(chapter_id);
CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_reader ON buku_author_royalty_ledger(reader_id);
CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_status ON buku_author_royalty_ledger(status);
CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_created ON buku_author_royalty_ledger(created_at);
