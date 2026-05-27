-- SantriLearn curriculum seed: Nahwu dasar 9 level + soal pilihan ganda.
-- Migration ini memperluas schema 0038 agar mendukung kategori percakapan
-- dan kolom pilihan_a..penjelasan yang dipakai UI/API baru.

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS learn_modul_0039;
CREATE TABLE learn_modul_0039 (
  id TEXT PRIMARY KEY,
  lembaga_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  kategori TEXT NOT NULL CHECK(kategori IN ('hijaiyah','mufrodat','nahwu','shorof','kitab','percakapan')),
  urutan INTEGER DEFAULT 0,
  is_aktif INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);

INSERT OR IGNORE INTO learn_modul_0039 (
  id, lembaga_id, judul, deskripsi, kategori, urutan, is_aktif, created_at
)
SELECT id, lembaga_id, judul, deskripsi, kategori, urutan, is_aktif, created_at
FROM learn_modul;

DROP TABLE learn_modul;
ALTER TABLE learn_modul_0039 RENAME TO learn_modul;

DROP TABLE IF EXISTS learn_soal_0039;
CREATE TABLE learn_soal_0039 (
  id TEXT PRIMARY KEY,
  modul_id TEXT NOT NULL REFERENCES learn_modul(id) ON DELETE CASCADE,
  tipe TEXT NOT NULL CHECK(tipe IN ('pilihan_ganda','cocokkan','isi_titik','susun_kata','dengar_pilih')),
  pertanyaan TEXT NOT NULL,
  pilihan TEXT,
  pilihan_a TEXT,
  pilihan_b TEXT,
  pilihan_c TEXT,
  pilihan_d TEXT,
  jawaban_benar TEXT NOT NULL,
  penjelasan TEXT,
  audio_url TEXT,
  urutan INTEGER DEFAULT 0
);

INSERT OR IGNORE INTO learn_soal_0039 (
  id, modul_id, tipe, pertanyaan, pilihan, jawaban_benar, audio_url, urutan
)
SELECT id, modul_id, tipe, pertanyaan, pilihan, jawaban_benar, audio_url, urutan
FROM learn_soal;

DROP TABLE learn_soal;
ALTER TABLE learn_soal_0039 RENAME TO learn_soal;

CREATE INDEX IF NOT EXISTS idx_learn_soal_modul ON learn_soal(modul_id);

PRAGMA foreign_keys = ON;

-- Sembunyikan seed awal 0038 agar urutan belajar kanonik dimulai dari Level 1.
UPDATE learn_modul
SET is_aktif = 0
WHERE id IN (
  'global-hijaiyah-01',
  'global-mufrodat-01',
  'global-nahwu-01',
  'global-shorof-01'
);

INSERT OR IGNORE INTO learn_modul (id, lembaga_id, judul, deskripsi, kategori, urutan, is_aktif)
VALUES
  ('learn-nahwu-level-01', NULL, 'Ajza''ul Jumlah - 3 Jenis Kata Arab', 'Level 1: mengenal Isim, Fi''il, dan Harf sebagai bagian dasar kalimat Arab.', 'nahwu', 1, 1),
  ('learn-nahwu-level-02', NULL, 'Isim - Definisi dan Ciri-ciri', 'Level 2: memahami definisi isim dan cirinya: tanwin, alif lam, serta huruf jar.', 'nahwu', 2, 1),
  ('learn-nahwu-level-03', NULL, 'Isim Nakiroh & Ma''rifah', 'Level 3: membedakan isim umum dan khusus dalam Bahasa Arab.', 'nahwu', 3, 1),
  ('learn-nahwu-level-04', NULL, 'Isim Mudzakkar & Muannats', 'Level 4: membedakan isim laki-laki, perempuan, haqiqi, dan majazi.', 'nahwu', 4, 1),
  ('learn-nahwu-level-05', NULL, 'Al-Jumlah Al-Mufidah - Kalimat Sempurna', 'Level 5: memahami syarat kalimat yang memberi makna utuh.', 'nahwu', 5, 1),
  ('learn-nahwu-level-06', NULL, 'Jumlah Ismiyyah - Mubtada'' & Khabar', 'Level 6: mengenal kalimat yang diawali isim dengan struktur mubtada'' dan khabar.', 'nahwu', 6, 1),
  ('learn-nahwu-level-07', NULL, 'Fi''il - Madhi, Mudhari'', Amr', 'Level 7: memahami tiga jenis kata kerja berdasarkan waktu dan fungsi.', 'nahwu', 7, 1),
  ('learn-nahwu-level-08', NULL, 'Maf''ul Biih - Objek Kalimat', 'Level 8: menemukan objek yang dikenai perbuatan dan tanda manshub.', 'nahwu', 8, 1),
  ('learn-nahwu-level-09', NULL, 'At-Ta''aruf - Perkenalan Bahasa Arab', 'Level 9: praktik dialog perkenalan dasar dalam Bahasa Arab.', 'percakapan', 9, 1);

