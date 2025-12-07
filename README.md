# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
# app

## Sistem yang digunakan (Tech Stack)

Berikut adalah sistem/teknologi yang ada di dalam proyek ini dan yang digunakan:

- Framework UI: Svelte 5 + SvelteKit
- Bundler & Dev Server: Vite
- Bahasa: TypeScript
- Styling: Tailwind CSS + DaisyUI
- PWA: @vite-pwa/sveltekit (untuk installable app/ikon, offline cache dasar)
- Adapter & Hosting: @sveltejs/adapter-cloudflare (target Cloudflare Pages/Workers)
- CLI Deploy: Wrangler (npx wrangler)
- Autentikasi: Lucia + @lucia-auth/adapter-sqlite (SQLite)
- OAuth Provider helper: Arctic (opsional untuk login sosial)
- Utilitas tanggal/crypto: Oslo, scrypt-js
- PDF: pdf-lib (generate/manipulasi PDF)
- Lint & Format: ESLint + Prettier
- Database lokal: SQLite (file: tahfidz.db) dan contoh skema di schema.sql

## Cara pakai (ringkas)

- Install dependency: `npm install`
- Jalankan dev server: `npm run dev` (opsional otomatis buka tab: `npm run dev -- --open`)
- Build produksi: `npm run build`
- Preview hasil build: `npm run preview`
- Deploy ke Cloudflare Pages: `npm run deploy:pages`

Catatan:
- Konfigurasi Tailwind ada di `tailwind.config.ts`, PWA di `vite.config.ts` (plugin) dan `twa-manifest.json` untuk WebAPK/TWA.
- File database/seed: `tahfidz.db`, `tahlil_data.sql`, `schema.sql`.
