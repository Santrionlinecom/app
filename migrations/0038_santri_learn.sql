-- SantriLearn: gamifikasi belajar Bahasa Arab, Nahwu, dan Shorof

-- Kurikulum/materi pelajaran
CREATE TABLE IF NOT EXISTS learn_modul (
  id TEXT PRIMARY KEY,
  lembaga_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  kategori TEXT NOT NULL CHECK(kategori IN ('hijaiyah','mufrodat','nahwu','shorof','kitab')),
  urutan INTEGER DEFAULT 0,
  is_aktif INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);

-- Soal latihan per modul
CREATE TABLE IF NOT EXISTS learn_soal (
  id TEXT PRIMARY KEY,
  modul_id TEXT NOT NULL REFERENCES learn_modul(id) ON DELETE CASCADE,
  tipe TEXT NOT NULL CHECK(tipe IN ('pilihan_ganda','cocokkan','isi_titik','susun_kata','dengar_pilih')),
  pertanyaan TEXT NOT NULL,
  pilihan TEXT,
  jawaban_benar TEXT NOT NULL,
  audio_url TEXT,
  urutan INTEGER DEFAULT 0
);

-- Progress belajar per santri
CREATE TABLE IF NOT EXISTS learn_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  modul_id TEXT NOT NULL REFERENCES learn_modul(id) ON DELETE CASCADE,
  soal_selesai INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  streak_hari INTEGER DEFAULT 0,
  last_belajar INTEGER,
  status TEXT DEFAULT 'belum' CHECK(status IN ('belum','proses','selesai')),
  UNIQUE(user_id, modul_id)
);

-- Riwayat jawaban
CREATE TABLE IF NOT EXISTS learn_jawaban (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  soal_id TEXT NOT NULL REFERENCES learn_soal(id) ON DELETE CASCADE,
  jawaban TEXT NOT NULL,
  is_benar INTEGER DEFAULT 0,
  waktu_jawab INTEGER DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);

-- Badge/pencapaian
CREATE TABLE IF NOT EXISTS learn_badge (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lembaga_id TEXT REFERENCES organizations(id),
  tipe TEXT NOT NULL,
  diraih_at INTEGER DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);

-- Index performa
CREATE INDEX IF NOT EXISTS idx_learn_progress_user ON learn_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learn_soal_modul ON learn_soal(modul_id);
CREATE INDEX IF NOT EXISTS idx_learn_jawaban_user ON learn_jawaban(user_id);

-- Modul global default
INSERT OR IGNORE INTO learn_modul (id, lembaga_id, judul, deskripsi, kategori, urutan, is_aktif)
VALUES
  ('global-hijaiyah-01', NULL, 'Huruf Hijaiyah', 'Kenali huruf-huruf dasar sebelum membaca kata Arab.', 'hijaiyah', 1, 1),
  ('global-mufrodat-01', NULL, 'Mufrodat Dasar', 'Latihan menghubungkan kata Arab umum dengan artinya.', 'mufrodat', 2, 1),
  ('global-nahwu-01', NULL, 'Nahwu Dasar - Isim & Fi''il', 'Bedakan kata benda dan kata kerja dalam kalimat pendek.', 'nahwu', 3, 1),
  ('global-shorof-01', NULL, 'Shorof Dasar - Tasrif', 'Lengkapi bentuk dasar tasrif dari pola fi''il sederhana.', 'shorof', 4, 1);

-- Modul 1: Huruf Hijaiyah
INSERT OR IGNORE INTO learn_soal (id, modul_id, tipe, pertanyaan, pilihan, jawaban_benar, urutan)
VALUES
  ('hijaiyah-01-ba', 'global-hijaiyah-01', 'pilihan_ganda', 'Pilih huruf Ba', '["ا","ب","ت","ث"]', 'ب', 1),
  ('hijaiyah-02-ta', 'global-hijaiyah-01', 'pilihan_ganda', 'Pilih huruf Ta', '["ج","ح","ت","خ"]', 'ت', 2),
  ('hijaiyah-03-jim', 'global-hijaiyah-01', 'pilihan_ganda', 'Pilih huruf Jim', '["ج","د","ذ","ر"]', 'ج', 3),
  ('hijaiyah-04-sin', 'global-hijaiyah-01', 'pilihan_ganda', 'Pilih huruf Sin', '["س","ش","ص","ض"]', 'س', 4),
  ('hijaiyah-05-mim', 'global-hijaiyah-01', 'pilihan_ganda', 'Pilih huruf Mim', '["ف","ق","م","ن"]', 'م', 5);

