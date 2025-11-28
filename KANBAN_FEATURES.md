# Fitur Kanban Task Management

## 📋 Deskripsi Fitur

Fitur Kanban Task Management adalah sistem manajemen tugas dengan visualisasi Kanban board yang mendukung drag-and-drop. Fitur ini dirancang untuk memudahkan admin dan asisten dalam mengelola tugas-tugas yang perlu dilakukan.

## 🎯 Tujuan Utama

1. **Admin & Asisten** dapat membuat, mengedit, menghapus, dan mengorganisir tugas
2. **Drag-and-drop** untuk memindahkan tugas antar status
3. **Role Asisten** yang dapat diminta oleh santri atau ustadz dengan persetujuan admin
4. **Kontrol Akses** yang ketat - hanya admin dan asisten yang bisa melihat dashboard kanban

## 🏗️ Struktur Database

### 1. Tabel: `kanban_tasks`
Menyimpan data tugas-tugas kanban

```sql
CREATE TABLE kanban_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  assigned_to TEXT REFERENCES users(id),
  created_by TEXT NOT NULL REFERENCES users(id),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TEXT,
  created_at INTEGER,
  updated_at INTEGER
);
```

**Kolom:**
- `id`: UUID unik untuk setiap task
- `title`: Judul tugas (required)
- `description`: Deskripsi detail tugas (optional)
- `status`: Status tugas (todo, in_progress, review, done)
- `assigned_to`: User ID yang ditugaskan (optional)
- `created_by`: User ID pembuat tugas (required)
- `priority`: Prioritas tugas (low, medium, high, urgent)
- `due_date`: Tanggal deadline (optional)
- `created_at`: Timestamp pembuatan
- `updated_at`: Timestamp perubahan terakhir

### 2. Tabel: `asisten_requests`
Menyimpan permintaan untuk menjadi asisten

```sql
CREATE TABLE asisten_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  requested_at INTEGER NOT NULL,
  approved_at INTEGER,
  approved_by TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT
);
```

**Kolom:**
- `id`: UUID unik untuk setiap request
- `user_id`: User ID yang meminta
- `requested_at`: Timestamp permintaan
- `approved_at`: Timestamp persetujuan
- `approved_by`: User ID admin yang menyetujui
- `status`: Status permintaan (pending, approved, rejected)
- `reason`: Alasan permintaan

### 3. Tabel: `user_role_history`
Menyimpan riwayat perubahan role pengguna

```sql
CREATE TABLE user_role_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  old_role TEXT,
  new_role TEXT NOT NULL,
  changed_by TEXT REFERENCES users(id),
  changed_at INTEGER NOT NULL
);
```

## 🚀 API Endpoints

### Tasks

#### GET `/api/kanban`
Mengambil semua task kanban
- **Auth**: Admin, Asisten
- **Query Parameters**:
  - `status`: Filter by status (todo, in_progress, review, done)
- **Response**: Array of tasks

#### POST `/api/kanban`
Membuat task baru
- **Auth**: Admin, Asisten
- **Body**:
  ```json
  {
    "title": "Task Title",
    "description": "Optional description",
    "assigned_to": "user_id or null",
    "priority": "low|medium|high|urgent",
    "due_date": "YYYY-MM-DD or null"
  }
  ```
- **Response**: `{ id, message }`

#### GET `/api/kanban/[id]`
Mengambil task spesifik
- **Auth**: Admin, Asisten
- **Response**: Task object

#### PATCH `/api/kanban/[id]`
Mengupdate task (termasuk status untuk drag-drop)
- **Auth**: Admin, Asisten
- **Body**:
  ```json
  {
    "title": "Updated title",
    "description": "Updated description",
    "status": "todo|in_progress|review|done",
    "assigned_to": "user_id or null",
    "priority": "low|medium|high|urgent",
    "due_date": "YYYY-MM-DD or null"
  }
  ```
- **Response**: `{ message }`

#### DELETE `/api/kanban/[id]`
Menghapus task
- **Auth**: Admin, Asisten
- **Response**: `{ message }`

### Asisten Requests

#### GET `/api/asisten-requests`
Mengambil list permintaan asisten
- **Auth**: Admin only
- **Query Parameters**:
  - `status`: Filter by status (pending, approved, rejected)
- **Response**: Array of requests

#### POST `/api/asisten-requests`
Membuat permintaan menjadi asisten
- **Auth**: Authenticated (santri, ustadz)
- **Body**:
  ```json
  {
    "reason": "Alasan permintaan"
  }
  ```
- **Response**: `{ id, message }`

#### PATCH `/api/asisten-requests/[id]`
Menyetujui atau menolak permintaan asisten
- **Auth**: Admin only
- **Body**:
  ```json
  {
    "action": "approve|reject"
  }
  ```
- **Response**: `{ message }`

## 🎨 Frontend Components

### 1. `KanbanBoard.svelte`
Komponen utama kanban board dengan drag-and-drop

**Props**:
- `tasks`: Array of tasks
- `users`: Array of users untuk assignment
- `onStatusChange`: Callback saat status task berubah
- `onTaskSelect`: Callback saat task dipilih
- `onDeleteTask`: Callback saat task dihapus

**Features**:
- Drag-and-drop antar status
- Visual feedback dengan warna
- Priority badges
- Due date display
- Assigned user info

### 2. `TaskModal.svelte`
Modal untuk create/edit task

**Props**:
- `isOpen`: Boolean state modal
- `task`: Task object untuk edit (null untuk create)
- `users`: Array of users untuk assignment
- `onSave`: Callback saat save
- `onClose`: Callback saat close

