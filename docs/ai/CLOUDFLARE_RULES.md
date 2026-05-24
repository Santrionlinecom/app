# Cloudflare Rules

## Binding

SantriOnline memakai Cloudflare Pages dengan binding seperti D1, R2, dan Vectorize. Binding aktif harus dibaca dari konfigurasi yang ada, tetapi `wrangler.toml` tidak boleh diubah kecuali diminta eksplisit.

## D1

- Jangan ubah schema tanpa migration yang jelas.
- Bedakan tabel yang migration-backed dengan tabel yang dibuat melalui runtime ensure.
- Query produksi harus org-scoped dan role-aware.
- Hindari migration remote sebelum skema lokal dan review siap.

## R2

- Upload dan download file harus memakai auth dan scope yang sesuai.
- Jangan membuka object path publik tanpa kebutuhan produk yang jelas.
- Validasi ukuran, tipe file, dan ownership.

## Vectorize / AI

- Index dan query vector harus punya kontrol biaya.
- Gunakan cache atau quota untuk flow yang sering dipanggil.
- Simpan metadata yang cukup untuk audit, tetapi hindari menyimpan konten sensitif tanpa kebutuhan.

## Deployment

- Jalankan `npm run check` dan `npm run build` sebelum release.
- Jangan melakukan remote deploy dari task coding biasa kecuali diminta eksplisit.
