# Quick Guide - Fitur Hafalan Mandiri & Kalender

## 🔐 Aturan Akses Fitur (RBAC)

- **Lembaga Pendidikan** (pondok, TPQ, rumah tahfidz): fitur akademik **aktif** → hafalan, setoran, ujian, raport/sertifikat.
- **Lembaga Sosial** (masjid, musholla): fitur keumatan **aktif** → kas masjid, zakat/infaq, jadwal kegiatan, kalender.
- Akses yang tidak sesuai tipe lembaga akan **ditolak server-side (403)**.

## 🚀 Quick Start

### Untuk Santri/Alumni
1. **Login** ke sistem
2. **Dashboard** → Klik "Hafalan Mandiri"
3. **Tambah Muroja'ah**:
   - Pilih Surah
   - Masukkan Ayat Mulai & Selesai
   - Pilih Kualitas (Lancar/Kurang Lancar/Belum Lancar)
   - Tambah Catatan (opsional)
   - Pilih Tanggal
   - Klik **Simpan**
4. **Lihat Kalender** → Muroja'ah otomatis muncul di kalender

### Untuk Admin
1. **Login** sebagai admin
2. **Dashboard** → Klik "Kalender"
3. **Lihat Semua** aktivitas user:
   - Muroja'ah semua user
   - Catatan manual user
4. **Monitoring** → Identifikasi user yang aktif/tidak aktif

## 📍 URL Routes

| Fitur | URL | Akses |
|-------|-----|-------|
| Hafalan Mandiri | `/dashboard/hafalan-mandiri` | Pendidikan (pondok/TPQ/rumah tahfidz) |
| Setoran & Review | `/dashboard/setoran-hari-ini`, `/dashboard/review-setoran` | Pendidikan |
| Ujian Tahfidz | `/dashboard/ujian-tahfidz` | Pendidikan |
| Raport & Sertifikat | `/dashboard/pencapaian-hafalan`, `/dashboard/sertifikat` | Pendidikan |
| Kalender | `/kalender` | Masjid/Musholla |
| Keuangan Ummah | `/keuangan`, `/org/[slug]/ummah` | Masjid/Musholla |
| Kelola Role | `/dashboard/kelola-role` | Admin only |

---

## 🧾 Panduan Upload Excel Jadwal Imam

Template contoh tersedia di `static/templates/jadwal-imam-template.xlsx` (di web: `/templates/jadwal-imam-template.xlsx`).

### Kolom Wajib
- `tanggal` → format `YYYY-MM-DD` atau `DD/MM/YYYY` (contoh: `2025-03-01`).
- `waktu` / `sholat` → contoh: `Subuh`, `Dzuhur`, `Ashar`, `Maghrib`, `Isya`.
- `imam` → nama imam.

### Kolom Opsional
- `hari` → contoh: `Senin`, `Selasa`, dst (jika kosong akan dihitung otomatis dari tanggal).
- `catatan` → keterangan tambahan (opsional).

### Langkah Upload
1. Buka `/dashboard/jadwal`.
2. Pada bagian **Jadwal Imam Sholat**, klik **Upload Jadwal**.
3. Pilih file Excel (`.xlsx` / `.xls` / `.csv`) sesuai template.
4. Data dengan tanggal + waktu yang sama akan **di-update** otomatis.

### Catatan Penting
- Sistem membaca **sheet pertama** saja.
- Baris kosong atau kolom wajib kosong akan diabaikan.

---

## 🎨 Color Coding

### Kualitas Hafalan
- 🟢 **Hijau** = Lancar
- 🟡 **Kuning** = Kurang Lancar  
- 🔴 **Merah** = Belum Lancar

---

## 💡 Tips & Tricks

### Hafalan Mandiri
- ✅ Catat muroja'ah **setiap hari** untuk tracking konsisten
- ✅ Fokus pada ayat dengan kualitas "Belum Lancar"
- ✅ Gunakan catatan untuk detail (misalnya: "Sering lupa ayat 15")
- ✅ Lihat statistik untuk motivasi

### Kalender
- ✅ Gunakan kalender untuk **planning** muroja'ah
- ✅ Cek kalender setiap pagi untuk jadwal hari ini
- ✅ Admin: Monitor aktivitas user secara berkala
- ✅ Tambah catatan manual untuk event khusus

---

## ❓ FAQ

### Q: Apakah hafalan mandiri berbeda dengan setoran resmi?
**A**: Ya. Hafalan mandiri untuk tracking pribadi, setoran resmi tetap ke ustadz seperti biasa.

### Q: Apakah user lain bisa melihat muroja'ah saya?
**A**: Tidak. Hanya Anda dan Admin yang bisa melihat.

### Q: Bagaimana cara menghapus muroja'ah yang salah input?
**A**: Klik tombol "🗑️ Hapus" di card muroja'ah tersebut.

### Q: Bagaimana admin melihat kalender semua user?
**A**: Admin otomatis melihat semua kalender saat buka `/kalender`.

### Q: Apakah bisa edit muroja'ah yang sudah dibuat?
**A**: Saat ini belum, tapi bisa hapus dan buat baru.

---

## 🐛 Troubleshooting

### Muroja'ah tidak muncul di kalender
1. Cek apakah tanggal sudah benar
2. Refresh halaman kalender
3. Pastikan sudah klik "Simpan"

### Tidak bisa tambah muroja'ah
1. Pastikan semua field terisi
2. Cek ayat mulai ≤ ayat selesai
3. Cek koneksi internet

---

## 📞 Support

Jika ada masalah atau pertanyaan:
1. Hubungi Admin sistem
2. Atau buat issue di GitHub (jika ada)

---

## 🎯 Best Practices

### Untuk User
- ✅ Konsisten catat muroja'ah setiap hari
- ✅ Jujur dalam menilai kualitas hafalan
- ✅ Gunakan catatan untuk detail penting
- ✅ Review statistik setiap minggu

### Untuk Admin
- ✅ Monitor aktivitas user secara berkala
- ✅ Identifikasi user yang tidak aktif
- ✅ Berikan feedback berdasarkan data
- ✅ Gunakan kalender untuk koordinasi event

---

**Happy Muroja'ah! 📖✨**