INSERT OR IGNORE INTO learn_soal (
  id, modul_id, tipe, pertanyaan, pilihan, pilihan_a, pilihan_b, pilihan_c, pilihan_d,
  jawaban_benar, penjelasan, urutan
)
VALUES
  ('learn-l01-q01', 'learn-nahwu-level-01', 'pilihan_ganda', 'كِتَابٌ termasuk jenis kata apa?', '["Isim","Fi''il","Harf","Jumlah"]', 'Isim', 'Fi''il', 'Harf', 'Jumlah', 'a', 'كِتَابٌ berarti buku, yaitu kata benda, maka termasuk isim.', 1),
  ('learn-l01-q02', 'learn-nahwu-level-01', 'pilihan_ganda', 'كَتَبَ (telah menulis) termasuk?', '["Isim","Fi''il","Harf","Dhamir"]', 'Isim', 'Fi''il', 'Harf', 'Dhamir', 'b', 'كَتَبَ menunjukkan perbuatan pada masa lampau, maka termasuk fi''il.', 2),
  ('learn-l01-q03', 'learn-nahwu-level-01', 'pilihan_ganda', 'فِي (di dalam) termasuk?', '["Isim","Fi''il","Harf","Khabar"]', 'Isim', 'Fi''il', 'Harf', 'Khabar', 'c', 'فِي adalah kata tugas/huruf jar, maka termasuk harf.', 3),
  ('learn-l01-q04', 'learn-nahwu-level-01', 'pilihan_ganda', 'مُسْلِمٌ termasuk?', '["Isim","Fi''il","Harf","Jumlah"]', 'Isim', 'Fi''il', 'Harf', 'Jumlah', 'a', 'مُسْلِمٌ adalah kata benda/orang dan bertanwin, maka termasuk isim.', 4),
  ('learn-l01-q05', 'learn-nahwu-level-01', 'pilihan_ganda', 'يَذْهَبُ (sedang pergi) termasuk?', '["Isim","Fi''il","Harf","Maf''ul"]', 'Isim', 'Fi''il', 'Harf', 'Maf''ul', 'b', 'يَذْهَبُ menunjukkan perbuatan sedang/akan terjadi, maka termasuk fi''il.', 5),

  ('learn-l02-q01', 'learn-nahwu-level-02', 'pilihan_ganda', 'Ciri paling menonjol isim adalah?', '["Bertanwin","Selalu perintah","Diawali huruf mudhari''","Tidak bisa diberi ال"]', 'Bertanwin', 'Selalu perintah', 'Diawali huruf mudhari''', 'Tidak bisa diberi ال', 'a', 'Tanwin adalah salah satu tanda yang paling mudah dikenali pada isim.', 1),
  ('learn-l02-q02', 'learn-nahwu-level-02', 'pilihan_ganda', 'مُسْلِمٌ setelah masuk ال menjadi?', '["مُسْلِمٌ","الْمُسْلِمُ","فِي مُسْلِمٍ","يُسْلِمُ"]', 'مُسْلِمٌ', 'الْمُسْلِمُ', 'فِي مُسْلِمٍ', 'يُسْلِمُ', 'b', 'Ketika mendapat ال, tanwin hilang dan menjadi الْمُسْلِمُ.', 2),
  ('learn-l02-q03', 'learn-nahwu-level-02', 'pilihan_ganda', 'فِي الْبَيْتِ - kata الْبَيْتِ adalah isim karena?', '["Diawali fi''il","Didahului huruf jar","Menunjukkan perintah","Tidak bermakna"]', 'Diawali fi''il', 'Didahului huruf jar', 'Menunjukkan perintah', 'Tidak bermakna', 'b', 'Kata setelah huruf jar seperti فِي adalah isim yang menjadi majrur.', 3),
  ('learn-l02-q04', 'learn-nahwu-level-02', 'pilihan_ganda', 'Perubahan waktu mempengaruhi bentuk isim?', '["Ya","Tidak","Selalu berubah menjadi amr","Hanya saat didahului فِي"]', 'Ya', 'Tidak', 'Selalu berubah menjadi amr', 'Hanya saat didahului فِي', 'b', 'Isim tidak terikat perubahan waktu seperti fi''il.', 4),
  ('learn-l02-q05', 'learn-nahwu-level-02', 'pilihan_ganda', 'اَلطَّالِبُ artinya?', '["Seorang siswa","Siswa itu (ma''rifah)","Telah belajar","Di dalam siswa"]', 'Seorang siswa', 'Siswa itu (ma''rifah)', 'Telah belajar', 'Di dalam siswa', 'b', 'ال membuat isim menjadi ma''rifah: siswa tertentu/siswa itu.', 5),

  ('learn-l03-q01', 'learn-nahwu-level-03', 'pilihan_ganda', 'مُسْلِمٌ termasuk nakiroh atau ma''rifah?', '["Nakiroh","Ma''rifah","Fi''il","Harf"]', 'Nakiroh', 'Ma''rifah', 'Fi''il', 'Harf', 'a', 'مُسْلِمٌ bertanwin dan bermakna umum, maka nakiroh.', 1),
  ('learn-l03-q02', 'learn-nahwu-level-03', 'pilihan_ganda', 'الْكِتَابُ termasuk?', '["Nakiroh","Ma''rifah","Fi''il madhi","Harf jar"]', 'Nakiroh', 'Ma''rifah', 'Fi''il madhi', 'Harf jar', 'b', 'ال pada الْكِتَابُ menjadikannya isim ma''rifah.', 2),
  ('learn-l03-q03', 'learn-nahwu-level-03', 'pilihan_ganda', 'أَنَا (saya) termasuk?', '["Nakiroh","Ma''rifah (isim dhomir)","Harf","Fi''il amr"]', 'Nakiroh', 'Ma''rifah (isim dhomir)', 'Harf', 'Fi''il amr', 'b', 'Dhamir seperti أَنَا termasuk isim ma''rifah.', 3),
  ('learn-l03-q04', 'learn-nahwu-level-03', 'pilihan_ganda', 'Tanwin menandakan isim?', '["Nakiroh","Ma''rifah","Fi''il","Harf"]', 'Nakiroh', 'Ma''rifah', 'Fi''il', 'Harf', 'a', 'Tanwin umumnya menunjukkan isim nakiroh atau belum tertentu.', 4),
  ('learn-l03-q05', 'learn-nahwu-level-03', 'pilihan_ganda', 'زَيْدٌ termasuk nakiroh atau ma''rifah?', '["Nakiroh","Ma''rifah (isim ''alam)","Fi''il","Harf"]', 'Nakiroh', 'Ma''rifah (isim ''alam)', 'Fi''il', 'Harf', 'b', 'Nama orang seperti زَيْدٌ adalah isim ''alam dan termasuk ma''rifah.', 5),

  ('learn-l04-q01', 'learn-nahwu-level-04', 'pilihan_ganda', 'مُسْلِمَةٌ adalah isim?', '["Mudzakkar haqiqi","Muannats haqiqi","Muannats majazi","Harf"]', 'Mudzakkar haqiqi', 'Muannats haqiqi', 'Muannats majazi', 'Harf', 'b', 'مُسْلِمَةٌ menunjuk perempuan sungguhan, maka muannats haqiqi.', 1),
  ('learn-l04-q02', 'learn-nahwu-level-04', 'pilihan_ganda', 'شَمْسٌ (matahari) termasuk?', '["Mudzakkar haqiqi","Muannats haqiqi","Muannats majazi","Fi''il"]', 'Mudzakkar haqiqi', 'Muannats haqiqi', 'Muannats majazi', 'Fi''il', 'c', 'شَمْسٌ diperlakukan sebagai muannats, tetapi bukan perempuan sungguhan, maka majazi.', 2),
  ('learn-l04-q03', 'learn-nahwu-level-04', 'pilihan_ganda', 'Tanda muannats yang paling umum?', '["Tanwin","Ta'' marbuthah (ة)","Huruf mudhari''","Fathah saja"]', 'Tanwin', 'Ta'' marbuthah (ة)', 'Huruf mudhari''', 'Fathah saja', 'b', 'Ta'' marbuthah (ة) sering menjadi tanda isim muannats.', 3),
  ('learn-l04-q04', 'learn-nahwu-level-04', 'pilihan_ganda', 'مَسْجِدٌ (masjid) termasuk?', '["Mudzakkar majazi","Muannats haqiqi","Muannats majazi","Fi''il amr"]', 'Mudzakkar majazi', 'Muannats haqiqi', 'Muannats majazi', 'Fi''il amr', 'a', 'مَسْجِدٌ bukan laki-laki sungguhan, tetapi diperlakukan mudzakkar, maka majazi.', 4),
  ('learn-l04-q05', 'learn-nahwu-level-04', 'pilihan_ganda', 'يَدٌ (tangan) termasuk muannats karena?', '["Nama laki-laki","Anggota tubuh berpasangan","Selalu bertanwin","Diawali ي"]', 'Nama laki-laki', 'Anggota tubuh berpasangan', 'Selalu bertanwin', 'Diawali ي', 'b', 'Sebagian anggota tubuh berpasangan seperti يَدٌ diperlakukan muannats.', 5),

  ('learn-l05-q01', 'learn-nahwu-level-05', 'pilihan_ganda', 'اَلْبُسْتَانُ saja apakah kalimat sempurna?', '["Sudah sempurna","Belum sempurna","Selalu fi''il","Termasuk harf"]', 'Sudah sempurna', 'Belum sempurna', 'Selalu fi''il', 'Termasuk harf', 'b', 'اَلْبُسْتَانُ hanya menyebut subjek, belum memberi makna utuh.', 1),
  ('learn-l05-q02', 'learn-nahwu-level-05', 'pilihan_ganda', 'اَلْبُسْتَانُ جَمِيلٌ artinya?', '["Kebun itu indah","Kebun itu pergi","Tulislah di kebun","Di dalam kebun"]', 'Kebun itu indah', 'Kebun itu pergi', 'Tulislah di kebun', 'Di dalam kebun', 'a', 'Kalimat itu terdiri dari mubtada'' dan khabar: kebun itu indah.', 2),
  ('learn-l05-q03', 'learn-nahwu-level-05', 'pilihan_ganda', 'قُمْ! (berdirilah) apakah kalimat sempurna?', '["Tidak","Ya, subjek tersembunyi أَنْتَ","Hanya isim","Hanya harf"]', 'Tidak', 'Ya, subjek tersembunyi أَنْتَ', 'Hanya isim', 'Hanya harf', 'b', 'Fi''il amr dapat menjadi jumlah mufidah karena subjeknya dipahami: أَنْتَ.', 3),
  ('learn-l05-q04', 'learn-nahwu-level-05', 'pilihan_ganda', 'Syarat jumlah mufidah?', '["Memberi makna yang utuh dan lengkap","Harus selalu dua kata","Harus diawali فِي","Harus tanpa isim"]', 'Memberi makna yang utuh dan lengkap', 'Harus selalu dua kata', 'Harus diawali فِي', 'Harus tanpa isim', 'a', 'Jumlah mufidah adalah susunan yang sudah memberi faidah/makna lengkap.', 4),
  ('learn-l05-q05', 'learn-nahwu-level-05', 'pilihan_ganda', 'Jumlah mufidah disebut juga?', '["Kalam","Tanwin","Harf jar","Maf''ul"]', 'Kalam', 'Tanwin', 'Harf jar', 'Maf''ul', 'a', 'Dalam nahwu, susunan bermakna sempurna juga disebut kalam.', 5),

  ('learn-l06-q01', 'learn-nahwu-level-06', 'pilihan_ganda', 'اَلتُّفَّاحَةُ حُلْوَةٌ - mubtada''nya?', '["اَلتُّفَّاحَةُ","حُلْوَةٌ","فِي","كَتَبَ"]', 'اَلتُّفَّاحَةُ', 'حُلْوَةٌ', 'فِي', 'كَتَبَ', 'a', 'Mubtada'' adalah isim yang dibicarakan di awal jumlah ismiyyah.', 1),
  ('learn-l06-q02', 'learn-nahwu-level-06', 'pilihan_ganda', 'اَلدَّارُ وَاسِعَةٌ - khabarnya?', '["اَلدَّارُ","وَاسِعَةٌ","ال","يَكْتُبُ"]', 'اَلدَّارُ', 'وَاسِعَةٌ', 'ال', 'يَكْتُبُ', 'b', 'Khabar memberi informasi tentang mubtada'': rumah itu luas.', 2),
  ('learn-l06-q03', 'learn-nahwu-level-06', 'pilihan_ganda', 'Mubtada'' selalu dalam keadaan?', '["Majrur","Manshub","Marfu'' (dhammah)","Sukun"]', 'Majrur', 'Manshub', 'Marfu'' (dhammah)', 'Sukun', 'c', 'Mubtada'' adalah isim marfu'', biasanya ditandai dhammah.', 3),
  ('learn-l06-q04', 'learn-nahwu-level-06', 'pilihan_ganda', 'Jumlah ismiyyah diawali dengan?', '["Isim","Fi''il","Harf","Maf''ul"]', 'Isim', 'Fi''il', 'Harf', 'Maf''ul', 'a', 'Jumlah ismiyyah adalah kalimat yang diawali isim.', 4),
  ('learn-l06-q05', 'learn-nahwu-level-06', 'pilihan_ganda', 'اَلدَّارُ وَاسِعَةٌ artinya?', '["Rumah itu luas","Siswa menarik tali","Berdirilah","Saya menulis"]', 'Rumah itu luas', 'Siswa menarik tali', 'Berdirilah', 'Saya menulis', 'a', 'اَلدَّارُ berarti rumah itu, وَاسِعَةٌ berarti luas.', 5),

  ('learn-l07-q01', 'learn-nahwu-level-07', 'pilihan_ganda', 'كَتَبَ (telah menulis) adalah fi''il?', '["Madhi","Mudhari''","Amr","Harf"]', 'Madhi', 'Mudhari''', 'Amr', 'Harf', 'a', 'كَتَبَ menunjukkan perbuatan yang sudah terjadi, maka fi''il madhi.', 1),
  ('learn-l07-q02', 'learn-nahwu-level-07', 'pilihan_ganda', 'يَكْتُبُ (sedang/akan menulis) adalah fi''il?', '["Madhi","Mudhari''","Amr","Isim"]', 'Madhi', 'Mudhari''', 'Amr', 'Isim', 'b', 'يَكْتُبُ diawali ي dan bermakna sedang/akan, maka fi''il mudhari''.', 2),
  ('learn-l07-q03', 'learn-nahwu-level-07', 'pilihan_ganda', 'اُكْتُبْ (tulislah!) adalah fi''il?', '["Madhi","Mudhari''","Amr","Harf jar"]', 'Madhi', 'Mudhari''', 'Amr', 'Harf jar', 'c', 'اُكْتُبْ berisi perintah, maka fi''il amr.', 3),
  ('learn-l07-q04', 'learn-nahwu-level-07', 'pilihan_ganda', 'Ciri fi''il mudhari''?', '["Diawali huruf ANAYTA (أ،ن،ي،ت)","Selalu bertanwin","Selalu memakai ال","Selalu didahului فِي"]', 'Diawali huruf ANAYTA (أ،ن،ي،ت)', 'Selalu bertanwin', 'Selalu memakai ال', 'Selalu didahului فِي', 'a', 'Fi''il mudhari'' biasanya diawali salah satu huruf أ، ن، ي، ت.', 4),
  ('learn-l07-q05', 'learn-nahwu-level-07', 'pilihan_ganda', 'Fi''il amr menunjukkan?', '["Perintah","Kepemilikan","Tempat","Nama orang"]', 'Perintah', 'Kepemilikan', 'Tempat', 'Nama orang', 'a', 'Fi''il amr digunakan untuk menyuruh atau memerintah.', 5),

  ('learn-l08-q01', 'learn-nahwu-level-08', 'pilihan_ganda', 'شَدَّ التِّلْمِيذُ الْحَبْلَ - maf''ul bihnya?', '["شَدَّ","التِّلْمِيذُ","الْحَبْلَ","فِي"]', 'شَدَّ', 'التِّلْمِيذُ', 'الْحَبْلَ', 'فِي', 'c', 'Yang dikenai perbuatan menarik adalah الْحَبْلَ, maka itulah maf''ul bih.', 1),
  ('learn-l08-q02', 'learn-nahwu-level-08', 'pilihan_ganda', 'Maf''ul bih selalu dalam keadaan?', '["Marfu'' (dhammah)","Manshub (fathah)","Majrur (kasrah)","Jazm"]', 'Marfu'' (dhammah)', 'Manshub (fathah)', 'Majrur (kasrah)', 'Jazm', 'b', 'Maf''ul bih adalah isim manshub, sering ditandai fathah.', 2),
  ('learn-l08-q03', 'learn-nahwu-level-08', 'pilihan_ganda', 'Cara menemukan maf''ul bih?', '["Jawab pertanyaan apa/siapa yang dikenai perbuatan","Cari kata pertama saja","Cari semua huruf jar","Cari kata bertanwin saja"]', 'Jawab pertanyaan apa/siapa yang dikenai perbuatan', 'Cari kata pertama saja', 'Cari semua huruf jar', 'Cari kata bertanwin saja', 'a', 'Maf''ul bih menjawab apa atau siapa yang terkena perbuatan fi''il.', 3),
  ('learn-l08-q04', 'learn-nahwu-level-08', 'pilihan_ganda', 'Maf''ul bih termasuk jenis kata?', '["Isim","Fi''il","Harf","Jumlah"]', 'Isim', 'Fi''il', 'Harf', 'Jumlah', 'a', 'Maf''ul bih adalah objek, dan objek dalam nahwu berupa isim.', 4),
  ('learn-l08-q05', 'learn-nahwu-level-08', 'pilihan_ganda', 'Siapa pelaku (fa''il) di kalimat شَدَّ التِّلْمِيذُ الْحَبْلَ?', '["شَدَّ","التِّلْمِيذُ","الْحَبْلَ","ال"]', 'شَدَّ', 'التِّلْمِيذُ', 'الْحَبْلَ', 'ال', 'b', 'Pelaku yang menarik adalah التِّلْمِيذُ, maka ia fa''il.', 5),

  ('learn-l09-q01', 'learn-nahwu-level-09', 'pilihan_ganda', 'مَا اسْمُكَ؟ artinya?', '["Siapa namamu?","Di mana rumahmu?","Apa kabarmu?","Sampai jumpa"]', 'Siapa namamu?', 'Di mana rumahmu?', 'Apa kabarmu?', 'Sampai jumpa', 'a', 'مَا اسْمُكَ؟ adalah pertanyaan untuk menanyakan nama.', 1),
  ('learn-l09-q02', 'learn-nahwu-level-09', 'pilihan_ganda', 'كَيْفَ حَالُكَ؟ artinya?', '["Siapa namamu?","Bagaimana kabarmu?","Saya senang","Terima kasih"]', 'Siapa namamu?', 'Bagaimana kabarmu?', 'Saya senang', 'Terima kasih', 'b', 'كَيْفَ حَالُكَ؟ dipakai untuk menanyakan kabar.', 2),
  ('learn-l09-q03', 'learn-nahwu-level-09', 'pilihan_ganda', 'بِخَيْرٍ وَالْحَمْدُ لِلَّهِ artinya?', '["Baik, Alhamdulillah","Selamat malam","Sampai jumpa","Siapa gurumu?"]', 'Baik, Alhamdulillah', 'Selamat malam', 'Sampai jumpa', 'Siapa gurumu?', 'a', 'Ungkapan ini adalah jawaban kabar: baik, segala puji bagi Allah.', 3),
  ('learn-l09-q04', 'learn-nahwu-level-09', 'pilihan_ganda', 'أَنَا مَسْرُورَةٌ بِلِقَائِكِ artinya?', '["Saya senang berjumpa denganmu","Saya pergi ke masjid","Namaku Ahmad","Rumah itu luas"]', 'Saya senang berjumpa denganmu', 'Saya pergi ke masjid', 'Namaku Ahmad', 'Rumah itu luas', 'a', 'أَنَا مَسْرُورَةٌ بِلِقَائِكِ berarti saya senang bertemu denganmu.', 4),
  ('learn-l09-q05', 'learn-nahwu-level-09', 'pilihan_ganda', 'إِلَى اللِّقَاءِ artinya?', '["Sampai jumpa","Apa kabar?","Saya siswa","Di dalam rumah"]', 'Sampai jumpa', 'Apa kabar?', 'Saya siswa', 'Di dalam rumah', 'a', 'إِلَى اللِّقَاءِ adalah ungkapan perpisahan: sampai jumpa.', 5);
