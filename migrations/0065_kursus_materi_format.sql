-- Materi kursus kini bisa disunting superadmin lewat editor TipTap yang
-- menghasilkan HTML, sedangkan materi seed awal ditulis dalam markdown.
--
-- Kolom `format` menandai mana yang mana, sehingga materi lama tidak perlu
-- diubah dan tetap tampil benar. Nilai NULL berarti materi lama: formatnya
-- ditebak dari isinya di lapisan aplikasi.

ALTER TABLE kursus_materi ADD COLUMN format TEXT;

-- Materi yang sudah ada seluruhnya markdown. Ditandai eksplisit agar tidak
-- perlu ditebak berulang kali setiap halaman dibuka.
UPDATE kursus_materi SET format = 'markdown' WHERE format IS NULL;

-- Jejak siapa menyunting terakhir, untuk penelusuran bila ada isi yang
-- berubah tanpa diketahui.
ALTER TABLE kursus_materi ADD COLUMN updated_by TEXT;
