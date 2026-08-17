-- Kolom pendaftaran ustadz.
--
-- src/routes/(auth)/register/ustadz/+page.server.ts menulis work_status dan
-- expertise ke tabel users, tetapi kolomnya tidak pernah dibuat di produksi.
-- Akibatnya D1 menolak INSERT dengan "no such column: work_status": akun gagal
-- dibuat, halaman tidak berpindah, dan email sambutan tidak pernah diantrikan.
-- Dari sisi pengguna tombol Daftar tampak tidak merespons sama sekali.
--
-- work_status: 'freelance' | 'owner' | 'employee' (divalidasi Zod di server).
-- expertise: bidang keahlian, opsional.

ALTER TABLE users ADD COLUMN work_status TEXT;
ALTER TABLE users ADD COLUMN expertise TEXT;
