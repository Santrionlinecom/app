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
