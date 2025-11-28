# Setup & Implementation Guide - Kanban Task Management Feature

## ✅ Implementasi Selesai

Fitur Kanban Task Management telah berhasil diintegrasikan ke dalam aplikasi dengan lengkap.

## 📦 File yang Ditambahkan

### Database Schema
- `schema.sql` - Updated dengan 3 tabel baru:
  - `kanban_tasks` - Menyimpan data tasks
  - `asisten_requests` - Menyimpan permintaan untuk menjadi asisten
  - `user_role_history` - Menyimpan riwayat perubahan role

### API Endpoints
```
src/routes/api/kanban/
├── +server.ts          [GET, POST tasks]
└── [id]/+server.ts     [GET, PATCH, DELETE single task]

src/routes/api/asisten-requests/
├── +server.ts          [GET requests, POST new request]
└── [id]/+server.ts     [PATCH approve/reject]
```

### Frontend Components
```
src/lib/components/
├── KanbanBoard.svelte           - Main kanban board dengan drag-drop
├── TaskModal.svelte             - Form create/edit task
└── AsistenRequestsList.svelte   - List & manage asisten requests
```

### Pages
```
src/routes/dashboard/
├── kanban-tugas/
│   ├── +page.server.ts          - Load data untuk kanban
│   └── +page.svelte             - UI dashboard kanban
└── request-asisten/
    ├── +page.server.ts          - Load status request
    └── +page.svelte             - UI form request asisten
```

### Dashboard Updates
- `src/routes/dashboard/+page.svelte` - Updated untuk menampilkan link kanban & request asisten
- `src/routes/dashboard/+page.server.ts` - Updated untuk support role asisten

### Documentation
- `KANBAN_FEATURES.md` - Dokumentasi lengkap fitur

## 🚀 Cara Menggunakan Fitur

### 1. Admin - Akses Kanban Dashboard

**URL**: `/dashboard/kanban-tugas`

**Fitur**:
- Buat task baru
- Edit existing tasks
- Hapus tasks
- Drag-drop tasks antar status (todo → in_progress → review → done)
- Manage asisten requests (approve/reject)

**Cara**:
1. Login sebagai admin
2. Di dashboard, klik "Task Kanban" atau direct ke `/dashboard/kanban-tugas`
3. Gunakan tombol "Create New Task" untuk buat task baru
4. Isi form (title wajib, sisanya optional)
5. Drag task untuk ubah status
6. Klik icon "✕" untuk delete task

### 2. Asisten - Akses Kanban Dashboard

**URL**: `/dashboard/kanban-tugas`

**Same access as admin**, tapi:
- Tidak bisa melihat tab "Asisten Requests"
- Bisa create/edit/delete tasks sama seperti admin

### 3. Santri/Ustadz - Request Menjadi Asisten

**URL**: `/dashboard/request-asisten`

**Proses**:
1. Login sebagai santri atau ustadz
2. Di dashboard, klik "Jadilah Asisten" atau go to `/dashboard/request-asisten`
3. Baca informasi tentang role asisten
4. Klik "Submit Request"
5. Tunggu admin menyetujui
6. Setelah disetujui, role akan berubah menjadi "asisten"

### 4. Admin - Approve Asisten Request

**Di halaman**: `/dashboard/kanban-tugas`

**Proses**:
1. Klik tab "Asisten Requests"
2. Lihat list pending requests
3. Klik "✓ Approve" untuk approve atau "✗ Reject" untuk reject
4. User akan notified dan role updated

## 🔐 Security & Access Control

### Role-Based Access

```
┌─────────┬──────────┬──────────┬────────────┐
│ Role    │ Kanban   │ Request  │ Approve    │
├─────────┼──────────┼──────────┼────────────┤
│ Admin   │ ✓ Akses  │ Lihat    │ ✓ Bisa     │
│ Asisten │ ✓ Akses  │ Tidak    │ Tidak      │
│ Ustadz  │ ✗        │ ✓ Bisa   │ Tidak      │
│ Santri  │ ✗        │ ✓ Bisa   │ Tidak      │
└─────────┴──────────┴──────────┴────────────┘
```