-- Modul 2: Mufrodat Dasar
INSERT OR IGNORE INTO learn_soal (id, modul_id, tipe, pertanyaan, pilihan, jawaban_benar, urutan)
VALUES
  ('mufrodat-01-bait', 'global-mufrodat-01', 'cocokkan', 'بيت', '["rumah","air","buku","pintu"]', 'rumah', 1),
  ('mufrodat-02-maa', 'global-mufrodat-01', 'cocokkan', 'ماء', '["pena","air","rumah","buku"]', 'air', 2),
  ('mufrodat-03-kitab', 'global-mufrodat-01', 'cocokkan', 'كتاب', '["pintu","pena","buku","air"]', 'buku', 3),
  ('mufrodat-04-qalam', 'global-mufrodat-01', 'cocokkan', 'قلم', '["buku","pena","rumah","pintu"]', 'pena', 4),
  ('mufrodat-05-baab', 'global-mufrodat-01', 'cocokkan', 'باب', '["air","pintu","pena","buku"]', 'pintu', 5);

-- Modul 3: Nahwu Dasar - Isim & Fi'il
INSERT OR IGNORE INTO learn_soal (id, modul_id, tipe, pertanyaan, pilihan, jawaban_benar, urutan)
VALUES
  ('nahwu-01-kitab', 'global-nahwu-01', 'pilihan_ganda', 'Tentukan jenis kata yang ditanya: كتاب', '["Isim","Fi''il","Huruf","Jumlah"]', 'Isim', 1),
  ('nahwu-02-kataba', 'global-nahwu-01', 'pilihan_ganda', 'Tentukan jenis kata yang ditanya: كَتَبَ', '["Isim","Fi''il","Huruf","Sifat"]', 'Fi''il', 2),
  ('nahwu-03-masjid', 'global-nahwu-01', 'pilihan_ganda', 'Tentukan jenis kata yang ditanya: مسجد', '["Fi''il","Isim","Huruf","Dhamir"]', 'Isim', 3),
  ('nahwu-04-yaktubu', 'global-nahwu-01', 'pilihan_ganda', 'Tentukan jenis kata yang ditanya: يَكْتُبُ', '["Isim","Fi''il","Huruf","Jar"]', 'Fi''il', 4),
  ('nahwu-05-talib', 'global-nahwu-01', 'pilihan_ganda', 'Tentukan jenis kata yang ditanya: طالب', '["Fi''il","Huruf","Isim","Jumlah"]', 'Isim', 5);

-- Modul 4: Shorof Dasar - Tasrif
INSERT OR IGNORE INTO learn_soal (id, modul_id, tipe, pertanyaan, pilihan, jawaban_benar, urutan)
VALUES
  ('shorof-01-faala', 'global-shorof-01', 'isi_titik', 'Lengkapi mudhari dari فَعَلَ: ____', NULL, 'يَفْعَلُ', 1),
  ('shorof-02-nashara', 'global-shorof-01', 'isi_titik', 'Lengkapi mudhari dari نَصَرَ: ____', NULL, 'يَنْصُرُ', 2),
  ('shorof-03-dharaba', 'global-shorof-01', 'isi_titik', 'Lengkapi mudhari dari ضَرَبَ: ____', NULL, 'يَضْرِبُ', 3),
  ('shorof-04-fatha', 'global-shorof-01', 'isi_titik', 'Lengkapi masdar dari فَتَحَ: ____', NULL, 'فَتْحٌ', 4),
  ('shorof-05-ilm', 'global-shorof-01', 'isi_titik', 'Lengkapi masdar dari عَلِمَ: ____', NULL, 'عِلْمٌ', 5);
