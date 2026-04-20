# SantriOnline TPQ

SantriOnline adalah aplikasi manajemen TPQ berbasis SvelteKit untuk mengelola santri, hafalan, setoran, halaqoh, sertifikat, dan konten pendukung. Repo ini masih menyimpan beberapa route legacy non-TPQ, tetapi arah pengembangan aktif sekarang berfokus pada **TPQ-only mode**.

## Stack

- Svelte 5 + SvelteKit
- TypeScript + Vite
- Tailwind CSS + DaisyUI
- Cloudflare Pages/Workers
- Cloudflare D1
- Cloudflare R2
- Lucia Auth + Arctic
- pdf-lib untuk sertifikat PDF
- Wrangler untuk deploy dan resource Cloudflare

Folder `src-tauri/` tersedia untuk companion desktop app, tetapi aplikasi web tetap source of truth utama.

## Fitur Utama

- Dashboard role-based untuk `admin`, `koordinator`, `ustadz`, `ustadzah`, `santri`, dan `alumni`
- Hafalan mandiri di `/dashboard/hafalan-mandiri`
- Workflow TPQ akademik di `/tpq/akademik/setoran`, `/tpq/akademik/review`, dan `/tpq/akademik/riwayat`
- Pencapaian hafalan dan statistik progres
- Penerbitan sertifikat PDF yang disimpan ke R2
- Halaman publik TPQ dan alur pendaftaran lembaga
- CMS/blog dan beberapa modul konten islami

## Menjalankan Project

```bash
npm install
npm run dev
```

Command penting lain:

```bash
npm run check
npm run build
npm run preview
npm run deploy:pages
```

## Cloudflare Bindings

Project ini memakai binding berikut di `wrangler.toml`:

- `DB` untuk Cloudflare D1
- `BUCKET` untuk Cloudflare R2
- `R2_PUBLIC_BASE_URL` untuk base URL file publik
- `VECTORIZE_INDEX` untuk Vectorize
- `AI` untuk Cloudflare AI binding

Command utilitas:

```bash
export CLOUDFLARE_API_TOKEN=xxxxx

npm run cf:whoami
npm run cf:d1:list
npm run cf:r2:list
npm run cf:d1:migrate:remote
```

Endpoint pengecekan binding:

- `GET /api/admin/cloudflare`

## Catatan Arsitektur

- Semua data tenant harus di-scope dengan `org_id` atau `institution_id`.
- Route kanonis workflow TPQ adalah `/tpq/akademik/*`.
- Route lama seperti `/dashboard/setoran-hari-ini` dan `/dashboard/review-setoran` hanya wrapper redirect.
- Sertifikat disimpan di R2, metadata-nya ada di D1.
- Jika menambah fitur baru, prioritaskan konteks TPQ dan hindari memperluas modul legacy non-TPQ.