### API Protection
- Semua endpoint require authenticated session
- Role checking di setiap endpoint
- Proper error messages (401, 403)

## 📊 Database Structure

### kanban_tasks
```sql
id: UUID                     -- Primary key
title: string               -- Task title (required)
description: string         -- Task description (optional)
status: enum               -- todo|in_progress|review|done
assigned_to: UUID          -- Assign ke user (optional)
created_by: UUID           -- Pembuat task (required)
priority: enum             -- low|medium|high|urgent
due_date: date             -- Deadline (optional)
created_at: timestamp
updated_at: timestamp
```

### asisten_requests
```sql
id: UUID                   -- Primary key
user_id: UUID              -- User yang request
requested_at: timestamp    -- Kapan request dibuat
approved_at: timestamp     -- Kapan di-approve (nullable)
approved_by: UUID          -- Admin yang approve (nullable)
status: enum               -- pending|approved|rejected
reason: string             -- Alasan (optional)
```

### user_role_history
```sql
id: UUID                   -- Primary key
user_id: UUID              -- User yang rolenya berubah
old_role: string           -- Role sebelumnya
new_role: string           -- Role baru
changed_by: UUID           -- Admin yang ubah (nullable)
changed_at: timestamp      -- Kapan diubah
```

## 🧪 Testing

### Test Admin Flow
1. Login as admin
2. Go to `/dashboard/kanban-tugas`
3. Create a new task:
   - Title: "Test Task"
   - Priority: High
   - Due Date: Tomorrow
4. Verify task appears di "To Do" column
5. Drag task ke "In Progress"
6. Verify status updated
7. Delete task dan confirm

### Test Asisten Flow
1. Create user with role "santri" or "ustadz"
2. Login as that user
3. Go to `/dashboard/request-asisten`
4. Click "Submit Request"
5. Login as admin in another session
6. Go to `/dashboard/kanban-tugas`
7. Click "Asisten Requests" tab
8. Approve the request
9. Logout admin, login previous user
10. Go to `/dashboard` → should see kanban link now
11. Access kanban dashboard

### Test API Directly
```bash
# Get all tasks (as admin/asisten)
curl -H "Cookie: sessionid=YOUR_SESSION" \
  https://your-app/api/kanban

# Create task
curl -X POST -H "Cookie: sessionid=YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Task","priority":"high"}' \
  https://your-app/api/kanban

# Update task status
curl -X PATCH -H "Cookie: sessionid=YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}' \
  https://your-app/api/kanban/TASK_ID

# Get asisten requests (admin only)
curl -H "Cookie: sessionid=YOUR_SESSION" \
  https://your-app/api/asisten-requests

# Approve request
curl -X PATCH -H "Cookie: sessionid=YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve"}' \
  https://your-app/api/asisten-requests/REQUEST_ID
```

## 🐛 Troubleshooting

### Task tidak muncul di kanban
**Solusi**: 
- Pastikan user punya role admin atau asisten
- Check browser console untuk error messages
- Verify database punya tabel kanban_tasks

### Drag-drop tidak bekerja
**Solusi**:
- Gunakan browser yang support HTML5 Drag & Drop
- Refresh halaman
- Check console untuk JavaScript errors

### API returns 403 Unauthorized
**Solusi**:
- Verify sudah login
- Verify user role adalah admin atau asisten
- Check session cookie

### Task tidak bisa dihapus
**Solusi**:
- Only admin & asisten can delete
- Cek role di users table
- Try refresh page

## 📝 Notes

- Task kanban HANYA bisa dilihat admin & asisten
- Santri & ustadz tidak ada akses ke kanban dashboard
- Drag-drop update immediate ke database
- Setiap perubahan di-log di timestamp updated_at
- Role change history di-track di user_role_history table

## 🎉 Next Steps

Fitur sudah siap digunakan! Untuk future enhancements:
- [ ] Task comments
- [ ] Notifications untuk assigned tasks
- [ ] Task templates
- [ ] Recurring tasks
- [ ] Advanced filters
- [ ] Export tasks (CSV, PDF)
- [ ] Audit logs
- [ ] Real-time collab editing

---

**Last Updated**: 2024
**Status**: ✅ Complete & Ready for Production
