# Quick Guide - Fitur Hafalan Mandiri & Kalender

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
   - Task yang di-assign
   - Catatan manual user
4. **Monitoring** → Identifikasi user yang aktif/tidak aktif

### Untuk Admin/Asisten (Task Management)
1. **Dashboard** → Klik "Task Kanban"
2. **Create Task**:
   - Masukkan judul & deskripsi
   - Set **Due Date**
   - **Assign** ke user tertentu
   - Klik **Create**
3. **Otomatis** → Task muncul di kalender user yang di-assign

---

## 📍 URL Routes

| Fitur | URL | Akses |
|-------|-----|-------|
| Hafalan Mandiri | `/dashboard/hafalan-mandiri` | Semua user |
| Kalender | `/kalender` | Semua user |
| Kanban Tasks | `/dashboard/kanban-tugas` | Admin, Asisten |
| Kelola Role | `/dashboard/kelola-role` | Admin only |
| Request Asisten | `/dashboard/request-asisten` | Ustadz, Admin |

---

## 🎨 Color Coding

### Kualitas Hafalan
- 🟢 **Hijau** = Lancar
- 🟡 **Kuning** = Kurang Lancar  
- 🔴 **Merah** = Belum Lancar

### Priority Task (Kanban)
- 🔵 **Biru** = Low
- 🟡 **Kuning** = Medium
- 🟠 **Orange** = High
- 🔴 **Merah** = Urgent

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

### Task Kanban
- ✅ Selalu set **due_date** agar masuk kalender
- ✅ Assign ke user yang tepat
- ✅ Gunakan priority untuk urgent task
- ✅ Update status task secara real-time

---

## ❓ FAQ

### Q: Apakah hafalan mandiri berbeda dengan setoran resmi?
**A**: Ya. Hafalan mandiri untuk tracking pribadi, setoran resmi tetap ke ustadz seperti biasa.

### Q: Apakah user lain bisa melihat muroja'ah saya?
**A**: Tidak. Hanya Anda dan Admin yang bisa melihat.

### Q: Bagaimana cara menghapus muroja'ah yang salah input?
**A**: Klik tombol "🗑️ Hapus" di card muroja'ah tersebut.

### Q: Apakah task kanban otomatis masuk kalender?
**A**: Ya, jika task memiliki due_date dan assigned_to.

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

### Task tidak muncul di kalender user
1. Pastikan task memiliki due_date
2. Pastikan task di-assign ke user
3. User harus refresh kalender

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

### Untuk Asisten
- ✅ Selalu set due_date untuk task
- ✅ Assign task ke user yang tepat
- ✅ Follow up task yang mendekati deadline
- ✅ Update status task secara real-time

---

**Happy Muroja'ah! 📖✨**
