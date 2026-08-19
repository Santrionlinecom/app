-- Menyelaraskan jalur Ruang Belajar dengan 9 kitab yang sudah diindeks RAG.
--
-- Sebelumnya ada 6 jalur (0059), tetapi tidak satu pun tertaut ke kitab yang
-- benar-benar tersedia di aplikasi. Akibatnya santri tidak punya rujukan bacaan
-- ketika menyelesaikan sebuah modul.
--
-- Sembilan kitab tersebut:
--   1. ilmu-tajwid-lengkap                              -> quran_tahsin
--   2. terjemah-aqidatul-awam                           -> aqidah_aswaja
--   3. safinatun-najah-makna-perkata                    -> fikih_praktis
--   4. terjemah-syarah-arbain-nawawiyah-ibnu-daqiqil-ied -> hadits
--   5. terjemah-bidayatul-hidayah                       -> adab
--   6-9. bahasa-arab-dasar-1 s/d 4                      -> arabic_nahwu
--
-- Migrasi ini aditif dan idempoten: tidak menghapus tabel, tidak menghapus
-- baris, dan aman dijalankan berulang.

-- Kolom penanda kitab rujukan pada setiap jalur belajar.
ALTER TABLE learn_paths ADD COLUMN kitab_slug TEXT;

-- Jalur baru yang belum ada di 0059.
INSERT OR IGNORE INTO learn_paths (key, title, purpose, sort_order, is_active)
VALUES
  ('quran_tahsin', 'Qur''an & Tahsin', 'Memperbaiki bacaan Al-Qur''an secara bertahap: makhraj, hukum nun sukun, mim sukun, sampai mad.', 5, 1),
  ('hadits', 'Hadits Arba''in', 'Mengenal pokok-pokok ajaran Islam melalui hadits pilihan Imam Nawawi beserta syarahnya.', 45, 1);

-- Tautkan setiap jalur ke kitab rujukannya.
UPDATE learn_paths SET kitab_slug = 'ilmu-tajwid-lengkap' WHERE key = 'quran_tahsin';
UPDATE learn_paths SET kitab_slug = 'terjemah-aqidatul-awam' WHERE key = 'aqidah_aswaja';
UPDATE learn_paths SET kitab_slug = 'safinatun-najah-makna-perkata' WHERE key = 'fikih_praktis';
UPDATE learn_paths SET kitab_slug = 'terjemah-syarah-arbain-nawawiyah-ibnu-daqiqil-ied' WHERE key = 'hadits';
UPDATE learn_paths SET kitab_slug = 'terjemah-bidayatul-hidayah' WHERE key = 'adab';
UPDATE learn_paths SET kitab_slug = 'bahasa-arab-dasar-1' WHERE key = 'arabic_nahwu';

-- Modul pembuka untuk dua jalur baru, mengikuti pola 0059.
INSERT OR IGNORE INTO learn_modul (id, lembaga_id, path_key, judul, deskripsi, kategori, urutan, is_aktif)
VALUES
  ('learn-quran-tahsin-01', NULL, 'quran_tahsin', 'Dasar Tajwid dan Bunyi Huruf', 'Pengantar ilmu tajwid, huruf hijaiyah, harakat, dan hukum nun sukun.', 'kitab', 1, 1),
  ('learn-hadits-01', NULL, 'hadits', 'Mengenal Hadits Arba''in', 'Pengantar hadits Arba''in Nawawiyah: niat, Islam-iman-ihsan, dan meninggalkan yang tidak bermanfaat.', 'kitab', 1, 1);

INSERT OR IGNORE INTO learn_soal (
  id, modul_id, tipe, pertanyaan, pilihan, pilihan_a, pilihan_b, pilihan_c, pilihan_d,
  jawaban_benar, penjelasan, urutan
)
VALUES
  ('learn-quran-tahsin-01-q01', 'learn-quran-tahsin-01', 'pilihan_ganda', 'Ilmu tajwid dipelajari untuk?', '["Menjaga bacaan Al-Qur''an dari kesalahan","Mempercepat bacaan","Menambah lagu","Mengganti makna"]', 'Menjaga bacaan Al-Qur''an dari kesalahan', 'Mempercepat bacaan', 'Menambah lagu', 'Mengganti makna', 'a', 'Tajwid menjaga lisan agar bacaan Al-Qur''an sesuai dengan yang diajarkan.', 1),
  ('learn-quran-tahsin-01-q02', 'learn-quran-tahsin-01', 'pilihan_ganda', 'Nun sukun bertemu huruf ba'' dibaca dengan hukum?', '["Iqlab","Izhar halqi","Idgham bilaghunnah","Qalqalah"]', 'Iqlab', 'Izhar halqi', 'Idgham bilaghunnah', 'Qalqalah', 'a', 'Iqlab mengubah bunyi nun sukun atau tanwin menjadi mim ketika bertemu ba''.', 2),
  ('learn-quran-tahsin-01-q03', 'learn-quran-tahsin-01', 'pilihan_ganda', 'Lam pada kata "al-qamaru" dibaca?', '["Jelas, karena lam qamariyah","Melebur, karena lam syamsiyah","Dihilangkan","Dipanjangkan enam harakat"]', 'Jelas, karena lam qamariyah', 'Melebur, karena lam syamsiyah', 'Dihilangkan', 'Dipanjangkan enam harakat', 'a', 'Lam qamariyah dibaca jelas, berbeda dengan lam syamsiyah yang melebur ke huruf sesudahnya.', 3),
  ('learn-hadits-01-q01', 'learn-hadits-01', 'pilihan_ganda', 'Hadits pertama dalam Arba''in Nawawiyah membahas tentang?', '["Niat","Warisan","Jual beli","Puasa sunnah"]', 'Niat', 'Warisan', 'Jual beli', 'Puasa sunnah', 'a', 'Hadits pembuka Arba''in menegaskan bahwa setiap amal bergantung pada niatnya.', 1),
  ('learn-hadits-01-q02', 'learn-hadits-01', 'pilihan_ganda', 'Ihsan dalam hadits Jibril bermakna?', '["Beribadah seakan melihat Allah","Beribadah bila sempat","Beribadah agar dipuji","Beribadah tanpa ilmu"]', 'Beribadah seakan melihat Allah', 'Beribadah bila sempat', 'Beribadah agar dipuji', 'Beribadah tanpa ilmu', 'a', 'Ihsan adalah beribadah seakan melihat Allah, dan bila tidak, meyakini Allah melihat kita.', 2),
  ('learn-hadits-01-q03', 'learn-hadits-01', 'pilihan_ganda', 'Tanda baiknya keislaman seseorang menurut hadits Arba''in adalah?', '["Meninggalkan hal yang tidak bermanfaat","Banyak bicara","Sering berdebat","Menumpuk harta"]', 'Meninggalkan hal yang tidak bermanfaat', 'Banyak bicara', 'Sering berdebat', 'Menumpuk harta', 'a', 'Di antara tanda baiknya keislaman seseorang adalah meninggalkan perkara yang tidak bermanfaat baginya.', 3);
