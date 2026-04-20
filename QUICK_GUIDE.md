# QUICK GUIDE — SantriOnline TPQ

> Update 20 April 2026:
> Repo ini diarahkan ke **TPQ-only mode**. Beberapa route non-TPQ masih ada sebagai legacy, tetapi panduan utama di bawah ini memakai route dan role TPQ yang aktif.

## Alur Cepat Per Role

### Santri / Alumni

1. Login ke aplikasi.
2. Buka `/dashboard` untuk ringkasan progres.
3. Catat murojaah mandiri di `/dashboard/hafalan-mandiri`.
4. Lihat riwayat setoran resmi di `/tpq/akademik/riwayat`.
5. Cek kalender di `/kalender`.
6. Unduh sertifikat pribadi di `/sertifikat` jika sudah terbit.

### Ustadz / Ustadzah

1. Login ke aplikasi.
2. Input setoran santri di `/tpq/akademik/setoran`.
3. Pantau riwayat setoran santri bimbingan di `/tpq/akademik/riwayat`.
4. Lihat pencapaian hafalan di `/dashboard/pencapaian-hafalan`.
5. Terbitkan atau pantau sertifikat di `/dashboard/sertifikat`.

### Koordinator / Admin TPQ

1. Login ke aplikasi.
2. Review setoran masuk di `/tpq/akademik/review`.
3. Pantau seluruh riwayat setoran di `/tpq/akademik/riwayat`.
4. Kelola santri dan role lewat dashboard admin.
5. Pantau sertifikat di `/dashboard/sertifikat`.

### Super Admin

1. Login ke aplikasi.
2. Masuk ke `/admin/super/overview` untuk monitoring lintas sistem.
3. Gunakan endpoint admin seperti `/api/admin/cloudflare` untuk cek binding D1/R2 bila diperlukan.

---

## Route Penting

| Fitur | Route Final | Akses | Catatan |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | semua user login | Ringkasan role-based |
| Hafalan Mandiri | `/dashboard/hafalan-mandiri` | role pendidikan aktif | Simpan murojaah mandiri + integrasi kalender |
| Input Setoran | `/tpq/akademik/setoran` | `admin`, `ustadz`, `ustadzah` | Route utama input setoran TPQ |
| Review Setoran | `/tpq/akademik/review` | `admin`, `koordinator` | Approve/reject setoran |
| Riwayat Setoran | `/tpq/akademik/riwayat` | `admin`, `koordinator`, `ustadz`, `ustadzah`, `santri`, `alumni` | Scope data mengikuti role |
| Shortcut Lama | `/dashboard/setoran-hari-ini` | sesuai role | Redirect ke route TPQ akademik final |
| Shortcut Lama | `/dashboard/review-setoran` | sesuai role | Redirect ke route TPQ akademik final |
| Pencapaian Hafalan | `/dashboard/pencapaian-hafalan` | role TPQ | Ringkasan progres resmi + setoran terbaru |
| Sertifikat Admin | `/dashboard/sertifikat` | `admin`, `ustadz`, `ustadzah` | Terbitkan sertifikat PDF |
| Sertifikat Santri | `/sertifikat` | santri/alumni terkait | Lihat dan unduh sertifikat pribadi |
| Kalender | `/kalender` | user login | Catatan kalender pribadi/lembaga |
| Daftar TPQ | `/tpq/daftar` | publik atau user login | Registrasi lembaga TPQ |
| Profil TPQ Publik | `/tpq` dan `/tpq/[slug]` | publik | Listing dan halaman publik TPQ |

---

## Workflow TPQ Akademik

### Urutan kerja utama

1. Ustadz/ustadzah/admin input setoran di `/tpq/akademik/setoran`.
2. Status awal setoran adalah `submitted`.
3. Koordinator/admin memvalidasi di `/tpq/akademik/review`.
4. Setoran berubah menjadi `approved` atau `rejected`.
5. Jika jenis setoran adalah `hafalan` dan status menjadi `approved`, data otomatis disinkronkan ke `hafalan_progress`.

### Jenis setoran

- `hafalan`
- `murojaah`

### Kualitas setoran

- `lancar`
- `cukup`
- `belum`

### Catatan hak akses

- Santri dan alumni tidak input atau review setoran resmi.
- Ustadz/ustadzah hanya melihat data sesuai scope bimbingan mereka.
- Koordinator/admin dapat melihat dan mereview data sesuai lembaga TPQ.

---

## Hafalan Mandiri & Kalender

### Hafalan Mandiri

Route: `/dashboard/hafalan-mandiri`

Fungsi utama:

- mencatat murojaah mandiri
- menyimpan range ayat, kualitas, catatan, dan tanggal
- menampilkan statistik progres hafalan pribadi
- menandai checklist surah

Saat murojaah disimpan, sistem juga membuat catatan kalender otomatis.

### Kalender

Route: `/kalender`

Fungsi utama:

- melihat kalender pribadi
- menambah, mengubah, dan menghapus catatan sendiri
- admin dapat mengelola catatan user dalam scope lembaganya
- ada kalender umum berbasis catatan publik dari role admin tertentu

---

## Sertifikat

### Untuk Admin / Ustadz

Route: `/dashboard/sertifikat`

Fungsi:

- memilih santri
- melihat statistik capaian
- menerbitkan sertifikat PDF
- memantau 50 sertifikat terbaru

### Untuk Santri

Route: `/sertifikat`

Fungsi:

- melihat sertifikat yang sudah terbit
- mengunduh file sertifikat sendiri

Sertifikat disimpan di **Cloudflare R2**.

Metadata sertifikat disimpan di **Cloudflare D1**.

---

## Cloudflare D1 + R2

Binding yang dipakai project:

- `DB` untuk Cloudflare D1
- `BUCKET` untuk Cloudflare R2
- `R2_PUBLIC_BASE_URL` untuk base URL file publik

Command cepat:

```bash
npm install
npm run dev
npm run check
npm run build
```

Command Cloudflare:

```bash
export CLOUDFLARE_API_TOKEN=xxxxx

npm run cf:whoami
npm run cf:d1:list
npm run cf:r2:list
npm run cf:d1:migrate:remote
```

Cek binding dari aplikasi:

- `GET /api/admin/cloudflare`

Jika endpoint itu mengembalikan `503`, biasanya salah satu binding belum aktif atau token Cloudflare belum valid.

---

## Role Sistem

Role TPQ yang aktif dipakai sebagai acuan utama:

- `SUPER_ADMIN`
- `admin`
- `koordinator`
- `ustadz`
- `ustadzah`
- `santri`
- `alumni`

Role komunitas seperti `jamaah`, `tamir`, dan `bendahara` masih ada di sebagian codebase lama, tetapi bukan fokus mode TPQ-only.

