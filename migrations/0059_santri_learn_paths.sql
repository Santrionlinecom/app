-- SantriLearn P0.2: staged learning paths with independent progression.
-- Forward-only and compatible with populated 0039 learn tables.

CREATE TABLE IF NOT EXISTS learn_paths (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  purpose TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);

INSERT OR IGNORE INTO learn_paths (key, title, purpose, sort_order, is_active)
VALUES
  ('aqidah_aswaja', 'Aqidah Aswaja', 'Mengenal identitas Ahlussunnah wal Jamaah secara dasar, tenang, dan beradab.', 10, 1),
  ('adab', 'Adab', 'Membiasakan hormat kepada orang tua, guru, teman, dan lingkungan belajar.', 20, 1),
  ('fikih_praktis', 'Fikih Praktis', 'Memahami kebersihan, wudhu, dan persiapan shalat pada tingkat pengantar.', 30, 1),
  ('sirah', 'Sirah', 'Mengenal perjalanan Nabi Muhammad sebagai teladan akhlak dan amanah.', 40, 1),
  ('skill_masa_depan', 'Skill Masa Depan', 'Melatih tanggung jawab digital, keamanan akun, dan penggunaan teknologi yang bermanfaat.', 50, 1),
  ('arabic_nahwu', 'Bahasa Arab & Nahwu', 'Fondasi bahasa untuk membaca dan memahami teks Arab dasar.', 60, 1);

ALTER TABLE learn_modul ADD COLUMN path_key TEXT NOT NULL DEFAULT 'arabic_nahwu';

UPDATE learn_modul
SET path_key = 'arabic_nahwu'
WHERE path_key IS NULL OR trim(path_key) = '';

CREATE INDEX IF NOT EXISTS idx_learn_modul_path_order ON learn_modul(path_key, urutan);

INSERT OR IGNORE INTO learn_modul (id, lembaga_id, path_key, judul, deskripsi, kategori, urutan, is_aktif)
VALUES
  ('learn-aqidah-aswaja-01', NULL, 'aqidah_aswaja', 'Mengenal Aswaja dengan Tenang', 'Pengantar identitas Aswaja, adab belajar aqidah, dan sikap saling menghormati.', 'kitab', 1, 1),
  ('learn-adab-01', NULL, 'adab', 'Adab Santri Sehari-hari', 'Latihan memilih sikap beradab kepada orang tua, guru, teman, dan lingkungan.', 'kitab', 1, 1),
  ('learn-fikih-praktis-01', NULL, 'fikih_praktis', 'Bersuci dan Siap Shalat', 'Dasar menjaga kebersihan, wudhu, dan persiapan shalat harian.', 'kitab', 1, 1),
  ('learn-sirah-01', NULL, 'sirah', 'Sirah Nabi sebagai Teladan', 'Mengenal tempat, peristiwa besar, dan akhlak Nabi Muhammad secara pengantar.', 'kitab', 1, 1),
  ('learn-skill-masa-depan-01', NULL, 'skill_masa_depan', 'Tanggung Jawab Digital', 'Dasar menjaga akun, memeriksa informasi, dan memakai teknologi untuk kebaikan.', 'percakapan', 1, 1);

