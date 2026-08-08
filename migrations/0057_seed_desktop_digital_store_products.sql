-- Seed desktop apps into digital_products (store catalog)
-- License product catalog remains in `products` (migration 0056).
-- SantriPrint has real Windows installer on R2; OCR/Cleaner/Subtitle are published with honest status notes.

PRAGMA foreign_keys = ON;

-- SantriPrint Pro — installer siap unduh
INSERT INTO digital_products (
  id, title, slug, summary, description, price, cover_url, file_url, status, featured, created_at, updated_at
) VALUES (
  'dprod_santriprint_pro',
  'SantriPrint Pro',
  'santriprint-pro',
  'Aplikasi desktop cetak foto & layout ukuran fisik. Export PDF dan Cetak Windows asli. Lisensi: santriprint-pro.',
  'SantriPrint Pro adalah aplikasi desktop Windows untuk layout cetak foto dan dokumen ukuran fisik.

Fitur utama:
• Layout cetak multi halaman dengan template
• Export PDF ukuran fisik (terpisah dari Cetak)
• Cetak lewat dialog printer Windows asli (pilih printer, Properties, copies)
• Mode Free terbatas; Pro membuka multi-page, grid, DPI, dan template premium
• Aktivasi lisensi online ke SantriOnline (max 2 perangkat)

Cara pakai:
1. Beli produk ini (Coin) atau minta key Pro dari admin
2. Unduh installer Windows (.exe)
3. Install, buka SantriPrint, aktifkan lisensi di panel Lisensi
4. Product slug lisensi: santriprint-pro

Versi paket: 0.2.0 (setup x64).
Target: studio foto, panitia event, lembaga, dan UMKM cetak.',
  9900,
  'https://files.santrionline.com/digital-products/santriprint/cover.png',
  'https://files.santrionline.com/digital-products/santriprint/SantriPrint_0.2.0_x64-setup.exe',
  'published',
  1,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
)
ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  slug = excluded.slug,
  summary = excluded.summary,
  description = excluded.description,
  price = excluded.price,
  cover_url = excluded.cover_url,
  file_url = excluded.file_url,
  status = excluded.status,
  featured = excluded.featured,
  updated_at = excluded.updated_at;

-- Upsert by slug if id differs
INSERT INTO digital_products (
  id, title, slug, summary, description, price, cover_url, file_url, status, featured, created_at, updated_at
)
SELECT
  'dprod_santriprint_pro',
  'SantriPrint Pro',
  'santriprint-pro',
  'Aplikasi desktop cetak foto & layout ukuran fisik. Export PDF dan Cetak Windows asli. Lisensi: santriprint-pro.',
  'SantriPrint Pro — desktop Windows layout cetak + PDF + native print. Unduh setup, aktifkan key Pro. Product slug: santriprint-pro. Versi 0.2.0.',
  9900,
  'https://files.santrionline.com/digital-products/santriprint/cover.png',
  'https://files.santrionline.com/digital-products/santriprint/SantriPrint_0.2.0_x64-setup.exe',
  'published',
  1,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM digital_products WHERE slug = 'santriprint-pro');

-- SantriOCR Pro — deskripsi siap jual; installer final masih P1
INSERT INTO digital_products (
  id, title, slug, summary, description, price, cover_url, file_url, status, featured, created_at, updated_at
) VALUES (
  'dprod_santri_ocr_pro',
  'SantriOCR Pro',
  'santri-ocr-pro',
  'Ubah kitab, modul TPQ, dan dokumen Arab menjadi teks editable (DOCX/TXT). Offline. Lisensi: santri-ocr-pro. Installer final menyusul.',
  'SantriOCR Pro mengubah PDF/gambar (Latin, Indonesia, Inggris, Arab) menjadi teks yang bisa diedit.

Fitur jual:
• PDF/gambar ke DOCX & TXT
• OCR Arab–Indonesia (+ Inggris)
• Multi halaman + koreksi teks per halaman
• Privasi lokal/offline
• Target: guru TPQ, pesantren, peneliti kitab, pengurus masjid, penerbit Islam

Lisensi:
• Product slug: santri-ocr-pro
• Max 2 perangkat
• Generate key di /admin/licenses/generate

Status rilis:
• Sistem lisensi server sudah aktif
• Installer Windows final + packaging model OCR masih tahap P1
• Setelah bayar, Anda mendapat akses katalog + key; unduhan installer final diumumkan di halaman produk

Kisaran harga ritel: Rp79.000–Rp149.000.',
  9900,
  NULL,
  NULL,
  'published',
  1,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
)
ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  slug = excluded.slug,
  summary = excluded.summary,
  description = excluded.description,
  price = excluded.price,
  status = excluded.status,
  featured = excluded.featured,
  updated_at = excluded.updated_at;

