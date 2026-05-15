# Import Asbabun Nuzul

Importer ini membaca JSON lokal dan memasukkan entry ke tabel `quran_asbab_entries`.

## Apply Migration Lokal

```bash
npx wrangler d1 execute DB --local --file=migrations/0033_quran_asbab.sql
```

## Import Sample Lokal

```bash
npm run asbab:import -- --input data/asbab/sample-asbab.json --local
```

## Apply Migration Remote

```bash
npx wrangler d1 execute DB --remote --file=migrations/0033_quran_asbab.sql
```

## Import Remote

```bash
npm run asbab:import -- --input data/asbab/sample-asbab.json --remote
```

## Format JSON

```json
[
  {
    "source_key": "lpmq_asbabun_nuzul",
    "surah_number": 2,
    "ayah_start": 142,
    "ayah_end": 150,
    "title": "Judul entry",
    "content": "Isi asbabun nuzul",
    "riwayat": "",
    "takhrij": "",
    "grade": "",
    "page_ref": "",
    "status": "draft"
  }
]
```

`source_key` wajib sudah ada di `quran_asbab_sources`. Script memakai SQL `WHERE EXISTS`, sehingga entry dengan sumber yang belum ada tidak akan diimport.

## Catatan Validasi

Jangan publish data sebelum sumbernya divalidasi. Dataset publik harus tetap `draft` atau `review` sampai isi, rujukan, takhrij, dan status riwayatnya diverifikasi. Sumber utama Indonesia yang diprioritaskan adalah LPMQ Kemenag RI; sumber klasik yang disiapkan adalah Lubabun Nuqul karya Imam as-Suyuthi dan Asbabun Nuzul karya Imam al-Wahidi.
