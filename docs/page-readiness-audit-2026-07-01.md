# Audit Kesiapan Halaman SantriOnline App — 2026-07-01

Audit ini dibuat dari scan eksplisit di `src/routes` untuk tanda: `belum siap`, `belum tersedia`, `fitur-belum-tersedia`, `segera hadir`, `coming soon`, dan target demo seperti `JSONPlaceholder`.

## Ringkasan Prioritas

### HIGH — terlihat sebagai fitur belum siap / berpotensi error produksi
1. `/dashboard` — masih punya link ke `/fitur-belum-tersedia` untuk beberapa menu seperti Qurban/Pengumuman, dan action aset bergantung tabel aset.
2. `/dashboard/kelola-aset` — action tambah/update/delete aset masih mengembalikan `Layanan aset belum siap` jika tabel belum ada.
3. `/dashboard/jadwal` — action jadwal imam/tarawih/khotib masih bergantung tabel jadwal yang bisa belum ada.
4. `/keuangan` — action kas masih mengembalikan `Layanan kas belum siap` jika tabel belum ada.
5. `/coins/topup` — bergantung konfigurasi Midtrans; jika secret/client key belum ada, topup belum siap.
6. `/admin/tools/scraper` — masih memakai target demo `JSONPlaceholder`; belum layak sebagai tool produksi.

### MEDIUM — fitur jalan bersyarat data/config, tapi perlu polishing sebelum diklaim siap
7. `/admin/licenses/generate` — butuh `LICENSE_KEY_HASH_SECRET` dan produk aktif di D1.
8. `/admin/posts`, `/admin/posts/new`, `/admin/posts/[id]/edit` — CMS admin bergantung binding DB/schema CMS.
9. `/buku`, `/buku/[slug]`, `/admin/super/buku`, `/admin/super/buku/[id]` — masih ada fallback `Cover belum tersedia`.
10. `/buku/[slug]/bab/[chapter]` — ada kondisi `Konten bab belum tersedia` untuk bab published tanpa isi.
11. `/kitab/[slug]` — viewer belum tersedia untuk sebagian kitab, fallback ke tombol sumber.
12. `/kitab/quran` — beberapa state data juz/rentang masih punya fallback belum tersedia.

### LOW — fallback data kosong/profil, bukan blocker utama
13. `/dashboard/rapor-hafalan` — perlu seed kategori hafalan agar tidak muncul `Data kategori hafalan belum tersedia`.
14. `/tpq/hafalan-rapor` — sama: butuh kategori hafalan lembaga.
15. `/tpq/[slug]`, `/pondok/[slug]`, `/masjid/[slug]`, `/musholla/[slug]`, `/rumah-tahfidz/[slug]` — fallback `alamat belum tersedia`; perlu kelengkapan data profil lembaga.

## Catatan Fix Yang Sudah Dikerjakan

- `/` (`src/routes/(marketing)/+page.svelte`) sudah diubah menjadi landing page baru yang menonjolkan SantriOnline sebagai sistem pembinaan generasi muslim: aqidah, adab, ilmu, skill, komunitas, dan habit system.
- `/addon` sudah diperbaiki agar tombol `Minta Addon` tidak gagal karena status `pending` melanggar CHECK constraint lama tabel `addon_lembaga`.
- Untuk sementara request addon disimpan sebagai status `trial`, karena migration `0037_multi_lembaga.sql` hanya mengizinkan `aktif`, `expired`, dan `trial`. UI `/addon` sekarang menampilkan status `trial` sebagai `Menunggu Konfirmasi Admin`.

## Rekomendasi Sprint Berikutnya

1. Buat migration aman untuk memperluas status `addon_lembaga` menjadi mendukung `pending`, lalu migrasikan data `trial` request ke `pending`.
2. Selesaikan schema/tabel untuk aset, kas, dan jadwal agar dashboard operasional tidak menampilkan error `belum siap`.
3. Ganti scraper demo dengan target internal SantriOnline atau sembunyikan dari menu produksi.
4. Seed kategori hafalan default untuk setiap lembaga TPQ.
5. Rapikan konten buku/kitab: cover default yang lebih profesional, validasi bab published wajib punya konten, dan status viewer kitab.
