# Coding Rules

## Prinsip Umum

- Ikuti pola SvelteKit yang sudah ada di repo.
- Utamakan perubahan kecil, jelas, dan mudah diverifikasi.
- Jangan refactor besar kecuali diminta.
- Jangan menambah dependency baru tanpa alasan kuat.
- Jangan memakai `git add .`.

## SvelteKit

- Jangan ubah `+layout.server.ts`, `+page.server.ts`, atau endpoint server tanpa membaca boundary auth dan org-scope.
- Route alias lama sebaiknya redirect server-side, bukan UI baru.
- UI boleh dirapikan, tetapi jangan memindahkan logic server ke client.
- Form dan action harus tetap mempertahankan validasi server-side.

## Data

- Query data lembaga harus memakai `org_id`, `institution_id`, atau scope setara.
- Role harus dinormalisasi sebelum dipakai untuk keputusan akses.
- Jangan membuat tabel runtime baru kecuali pola repo memang memakainya dan risikonya dipahami.
- Migration harus sinkron dengan dokumentasi bila schema berubah.

## Validasi

Setelah perubahan:

1. Jalankan `npm run check`.
2. Jalankan `npm run build`.
3. Laporkan warning yang relevan, bukan hanya error.
