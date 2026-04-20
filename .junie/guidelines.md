# GUIDELINES.md — Aturan Developer & Codex SantriOnline

## Bahasa

- Gunakan Bahasa Indonesia santai tapi sopan untuk penjelasan.
- Gunakan Bahasa Inggris hanya untuk istilah teknis yang memang umum dipakai.
- Semua komentar kode tulis dalam Bahasa Indonesia.

---

## Scope Produk

Default kerja saat ini adalah:

**TPQ-ONLY MODE**

Artinya:

- Fitur baru harus berfokus pada TPQ.
- Contoh data, copywriting, dan alur utama harus memakai konteks TPQ, santri, ustadz, hafalan, setoran, halaqoh, dan sertifikat.
- Route atau modul non-TPQ yang masih ada di repo anggap sebagai legacy surface, bukan arah produk utama.

JANGAN menambah atau mengembangkan fitur baru untuk:

- masjid
- musholla
- kas masjid
- zakat/infaq komunitas
- jamaah komunitas

Jika menyentuh area legacy, batasi untuk:

- bugfix kecil
- kompatibilitas
- dokumentasi penanda bahwa area tersebut legacy

Referensi utama:

- `migrations/0014_tpq_only_cleanup.sql`
- `src/lib/config/institutions.ts`
- `STARTING_POINT.md`
- `CHANGES.md`

---

## Stack Teknologi

Wajib ikuti stack yang sudah dipakai repo:

- Frontend: Svelte 5 + SvelteKit
- Runtime/deploy: Cloudflare Pages/Workers
- Database: Cloudflare D1
- Storage file: Cloudflare R2
- Styling: Tailwind CSS + DaisyUI
- Tooling: Vite + TypeScript

Folder `src-tauri/` ada untuk companion desktop app, tetapi source of truth aplikasi tetap web app SvelteKit.

JANGAN gunakan untuk fitur baru:

- React
- Express
- Prisma
- Supabase

---

## Role Aktif

Role yang relevan untuk mode TPQ:

- `SUPER_ADMIN`
- `admin`
- `koordinator`
- `ustadz`
- `ustadzah`
- `santri`
- `alumni`

Catatan:

- `ustadz` dan `ustadzah` tetap ada di data/permission.
- Pada beberapa flow UI, penentuan `ustadz` vs `ustadzah` mengikuti gender pengguna.
- Role komunitas seperti `jamaah`, `tamir`, dan `bendahara` masih ada di codebase legacy, tetapi bukan fokus kerja baru.

---

## Arsitektur & Data Scope

Aturan paling penting:

- Semua query tenant wajib di-scope dengan `org_id` atau `institution_id`.
- Jangan pernah membuat query lintas lembaga tanpa alasan yang jelas.
- `SELECT`, `UPDATE`, dan `DELETE` terhadap data user/lembaga tidak boleh dibiarkan global, kecuali untuk `SUPER_ADMIN`, migration, atau maintenance yang memang eksplisit.

Pola yang harus diikuti:

- Wajib cek login dengan helper seperti `assertLoggedIn(...)`.
- Wajib cek membership lembaga dengan `assertOrgMember(...)`.
- Ambil profil lembaga via `getOrganizationById(...)` sebelum menjalankan logic bisnis utama.
- Pastikan status lembaga dan status akun organisasi aktif bila flow memang bersifat operasional.
- Untuk workflow TPQ akademik, gunakan `requireTpqAcademicContext(...)` sebagai pintu masuk utama.

Validasi input:

- ID eksternal/scoped ID validasi dengan `assertSafeScopedId(...)`.
- Teks bebas sanitasi dengan `sanitizePlainText(...)` atau `sanitizeOptionalNotes(...)`.
- Rentang tanggal panjang validasi dengan helper yang sudah ada, jangan bikin parsing baru sembarangan.

---

## Workflow TPQ Akademik

Route final yang jadi acuan:

- `/tpq/akademik/setoran`
- `/tpq/akademik/review`
- `/tpq/akademik/riwayat`

Aturan akses:

- Input setoran: `admin`, `ustadz`, `ustadzah`
- Review setoran: `admin`, `koordinator`
- Riwayat setoran: `admin`, `koordinator`, `ustadz`, `ustadzah`, `santri`, `alumni`

Status setoran:

- `submitted`
- `approved`
- `rejected`

Jenis setoran:

- `hafalan`
- `murojaah`

Kualitas:

- `lancar`
- `cukup`
- `belum`

Catatan penting:

- Route lama `/dashboard/setoran-hari-ini` dan `/dashboard/review-setoran` hanya shortcut yang me-redirect ke route TPQ akademik final.
- Saat setoran `hafalan` berubah menjadi `approved`, progres hafalan disinkronkan ke `hafalan_progress`.

---

## Cloudflare Bindings

Binding yang perlu dipahami saat mengerjakan integrasi server:

- `DB`
- `BUCKET`
- `R2_PUBLIC_BASE_URL`
- `VECTORIZE_INDEX`
- `AI`

Gunakan helper yang sudah ada di `src/lib/server/cloudflare.ts` untuk akses D1/R2. Jangan mengulang logic binding secara manual bila helper sudah cukup.

---

## Dokumentasi & Output

- Pakai nama role dan route yang benar-benar ada di kode.
- Jika menulis dokumentasi TPQ-only, jelaskan bahwa beberapa route non-TPQ mungkin masih ada sebagai legacy.
- Jangan menyederhanakan dokumentasi sampai menghilangkan route kanonis, permission, atau catatan storage yang penting.
- Berikan kode lengkap, bukan potongan yang memaksa user menebak bagian sisanya.

