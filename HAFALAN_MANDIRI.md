# Fitur Hafalan Mandiri & Integrasi Kalender

## Overview
Fitur ini memungkinkan alumni dan santri untuk melakukan muroja'ah mandiri dengan tracking kualitas hafalan dan terintegrasi dengan kalender.

## Fitur Utama

### 1. Hafalan Mandiri (`/dashboard/hafalan-mandiri`)
**Akses**: Semua user (terutama untuk alumni dan santri)

**Fitur**:
- ✅ Tracking muroja'ah harian
- ✅ Pencatatan kualitas hafalan (Lancar, Kurang Lancar, Belum Lancar)
- ✅ Statistik hafalan per kualitas
- ✅ Riwayat muroja'ah dengan detail surah dan ayat
- ✅ Catatan tambahan untuk setiap muroja'ah
- ✅ Otomatis menambahkan ke kalender pribadi

**Cara Penggunaan**:
1. Klik "Tambah Muroja'ah" 
2. Pilih Surah dan range ayat
3. Tentukan kualitas hafalan
4. Tambahkan catatan (opsional)
5. Pilih tanggal muroja'ah
6. Simpan - otomatis masuk ke kalender

### 2. Kalender Terintegrasi (`/kalender`)
**Akses**: Semua user

**Fitur**:
- ✅ Setiap user hanya melihat kalender pribadi mereka
- ✅ Admin dapat melihat semua kalender user
- ✅ Integrasi otomatis dengan:
  - Muroja'ah dari hafalan mandiri
  - Task dari Kanban (jika ada due_date)
  - Catatan manual user
- ✅ CRUD kalender notes
- ✅ Filter dan pencarian

**Cara Kerja**:
- **User biasa**: Hanya melihat dan mengelola catatan sendiri
- **Admin**: Melihat semua catatan dari semua user untuk monitoring

### 3. Integrasi Kanban dengan Kalender
**Fitur**:
- ✅ Task dengan due_date otomatis masuk ke kalender
- ✅ Task ditampilkan di kalender user yang di-assign
- ✅ Jika tidak ada assigned_to, masuk ke kalender creator

**Cara Kerja**:
1. Admin/Asisten membuat task di Kanban
2. Jika task memiliki due_date dan assigned_to
3. Otomatis membuat entry di kalender user tersebut
4. Format: "📋 Task: [Judul Task]"

## Database Schema

### Tabel `muroja_tracking`
```sql
CREATE TABLE muroja_tracking (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL,
  ayah_start INTEGER NOT NULL,
  ayah_end INTEGER NOT NULL,
  quality TEXT NOT NULL CHECK (quality IN ('lancar', 'kurang_lancar', 'belum_lancar')),
  notes TEXT,
  muroja_date TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

### Tabel `calendar_notes` (sudah ada, diupdate)
```sql
CREATE TABLE calendar_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT,  -- bisa 'task', 'muroja', atau role user
  title TEXT NOT NULL,
  content TEXT,
  event_date TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## API Endpoints

### Hafalan Mandiri
- `POST /dashboard/hafalan-mandiri?/addMuroja` - Tambah muroja'ah
- `POST /dashboard/hafalan-mandiri?/deleteMuroja` - Hapus muroja'ah

### Kalender
- `POST /kalender?/addNote` - Tambah catatan kalender
- `POST /kalender?/updateNote` - Update catatan
- `POST /kalender?/deleteNote` - Hapus catatan

### Kanban (Updated)
- `POST /api/kanban` - Create task (otomatis ke kalender jika ada due_date)

## Akses & Permission

| Fitur | Santri | Ustadz | Ustadzah | Asisten | Admin |
|-------|--------|--------|----------|---------|-------|
| Hafalan Mandiri | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kalender Pribadi | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kalender Semua User | ❌ | ❌ | ❌ | ❌ | ✅ |
| Create Task Kanban | ❌ | ❌ | ❌ | ✅ | ✅ |

## Use Cases

### 1. Alumni Muroja'ah Mandiri
Alumni yang sudah lulus tetap bisa tracking muroja'ah mereka:
1. Login ke sistem
2. Buka "Hafalan Mandiri"
3. Catat muroja'ah harian dengan kualitas
4. Lihat statistik dan progress di dashboard
5. Cek kalender untuk jadwal muroja'ah

### 2. Santri Tracking Hafalan
Santri bisa tracking hafalan di luar setoran resmi:
1. Muroja'ah mandiri setiap hari
2. Catat kualitas hafalan
3. Identifikasi ayat yang perlu lebih banyak muroja'ah
4. Lihat di kalender kapan terakhir muroja'ah surah tertentu

### 3. Admin Monitoring
Admin bisa melihat aktivitas semua user:
1. Buka kalender
2. Lihat semua catatan dari semua user
3. Monitor muroja'ah alumni
4. Lihat task yang di-assign ke user
5. Koordinasi jadwal dan kegiatan

### 4. Task Management dengan Deadline
Admin/Asisten assign task dengan deadline:
1. Create task di Kanban
2. Set due_date dan assign_to
3. Task otomatis muncul di kalender user
4. User mendapat reminder visual di kalender

## Migrasi Database

Untuk Cloudflare D1, jalankan:
```bash
npx wrangler d1 execute DB --file=schema.sql
```

Atau tabel akan dibuat otomatis saat pertama kali diakses.

## Testing

1. **Test Hafalan Mandiri**:
   - Login sebagai santri/alumni
   - Tambah muroja'ah baru
   - Cek apakah muncul di riwayat
   - Cek apakah muncul di kalender

2. **Test Kalender Privacy**:
   - Login sebagai user biasa
   - Cek hanya melihat kalender sendiri
   - Login sebagai admin
   - Cek bisa melihat semua kalender

3. **Test Integrasi Kanban**:
   - Login sebagai admin/asisten
   - Create task dengan due_date
   - Assign ke user tertentu
   - Login sebagai user tersebut
   - Cek task muncul di kalender

## Catatan Penting

- ✅ Privacy: User hanya melihat data mereka sendiri
- ✅ Admin: Memiliki akses penuh untuk monitoring
- ✅ Otomatis: Muroja'ah dan task otomatis ke kalender
- ✅ Tracking: Semua aktivitas tercatat dengan timestamp
- ✅ Responsive: UI mobile-friendly untuk semua fitur
