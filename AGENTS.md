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

## Migration Rules

Semua migration berada di:

```text
/migrations