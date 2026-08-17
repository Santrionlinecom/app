-- Kebijakan tetap SantriOnline: ilmu agama tidak dijual.
--
-- Aqidah, fiqih, hadits, tafsir, sirah, akhlak, adab, dan Al-Qur'an wajib
-- gratis selamanya. Ilmu agama adalah amanah dakwah, bukan barang dagangan.
--
-- Migrasi ini membebaskan kursus agama yang terlanjur berbayar. Penegakan
-- ke depan dilakukan di lapisan aplikasi (kebijakan-harga.ts), sehingga
-- kursus agama berbayar tidak bisa masuk lagi lewat seed maupun panel
-- superadmin.

UPDATE kursus
SET harga_koin = 0,
    updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
WHERE harga_koin > 0
  AND (
    LOWER(COALESCE(kategori, '')) LIKE '%aqidah%'
    OR LOWER(COALESCE(kategori, '')) LIKE '%akidah%'
    OR LOWER(COALESCE(kategori, '')) LIKE '%tauhid%'
    OR LOWER(COALESCE(kategori, '')) LIKE '%fiqih%'
    OR LOWER(COALESCE(kategori, '')) LIKE '%fikih%'
    OR LOWER(COALESCE(kategori, '')) LIKE '%hadits%'
    OR LOWER(COALESCE(kategori, '')) LIKE '%hadis%'
    OR LOWER(COALESCE(kategori, '')) LIKE '%tafsir%'
    OR LOWER(COALESCE(kategori, '')) LIKE '%sirah%'
    OR LOWER(COALESCE(kategori, '')) LIKE '%akhlak%'
    OR LOWER(COALESCE(kategori, '')) LIKE '%adab%'
    OR LOWER(COALESCE(kategori, '')) LIKE '%quran%'
    OR LOWER(COALESCE(kategori, '')) LIKE '%tajwid%'
    OR LOWER(COALESCE(kategori, '')) LIKE '%tahfidz%'
    OR LOWER(COALESCE(kategori, '')) LIKE '%tasawuf%'
    OR LOWER(COALESCE(kategori, '')) LIKE '%keislaman%'
  );