INSERT OR IGNORE INTO learn_soal (
  id, modul_id, tipe, pertanyaan, pilihan, pilihan_a, pilihan_b, pilihan_c, pilihan_d,
  jawaban_benar, penjelasan, urutan
)
VALUES
  ('learn-aqidah-aswaja-01-q01', 'learn-aqidah-aswaja-01', 'pilihan_ganda', 'Aswaja adalah singkatan dari?', '["Ahlussunnah wal Jamaah","Nama kota","Jenis kitab","Nama bulan"]', 'Ahlussunnah wal Jamaah', 'Nama kota', 'Jenis kitab', 'Nama bulan', 'a', 'Aswaja merujuk pada Ahlussunnah wal Jamaah, identitas umum umat yang mengikuti tuntunan Nabi dan jamaah ulama.', 1),
  ('learn-aqidah-aswaja-01-q02', 'learn-aqidah-aswaja-01', 'pilihan_ganda', 'Sikap terbaik saat belajar aqidah adalah?', '["Belajar dengan guru dan adab","Mengejek yang belum paham","Memutuskan sendiri tanpa ilmu","Memburu debat"]', 'Belajar dengan guru dan adab', 'Mengejek yang belum paham', 'Memutuskan sendiri tanpa ilmu', 'Memburu debat', 'a', 'Aqidah dipelajari dengan bimbingan guru, bahasa yang tenang, dan adab agar hati tetap jernih.', 2),
  ('learn-aqidah-aswaja-01-q03', 'learn-aqidah-aswaja-01', 'pilihan_ganda', 'Yang termasuk bekal dasar seorang santri Aswaja adalah?', '["Iman, ibadah, akhlak, dan cinta ilmu","Merasa paling benar sendiri","Menjauhi nasihat guru","Menyebar celaan"]', 'Iman, ibadah, akhlak, dan cinta ilmu', 'Merasa paling benar sendiri', 'Menjauhi nasihat guru', 'Menyebar celaan', 'a', 'Pengantar Aswaja di sini menekankan iman, ibadah, akhlak, dan cinta ilmu tanpa membuka perdebatan rinci.', 3),
  ('learn-adab-01-q01', 'learn-adab-01', 'pilihan_ganda', 'Saat guru menjelaskan, adab yang tepat adalah?', '["Mendengarkan dan tidak memotong","Berbicara keras sendiri","Menertawakan teman","Meninggalkan majelis tanpa sebab"]', 'Mendengarkan dan tidak memotong', 'Berbicara keras sendiri', 'Menertawakan teman', 'Meninggalkan majelis tanpa sebab', 'a', 'Mendengarkan guru membantu ilmu masuk dan menunjukkan hormat kepada orang yang mengajar.', 1),
  ('learn-adab-01-q02', 'learn-adab-01', 'pilihan_ganda', 'Jika berbeda pendapat dengan teman, pilih sikap yang paling beradab.', '["Bicara baik dan mencari penjelasan","Mengejek di depan orang lain","Menyebar aibnya","Memaksa semua setuju"]', 'Bicara baik dan mencari penjelasan', 'Mengejek di depan orang lain', 'Menyebar aibnya', 'Memaksa semua setuju', 'a', 'Perbedaan dibahas dengan bahasa baik, tabayyun, dan bimbingan guru bila perlu.', 2),
  ('learn-adab-01-q03', 'learn-adab-01', 'pilihan_ganda', 'Contoh adab kepada orang tua adalah?', '["Menjawab lembut dan membantu sesuai mampu","Membentak saat diminta tolong","Mengabaikan nasihat baik","Berbohong agar bebas tugas"]', 'Menjawab lembut dan membantu sesuai mampu', 'Membentak saat diminta tolong', 'Mengabaikan nasihat baik', 'Berbohong agar bebas tugas', 'a', 'Adab kepada orang tua dimulai dari tutur kata lembut, jujur, dan membantu sesuai kemampuan.', 3),
  ('learn-fikih-praktis-01-q01', 'learn-fikih-praktis-01', 'pilihan_ganda', 'Sebelum shalat, hal dasar yang perlu dijaga adalah?', '["Bersuci dan memastikan waktu shalat","Memilih tempat paling ramai","Membawa banyak barang","Membaca pesan dulu"]', 'Bersuci dan memastikan waktu shalat', 'Memilih tempat paling ramai', 'Membawa banyak barang', 'Membaca pesan dulu', 'a', 'Pada tingkat dasar, santri diingatkan untuk bersuci dan memperhatikan waktu sebelum shalat.', 1),
  ('learn-fikih-praktis-01-q02', 'learn-fikih-praktis-01', 'pilihan_ganda', 'Wudhu dilakukan untuk?', '["Bersuci sebelum ibadah tertentu","Mengganti semua mandi","Agar pakaian baru","Supaya tidak perlu shalat"]', 'Bersuci sebelum ibadah tertentu', 'Mengganti semua mandi', 'Agar pakaian baru', 'Supaya tidak perlu shalat', 'a', 'Wudhu adalah cara bersuci yang diajarkan sebelum ibadah tertentu seperti shalat.', 2),
  ('learn-fikih-praktis-01-q03', 'learn-fikih-praktis-01', 'pilihan_ganda', 'Jika belum paham tata cara ibadah, sikap terbaik adalah?', '["Bertanya kepada guru atau orang tua","Menebak-nebak sendiri","Mengejek teman","Berhenti belajar"]', 'Bertanya kepada guru atau orang tua', 'Menebak-nebak sendiri', 'Mengejek teman', 'Berhenti belajar', 'a', 'Masalah ibadah dipelajari bertahap dengan bertanya kepada guru atau orang tua yang membimbing.', 3),
  ('learn-sirah-01-q01', 'learn-sirah-01', 'pilihan_ganda', 'Nabi Muhammad lahir di kota?', '["Makkah","Madinah","Damaskus","Baghdad"]', 'Makkah', 'Madinah', 'Damaskus', 'Baghdad', 'a', 'Secara umum sirah mengenalkan bahwa Nabi Muhammad lahir di Makkah.', 1),
  ('learn-sirah-01-q02', 'learn-sirah-01', 'pilihan_ganda', 'Sifat Nabi yang patut diteladani santri adalah?', '["Jujur dan amanah","Suka berdusta","Kasar kepada keluarga","Meremehkan ilmu"]', 'Jujur dan amanah', 'Suka berdusta', 'Kasar kepada keluarga', 'Meremehkan ilmu', 'a', 'Nabi dikenal dengan kejujuran dan amanah, dua sifat ini menjadi latihan akhlak harian.', 2),
  ('learn-sirah-01-q03', 'learn-sirah-01', 'pilihan_ganda', 'Hijrah Nabi yang masyhur adalah dari Makkah menuju?', '["Madinah","Yaman","Mesir","Syam"]', 'Madinah', 'Yaman', 'Mesir', 'Syam', 'a', 'Peristiwa hijrah yang masyhur adalah perjalanan Nabi dan kaum muslimin dari Makkah ke Madinah.', 3),
  ('learn-skill-masa-depan-01-q01', 'learn-skill-masa-depan-01', 'pilihan_ganda', 'Saat mendapat kabar mengejutkan di grup, langkah bertanggung jawab adalah?', '["Cek sumber sebelum membagikan","Langsung sebarkan","Tambahkan judul menakutkan","Hapus nama pengirim"]', 'Cek sumber sebelum membagikan', 'Langsung sebarkan', 'Tambahkan judul menakutkan', 'Hapus nama pengirim', 'a', 'Tanggung jawab digital dimulai dari tabayyun: memeriksa sumber sebelum ikut menyebarkan kabar.', 1),
  ('learn-skill-masa-depan-01-q02', 'learn-skill-masa-depan-01', 'pilihan_ganda', 'Password akun pribadi sebaiknya?', '["Kuat dan tidak dibagikan","Sama dengan nama panggilan","Dikirim ke semua teman","Ditulis di komentar umum"]', 'Kuat dan tidak dibagikan', 'Sama dengan nama panggilan', 'Dikirim ke semua teman', 'Ditulis di komentar umum', 'a', 'Menjaga password adalah bagian dari amanah terhadap data pribadi dan keamanan akun.', 2),
  ('learn-skill-masa-depan-01-q03', 'learn-skill-masa-depan-01', 'pilihan_ganda', 'Penggunaan gawai yang baik membantu santri untuk?', '["Belajar, berkarya, dan menjaga kewajiban","Lupa waktu shalat","Menghina orang lain","Mengabaikan keluarga"]', 'Belajar, berkarya, dan menjaga kewajiban', 'Lupa waktu shalat', 'Menghina orang lain', 'Mengabaikan keluarga', 'a', 'Teknologi dipakai sebagai alat manfaat: belajar, berkarya, dan tetap menjaga kewajiban serta adab.', 3);