**Features**:
- Create mode (kosong form)
- Edit mode (pre-filled form)
- Validation
- Loading state
- Error messages

### 3. `AsistenRequestsList.svelte`
Komponen list permintaan asisten

**Props**:
- `requests`: Array of asisten requests
- `onApprove`: Callback saat approve
- `onReject`: Callback saat reject

**Features**:
- Tampil user info
- Current role
- Request date
- Approve/Reject buttons

## 📄 Pages

### 1. `/dashboard/kanban-tugas`
Dashboard kanban task management

**Access**: Admin, Asisten only

**Features**:
- Display kanban board
- Create new task button
- Edit/delete tasks
- Tab untuk asisten requests (admin only)
- Manage asisten requests

### 2. `/dashboard/request-asisten`
Halaman untuk request menjadi asisten

**Access**: Santri, Ustadz (tidak admin/asisten)

**Features**:
- Display status existing request jika ada
- Submit request button
- Info tentang benefits menjadi asisten
- Step-by-step guide

## 🔐 Security & Permissions

### Role-Based Access Control

```
Admin:
  ✓ View kanban dashboard
  ✓ Create/Edit/Delete tasks
  ✓ View & manage asisten requests
  ✓ Approve/Reject asisten requests

Asisten:
  ✓ View kanban dashboard
  ✓ Create/Edit/Delete tasks
  ✓ Cannot manage asisten requests

Ustadz:
  ✗ Cannot view kanban
  ✓ Can request to become asisten

Santri:
  ✗ Cannot view kanban
  ✓ Can request to become asisten
```

### API Authentication
Semua endpoint dilindungi dengan:
1. Session-based authentication (Lucia)
2. Role-based authorization
3. Error handling dengan proper HTTP status codes

## 📊 Status Workflow

```
┌─────────┐
│   To    │
│   Do    │
└────┬────┘
     │ (drag)
     ▼
┌──────────────┐
│ In Progress  │
└────┬─────────┘
     │ (drag)
     ▼
┌─────────┐
│ Review  │
└────┬────┘
     │ (drag - approve)
     ▼
┌─────────┐
│  Done   │
└─────────┘
```

## 🎯 Prioritas Levels

```
Low      ◇ Tidak urgent
Medium   ◇ Standard
High     ◇ Penting
Urgent   ◇ Sangat penting & mendesak
```

## 💡 Cara Menggunakan

### Admin - Membuat Task Baru

1. Buka `/dashboard/kanban-tugas`
2. Klik "Create New Task"
3. Isi form:
   - Title (required)
   - Description (optional)
   - Priority (default: medium)
   - Due Date (optional)
   - Assign To (optional - user akan mendapat notifikasi)
4. Klik "Save Task"

### Admin - Drag-Drop Task

1. Di kanban board, drag task dari satu kolom
2. Drop ke kolom status yang dituju
3. Status akan otomatis terupdate

### Santri/Ustadz - Request Asisten

1. Buka `/dashboard/request-asisten`
2. Baca syarat dan ketentuan
3. Klik "Submit Request"
4. Tunggu persetujuan admin
5. Setelah disetujui, akan mendapat akses ke kanban dashboard

### Admin - Approve Asisten Request

1. Buka `/dashboard/kanban-tugas`
2. Klik tab "Asisten Requests"
3. Review list pending requests
4. Klik "Approve" atau "Reject"
5. User akan notified dan role akan terupdate

## 📝 Catatan Penting

- Task hanya bisa dilihat oleh admin dan asisten
- Santri dan ustadz tidak bisa melihat kanban tasks
- Drag-drop bekerja dengan real-time update ke database
- Setiap perubahan di-log di `updated_at` field
- Perubahan role dicatat di tabel `user_role_history`

## 🔧 Development Setup

Pastikan sudah:
1. Update schema database (sudah ada di `schema.sql`)
2. Restart aplikasi
3. Komponen dan API endpoints sudah terbentuk

## 🐛 Troubleshooting

### Task tidak muncul di kanban
- Pastikan user punya role 'admin' atau 'asisten'
- Check browser console untuk error messages

### Drag-drop tidak bekerja
- Pastikan browser support HTML5 Drag & Drop
- Refresh halaman jika perlu

### API returns 403 Unauthorized
- Pastikan sudah login
- Pastikan role adalah admin atau asisten

## 📚 File Structure

```
src/
├── routes/
│   ├── api/
│   │   ├── kanban/
│   │   │   ├── +server.ts (GET, POST)
│   │   │   └── [id]/
│   │   │       └── +server.ts (GET, PATCH, DELETE)
│   │   └── asisten-requests/
│   │       ├── +server.ts (GET, POST)
│   │       └── [id]/
│   │           └── +server.ts (PATCH)
│   └── dashboard/
│       ├── kanban-tugas/
│       │   ├── +page.server.ts
│       │   └── +page.svelte
│       └── request-asisten/
│           ├── +page.server.ts
│           └── +page.svelte
└── lib/
    └── components/
        ├── KanbanBoard.svelte
        ├── TaskModal.svelte
        └── AsistenRequestsList.svelte
```

## 🚀 Future Enhancements

- [ ] Task comments/notes
- [ ] Notifications untuk assigned tasks
- [ ] Task templates
- [ ] Recurring tasks
- [ ] Task filters (by priority, assignee, date range)
- [ ] Export tasks (CSV, PDF)
- [ ] Task history/audit log
- [ ] Collaborative editing