INSERT INTO digital_products (
  id, title, slug, summary, description, price, cover_url, file_url, status, featured, created_at, updated_at
)
SELECT
  'dprod_santri_ocr_pro',
  'SantriOCR Pro',
  'santri-ocr-pro',
  'Ubah kitab, modul TPQ, dan dokumen Arab menjadi teks editable. Lisensi: santri-ocr-pro.',
  'SantriOCR Pro — OCR Arab–Indonesia ke DOCX/TXT, multi-page, offline. Installer final P1. Lisensi santri-ocr-pro.',
  9900,
  NULL,
  NULL,
  'published',
  1,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM digital_products WHERE slug = 'santri-ocr-pro');

-- Santri Cleaner Pro
INSERT INTO digital_products (
  id, title, slug, summary, description, price, cover_url, file_url, status, featured, created_at, updated_at
) VALUES (
  'dprod_santri_cleaner_pro',
  'Santri Cleaner Pro',
  'santri-cleaner-pro',
  'Pembersih file sampah developer & creator di Windows. Lisensi: santri-cleaner-pro.',
  'Santri Cleaner Pro membantu membersihkan cache, sisa build, dan file sampah workflow developer/creator di Windows.

Fitur Pro (lisensi):
• Deep scan
• Developer cleaner
• Creator cleaner
• Export laporan PDF
• AI assistant (jika diaktifkan di client)

Product slug lisensi: santri-cleaner-pro (max 3 perangkat).
Installer/bundle rilis disusulkan di halaman unduhan setelah paket final siap.',
  9900,
  NULL,
  NULL,
  'published',
  0,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
)
ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  slug = excluded.slug,
  summary = excluded.summary,
  description = excluded.description,
  price = excluded.price,
  status = excluded.status,
  featured = excluded.featured,
  updated_at = excluded.updated_at;

INSERT INTO digital_products (
  id, title, slug, summary, description, price, cover_url, file_url, status, featured, created_at, updated_at
)
SELECT
  'dprod_santri_cleaner_pro',
  'Santri Cleaner Pro',
  'santri-cleaner-pro',
  'Pembersih file sampah developer & creator di Windows. Lisensi: santri-cleaner-pro.',
  'Santri Cleaner Pro — deep scan, developer/creator cleaner. Lisensi santri-cleaner-pro.',
  9900,
  NULL,
  NULL,
  'published',
  0,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM digital_products WHERE slug = 'santri-cleaner-pro');

-- Santri Subtitle Pro
INSERT INTO digital_products (
  id, title, slug, summary, description, price, cover_url, file_url, status, featured, created_at, updated_at
) VALUES (
  'dprod_santri_subtitle_pro',
  'Santri Subtitle Pro',
  'santri-subtitle-pro',
  'Editor subtitle untuk konten dakwah & pembelajaran. Lisensi: santri-subtitle-pro.',
  'Santri Subtitle Pro membantu mengedit dan mengekspor subtitle (SRT) untuk video dakwah, kajian, dan materi pembelajaran.

Fitur Pro:
• Edit subtitle
• Export SRT
• Batch export
• Template

Product slug lisensi: santri-subtitle-pro (max 2 perangkat).
Installer final menyusul; key sudah bisa digenerate dari admin.',
  9900,
  NULL,
  NULL,
  'published',
  0,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
)
ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  slug = excluded.slug,
  summary = excluded.summary,
  description = excluded.description,
  price = excluded.price,
  status = excluded.status,
  featured = excluded.featured,
  updated_at = excluded.updated_at;

INSERT INTO digital_products (
  id, title, slug, summary, description, price, cover_url, file_url, status, featured, created_at, updated_at
)
SELECT
  'dprod_santri_subtitle_pro',
  'Santri Subtitle Pro',
  'santri-subtitle-pro',
  'Editor subtitle untuk konten dakwah & pembelajaran. Lisensi: santri-subtitle-pro.',
  'Santri Subtitle Pro — edit/export SRT, batch, template. Lisensi santri-subtitle-pro.',
  9900,
  NULL,
  NULL,
  'published',
  0,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM digital_products WHERE slug = 'santri-subtitle-pro');

-- Link all desktop products to active payment methods (QRIS + BCA)
INSERT OR IGNORE INTO digital_product_payment_methods (product_id, payment_method_id, created_at)
SELECT p.id, m.id, CAST(strftime('%s', 'now') AS INTEGER) * 1000
FROM digital_products p
CROSS JOIN digital_payment_methods m
WHERE p.slug IN ('santriprint-pro', 'santri-ocr-pro', 'santri-cleaner-pro', 'santri-subtitle-pro')
  AND m.is_active = 1;
