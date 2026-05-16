# Tafsir Indonesia D1

Folder ini berisi alat bantu untuk menyiapkan dan mengimpor data Tafsir Indonesia ke D1.

## Parse Tafsir Ringkas Kemenag

Raw TXT yang dipakai parser adalah hasil ekstraksi bersih. Simpan file di:

- `data/tafsir/raw/tafsir-ringkas-jilid-1.1.txt`
- `data/tafsir/raw/tafsir-ringkas-jilid-1.2.txt`
- `data/tafsir/raw/tafsir-ringkas-jilid-2.1.txt`
- `data/tafsir/raw/tafsir-ringkas-jilid-2.2.txt`

Jalankan:

```bash
npm run tafsir:parse:ringkas
```

Output:

```text
data/tafsir/tafsir-kemenag-draft.json
```

Semua entry parser dibuat sebagai `draft`. Review dan validasi isi sebelum dipublish.

## Import JSON

Pastikan migration tafsir sudah diterapkan sehingga tabel `quran_tafsir_sources` dan `quran_tafsir_entries` tersedia.

Import lokal:

```bash
npm run tafsir:import -- --input data/tafsir/sample-tafsir.json --local
```

Import remote:

```bash
npm run tafsir:import -- --input data/tafsir/tafsir-kemenag-draft.json --remote --batch-size 25
```

Importer tidak memakai `BEGIN TRANSACTION`, `COMMIT`, `ROLLBACK`, atau `SAVEPOINT`, sehingga aman untuk D1 remote.
