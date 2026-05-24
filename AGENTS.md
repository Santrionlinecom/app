# AGENTS.md - SantriOnline AI Developer Rules

## Project Identity

SantriOnline App adalah platform manajemen TPQ/lembaga Islam berbasis SvelteKit + TailwindCSS + Cloudflare Pages + D1 + R2 + Vectorize.

## Core Stack

- SvelteKit
- TailwindCSS
- Cloudflare Pages
- Cloudflare D1
- Cloudflare R2
- Cloudflare Vectorize
- Lucia/session auth
- Role-based access control

## Hard Rules

1. Jangan mengubah `wrangler.toml` kecuali diminta eksplisit.
2. Jangan menyentuh file `.save`, `.bak`, atau backup.
3. Jangan mengubah skema database tanpa alasan jelas dan migration.
4. Jangan menambah endpoint AI mahal tanpa rate limit, auth, dan audit log.
5. Semua endpoint sensitif wajib role-aware dan org-scoped.
6. Jangan pakai `git add .` dalam instruksi commit.
7. Setelah perubahan wajib jalankan:
   - `npm run check`
   - `npm run build`

## Product Priority

Prioritas saat ini:

1. TPQ akademik canonical flow.
2. Dashboard TPQ satu pintu.
3. Shortlink monetization.
4. Digital store dan buku/coin.
5. Kitab AI/RAG dengan guardrail biaya.

## Output Format

Setiap selesai task, berikan:

- Ringkasan file diubah
- Dampak fitur
- Risiko tersisa
- Hasil check/build
- Saran commit message
