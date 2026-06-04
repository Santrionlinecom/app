# AGENTS.md - SantriOnline AI Developer Rules

## Project Identity

SantriOnline App adalah platform manajemen TPQ, pesantren, masjid, lembaga Islam, digital store, shortlink, dan AI kitab berbasis:

- SvelteKit
- TailwindCSS
- Cloudflare Pages
- Cloudflare Workers
- Cloudflare D1
- Cloudflare R2
- Cloudflare Vectorize
- Lucia/session auth
- Role-based access control
- Organization-scoped multi-tenant system

SantriOnline harus dibangun dengan prinsip:

- Hemat biaya
- Serverless-first
- Offline-friendly jika memungkinkan
- Aman untuk data lembaga
- Mudah dikembangkan solo developer
- Siap naik skala bertahap
- Tidak over-engineering

---

## Core Stack

- Frontend: SvelteKit + TailwindCSS
- Backend: SvelteKit server routes / Cloudflare Workers
- Database utama: Cloudflare D1
- File storage: Cloudflare R2
- AI semantic search: Cloudflare Vectorize
- Auth: Lucia/session auth
- Access control: role-based dan organization-scoped
- Deployment: Cloudflare Pages
- Config: wrangler.toml

---

## Current Product Priority

Prioritas pengembangan saat ini:

1. TPQ academic canonical flow
2. Dashboard TPQ satu pintu
3. Santri Learn / modul belajar
4. Shortlink monetization
5. Digital store, buku, coin, dan lisensi
6. Payment order dan aktivasi produk
7. Kitab AI/RAG dengan guardrail biaya
8. WhatsApp/email notification integration
9. CMS dakwah/news dengan AI assist

Jangan menambah fitur baru di luar prioritas ini kecuali diminta eksplisit.

---

## Hard Rules

1. Jangan mengubah `wrangler.toml` kecuali diminta eksplisit.
2. Jangan menyentuh file `.save`, `.bak`, `.backup`, atau folder arsip.
3. Jangan menyentuh `.env`, `.env.local`, secret, token, private key, atau credential.
4. Jangan mengubah skema database tanpa alasan jelas dan migration.
5. Jangan edit migration lama yang sudah diterapkan ke remote/production.
6. Jika migration sudah dipush atau sudah diterapkan remote, buat migration baru.
7. Jangan membuat migration baru jika cukup memperbaiki migration yang belum diterapkan.
8. Jangan melakukan `DROP TABLE`, `DROP COLUMN`, delete massal, atau destructive query tanpa izin eksplisit.
9. Jangan menambah endpoint AI mahal tanpa auth, rate limit, audit log, dan batas biaya.
10. Semua endpoint sensitif wajib role-aware dan organization-scoped.
11. Jangan pakai `git add .`.
12. Jangan melakukan commit atau push kecuali diminta eksplisit.
13. Jangan refactor besar tanpa persetujuan.
14. Jangan mengubah banyak file hanya untuk perbaikan kecil.
15. Jangan membuat dependency baru tanpa alasan kuat.
16. Jangan menyimpan file besar, base64, PDF, gambar, audio, atau video di D1.
17. File besar harus masuk R2, D1 hanya menyimpan metadata/path/status.
18. Untuk pencarian AI/semantic, gunakan Vectorize atau desain RAG yang hemat biaya.
19. Jangan scan seluruh repo jika task hanya menyentuh area tertentu.
20. Selalu jelaskan risiko jika perubahan menyentuh database, auth, payment, atau permission.

---

## Database Rules

Cloudflare D1 adalah database utama untuk data terstruktur.

D1 cocok untuk:

- users
- sessions
- organizations
- roles
- permissions
- santri
- ustadz/guru
- kelas
- hafalan
- setoran
- raport
- products
- licenses
- payment_orders
- article metadata
- kitab metadata
- AI generation logs ringan

D1 tidak boleh digunakan untuk:

- PDF kitab mentah
- file audio TTS
- video
- gambar besar
- base64 file
- dump HTML besar
- log AI panjang tanpa batas

Gunakan R2 untuk file besar.

Gunakan Vectorize untuk embedding dan pencarian semantik.

