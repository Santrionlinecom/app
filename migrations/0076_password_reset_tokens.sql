-- migrations/0076_password_reset_tokens.sql
-- Token reset password lewat tautan email.
--
-- KUNCI PRIMER ADALAH HASH-nya, bukan tokennya. Token asli hanya ada di
-- email penerima dan tidak pernah masuk ke database — sehingga kalau isi
-- tabel ini bocor, yang didapat penyerang hanyalah hash yang tidak bisa
-- dipakai masuk.
--
-- dipakai_at : NULL = belum dipakai. Terisi = hangus, tidak boleh dipakai lagi.
-- ip         : untuk menelusuri penyalahgunaan; bukan untuk profiling.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  dipakai_at INTEGER,
  dibuat_at INTEGER NOT NULL,
  ip TEXT
);

-- Membatalkan token lama saat pengguna meminta tautan baru.
CREATE INDEX IF NOT EXISTS idx_reset_user ON password_reset_tokens (user_id);

-- Membersihkan token yang sudah kedaluwarsa.
CREATE INDEX IF NOT EXISTS idx_reset_expires ON password_reset_tokens (expires_at);
