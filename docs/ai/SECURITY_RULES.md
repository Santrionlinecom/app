# Security Rules

## Auth dan RBAC

- Semua endpoint sensitif wajib memeriksa session.
- Semua akses data lembaga wajib org-scoped.
- Role check harus eksplisit untuk admin, superadmin, koordinator, ustadz/ustadzah, santri, wali, dan role lain yang relevan.
- Jangan mengandalkan UI untuk menyembunyikan akses; server tetap harus mengunci akses.

## Endpoint Sensitif

Endpoint seperti migration, seed, generator AI, upload, pembayaran, export data, dan admin utilities wajib memiliki:

- Auth check.
- Role boundary.
- Org scope bila menyentuh data lembaga.
- Rate limit bila berpotensi mahal atau bisa diabuse.
- Audit log untuk aksi penting.

## AI dan Biaya

- Jangan menambah endpoint AI baru tanpa batas input, rate limit, dan audit biaya.
- Jangan menyimpan prompt/user question sensitif secara mentah di log.
- Untuk RAG, jawaban harus bisa ditelusuri ke citation atau source id.

## Secrets

- Jangan commit token, API key, secret, atau credential.
- Jangan print secret ke log.
- Jangan mengubah Cloudflare binding tanpa instruksi eksplisit.