Gunakan index untuk kolom yang sering dipakai:

- `WHERE`
- `JOIN`
- `ORDER BY`
- `organization_id`
- `user_id`
- `status`
- `created_at`
- `slug`
- `email`
- `product_id`
- `license_id`

---

## Role System (Updated 2026-06-04)

SantriOnline menggunakan **simplified role-based access control (RBAC)** dengan struktur hierarki:

### Platform Roles (Global)
- `SUPER_ADMIN` - Akses penuh ke seluruh sistem
- `support` - Tim support platform
- `auditor` - Audit dan monitoring sistem

### Organization Roles (Universal)

**Role Levels:**
- Level 3 (Admin): `admin`, `kepala`, `bendahara`
- Level 2 (Manager): `pembimbing`, `operator`, `sekretaris`, `humas`, `kurikulum`, `pembina`
- Level 1 (Staff): `pengajar`, `takmir`, `imam`, `khotib`, `muadzin`
- Level 0 (Member): `santri`, `wali`, `alumni`, `jamaah`

**Simplified Roles:**
- `admin` - Administrator organisasi (full access)
- `kepala` - Kepala/Pimpinan (merge: kepala_tpq, kepala_tahfidz, pengasuh, ketua_takmir)
- `pengajar` - Pengajar (merge: ustadz, ustadzah - gender di user profile)
- `pembimbing` - Pembimbing (merge: musyrif, koordinator, wali_kelas)
- `operator` - Operator data
- `bendahara` - Pengelola keuangan
- `sekretaris` - Administrasi dan dokumentasi
- `humas` - Public relations dan media sosial
- `kurikulum` - Pengembangan program pembelajaran
- `pembina` - Pembinaan karakter dan kedisiplinan
- `santri` - Siswa/Santri
- `wali` - Wali santri/orang tua
- `alumni` - Alumni (pondok, rumah-tahfidz)
- `jamaah` - Jamaah (masjid, musholla)
- `takmir` - Takmir (masjid, musholla)
- `imam` - Imam sholat (masjid, musholla)
- `khotib` - Khotib Jumat (masjid, musholla)
- `muadzin` - Muadzin (masjid, musholla)

### Permission System

**Wildcard Support:**
```typescript
'hafalan.*'  // semua akses hafalan
'finance.*'  // semua akses keuangan
'org.*'      // semua akses organisasi
```

**Scope-based Permissions:**
```typescript
'student.read.own'   // hanya santri sendiri
'student.read.class' // satu kelas
'student.read.all'   // semua santri
```

**Multi-role Support:**
- User bisa memiliki `secondary_roles` (JSON array)
- Temporary role dengan `role_expires_at`
- Role delegation untuk temporary permissions

### Legacy Role Mapping

Migration otomatis dari role lama ke role baru:
- `ustadz`, `ustadzah` → `pengajar`
- `kepala_tpq`, `kepala_tahfidz`, `pengasuh`, `ketua_takmir` → `kepala`
- `koordinator`, `wali_kelas`, `musyrif` → `pembimbing`

**Helper Functions:**
```typescript
import { normalizeRole, isRole, isTeachingRole } from '$lib/utils/role-helpers';

// Normalize legacy role
const role = normalizeRole('ustadz'); // returns 'pengajar'

// Check role (handles legacy)
if (isRole(user.role, 'ustadz')) { } // works with both 'ustadz' and 'pengajar'

// Check teaching role
if (isTeachingRole(user.role)) { } // true for pengajar, ustadz, ustadzah
```

### Role Assignment Rules

1. **Principle of Least Privilege** - Berikan permission minimal yang dibutuhkan
2. **Separation of Duties** - Hindari conflict of interest (e.g., bendahara tidak boleh jadi admin)
3. **Regular Review** - Audit role assignment setiap 6 bulan
4. **Time-bound Roles** - Gunakan `role_expires_at` untuk temporary assignment

### Audit & Compliance

Semua perubahan role dan penggunaan permission dicatat di:
- `user_role_history` - History perubahan role
- `permission_usage_logs` - Log penggunaan permission
- `role_delegations` - Delegasi permission temporary

---

## Migration Rules

Semua migration berada di:

```text
/migrations