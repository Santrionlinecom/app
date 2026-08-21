-- migrations/0075_hapus_akun_mandiri.sql
-- Penanda akun yang dihapus atas permintaan pemiliknya (hak subjek data,
-- UU 27/2022).
--
-- Akun DIANONIMKAN, bukan dihapus barisnya: ada 45 tabel yang mereferensikan
-- users dan sebagian besar ON DELETE CASCADE, sehingga DELETE akan ikut
-- membuang progres hafalan lembaga, riwayat transaksi yang wajib diaudit,
-- dan setoran milik santri lain.
--
-- dihapus_at NULL = akun aktif. Terisi = identitas sudah dikosongkan dan
-- akun tidak dapat dipakai login lagi.

ALTER TABLE users ADD COLUMN dihapus_at INTEGER;

-- Dipakai di hampir setiap pemeriksaan akun aktif.
CREATE INDEX IF NOT EXISTS idx_users_dihapus ON users (dihapus_at);
