-- migrations/0074_consent_pdp.sql
-- Jejak persetujuan Kebijakan Privasi & Syarat Ketentuan (UU 27/2022).
--
-- Latar: kebijakan privasi sudah ada dan cukup matang, tetapi tidak ada
-- catatan bahwa pengguna menyetujuinya. Tanpa jejak ini, "kami punya
-- kebijakan" tidak sama dengan "pengguna menyetujuinya".
--
-- consent_at  : kapan disetujui (epoch ms). NULL = akun lama, belum tercatat.
-- consent_versi: versi dokumen yang disetujui. Kalau kebijakan berubah
--                material, versinya naik dan persetujuan bisa diminta ulang
--                tanpa menghapus jejak persetujuan lama.

ALTER TABLE users ADD COLUMN consent_at INTEGER;
ALTER TABLE users ADD COLUMN consent_versi TEXT;

-- Mempercepat pencarian akun yang belum menyetujui versi terbaru.
CREATE INDEX IF NOT EXISTS idx_users_consent ON users (consent_at);
