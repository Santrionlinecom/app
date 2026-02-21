# 📝 Changes

## Deprecation: Kanban & Request Asisten
- Seluruh referensi fitur Kanban dan request-asisten dibersihkan dari UI dan dokumentasi.
- Role `asisten` tidak lagi diekspos di dashboard maupun halaman kelola role.

## Role Ustadz/Ustadzah Disatukan
- Penentuan `ustadz` vs `ustadzah` kini otomatis berdasarkan gender pengguna ketika admin mengubah role.
- Perhitungan statistik dashboard menggabungkan ustadz dan ustadzah dalam satu kategori.

## Yang Tetap Berjalan
- Hafalan mandiri, kalender, sertifikat, dan fitur hafalan resmi tetap aktif tanpa perubahan perilaku.

## TPQ Daily Academic Workflow v1
- Menambahkan alur TPQ akademik end-to-end: `/tpq/akademik/setoran` -> `/tpq/akademik/review` -> `/tpq/akademik/riwayat`.
- Menambahkan tabel baru D1: `tpq_halaqoh` dan `tpq_setoran` (dengan indeks multi-tenant berbasis `institution_id`).
- Halaman placeholder akademik lama diarahkan ke flow TPQ baru agar transaksi setoran nyata bisa langsung dipakai.
- RBAC workflow TPQ:
  - Input setoran: `ustadz`/`ustadzah`/`admin`
  - Review approve/reject: `koordinator`/`admin`
  - Riwayat: scoped per role (`santri` diri sendiri, `ustadz` santri bimbingan, `admin/koordinator` semua)
- Integrasi approval setoran `hafalan` ke `hafalan_progress` otomatis saat status berubah menjadi `approved`.

## Hardening TPQ Akademik + Dashboard Layout
- Hardening backend alur TPQ:
  - Validasi format ID scope (`setoran`, `halaqoh`, `santri`, `ustadz`) sebelum query.
  - Sanitasi input teks (`notes`, nama halaqoh) dan batas panjang input.
  - Cek status aktif akun/lembaga pada context TPQ (`org.status` dan `user.orgStatus`).
  - Cegah duplikasi setoran `submitted` dengan data yang sama.
  - Cegah race-condition review dengan update bersyarat (`status='submitted'`) + verifikasi perubahan.
  - Batasi hasil list/filter (halaqoh, santri, ustadz) untuk menjaga performa.
- Dashboard dibuat lebih lebar:
  - Shell dashboard diperluas (lebih banyak ruang konten).
  - Halaman dashboard berbasis `.container` tidak lagi dibatasi `max-width` di tengah.

## Header Bahasa + Flag Favicon
- Header kini menampilkan pilihan bahasa dengan aset bendera lokal (`static/flags`) yang disinkronkan dari daftar bahasa.
- Favicon otomatis menyesuaikan bendera negara dari bahasa yang dipilih pengguna.
- Preferensi bahasa disimpan di localStorage agar tetap konsisten saat reload/navigasi.
