# SantriOnline Project Context

SantriOnline adalah aplikasi manajemen lembaga Islam dengan fokus utama TPQ akademik. Produk berjalan di SvelteKit, TailwindCSS, Cloudflare Pages, Cloudflare D1, Cloudflare R2, dan Cloudflare Vectorize.

## Prioritas Produk

1. TPQ akademik sebagai core product.
2. Dashboard TPQ satu pintu untuk admin, koordinator, ustadz, santri, dan wali.
3. Shortlink sebagai kanal monetisasi media/traffic.
4. Digital store, buku, coin, dan royalti sebagai produk digital.
5. Kitab AI/RAG hanya setelah quota, cache, citation, dan audit biaya jelas.

## Route Penting

- `/dashboard`
- `/tpq/akademik`
- `/tpq/akademik/setoran`
- `/tpq/akademik/review`
- `/tpq/akademik/riwayat`
- `/tpq/rapor`
- `/tpq/sertifikat`
- `/jadwal`
- `/kitab`
- `/admin/shortlinks`
- `/digital-store`
- `/buku`
- `/coins`

## Batasan Kerja

- Jangan sentuh `wrangler.toml` tanpa permintaan eksplisit.
- Jangan sentuh file `.save`, `.bak`, atau backup.
- Jangan ubah schema tanpa migration dan alasan jelas.
- Jangan menambah endpoint AI mahal tanpa auth, rate limit, cache bila relevan, dan audit log.
- Semua query lembaga wajib org-scoped dan role-aware.
