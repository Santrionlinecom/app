# CLAUDE.md - SantriOnline Context

You are working on app.santrionline.com.

This is a SvelteKit + Cloudflare application for Islamic education institutions, especially TPQ.

Current priority:

- Keep TPQ academic flow clean.
- Preserve org-scoped and role-aware access.
- Avoid touching Cloudflare config unless explicitly requested.
- Avoid schema changes unless strictly necessary.
- Always run check and build before suggesting commit.

Important routes:

- `/dashboard`
- `/tpq/akademik`
- `/tpq/akademik/setoran`
- `/tpq/akademik/review`
- `/tpq/akademik/riwayat`
- `/kitab`
- `/admin/shortlinks`
- `/digital-store`
- `/buku`
- `/coins`

Important warnings:

- `wrangler.toml` may contain existing local changes. Do not touch it unless requested.
- `src/routes/sentry-test/+page.svelte.save` may be untracked backup. Do not include it in commits.
