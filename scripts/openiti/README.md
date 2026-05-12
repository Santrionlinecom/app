# OpenITI Local Importer

Pipeline ini membaca file teks OpenITI lokal, membersihkan markup dasar, lalu membuat JSON chunk yang siap diimpor ke referensi kitab production.

Dataset OpenITI tidak disimpan di repo ini. Simpan corpus di luar project, misalnya:

```bash
~/datasets/openiti
```

## Cara Pakai

Jalankan parser untuk satu file:

```bash
npm run openiti:parse -- \
  --input ~/datasets/openiti/sample/arbain-nawawi.txt \
  --output data/kitab/openiti/chunks/arbain-nawawi.openiti.chunks.json \
  --kitabSlug arbain-nawawi-openiti \
  --title "Al-Arba'in An-Nawawiyyah" \
  --author "Imam An-Nawawi" \
  --category "Hadits" \
  --madhhab "Syafi'i"
```

Atau gunakan mapping JSON:

```bash
npm run openiti:parse -- --mapping scripts/openiti/openiti-books.sample.json
```

Output dibuat sebagai JSON array di path `output`. Folder `data/kitab/openiti/chunks/` hanya disiapkan sebagai tujuan output kecil lokal; jangan commit dataset atau hasil chunk besar tanpa review.

## Import ke Production

Setelah JSON chunk selesai dibuat, super admin bisa membuka Pusat Konten > Perpustakaan Kitab dan memakai tombol `Import OpenITI JSON`.

Importer production:

- menerima JSON array hasil parser ini,
- menyimpan chunk ke D1 `kitab_referensi`,
- mengirim embedding ke Vectorize,
- memakai ID stabil per `kitabSlug + chunkIndex`, sehingga re-import file yang sama akan memperbarui chunk lama tanpa menggandakan referensi.

## Format Output

Setiap chunk berisi metadata kitab, posisi chunk, teks Arab, dan catatan sumber:

```json
{
  "kitabSlug": "arbain-nawawi-openiti",
  "title": "Al-Arba'in An-Nawawiyyah",
  "author": "Imam An-Nawawi",
  "category": "Hadits",
  "madhhab": "Syafi'i",
  "sourceType": "openiti",
  "sourceNote": "Sumber teks: OpenITI corpus. Perlu verifikasi ulang dengan edisi cetak.",
  "chunkIndex": 1,
  "chapter": "Nama Bab",
  "sectionTitle": "Nama Bagian",
  "pageNumber": null,
  "arabicText": "Teks Arab chunk",
  "translationText": null,
  "explanationText": null,
  "chunkText": "Teks Arab chunk",
  "sourceRef": "Al-Arba'in An-Nawawiyyah, Nama Bab, chunk 1"
}
```

## Catatan

- Parser ini hanya local tooling. Belum ada AI, belum ada Vectorize, dan belum ada OCR.
- OpenITI menggunakan lisensi CC BY-NC-SA 4.0. Pastikan atribusi dan batas penggunaan non-komersial dipatuhi.
- Teks hasil parse harus diverifikasi ulang dengan edisi cetak atau sumber mu'tabar sebelum dipakai publik.
- Parser ini tidak mengimpor seluruh OpenITI secara otomatis; import production tetap dilakukan sadar oleh super admin.
