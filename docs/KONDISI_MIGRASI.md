# Kondisi Migrasi Database — app.santrionline

> Ditulis setelah audit 2026-08-20 terhadap D1 produksi (`db-app`).
> Skrip audit: `node scripts/audit-migrasi.mjs --remote`

## Ringkasan Kondisi

| Hal | Jumlah |
|---|---|
| Berkas migrasi | 76 |
| Tercatat di `d1_migrations` produksi | 53 |
| **Sudah diterapkan tapi TIDAK tercatat** | **16** |
| Belum diterapkan sama sekali | 1 (`0069_pondok_asrama_tahfidz_ujian.sql`) |
| Nomor kembar (warisan) | 6 |

## Masalah Utama: Buku Catatan Tidak Sinkron — ✅ SELESAI 2026-08-21

> **Pembaruan 2026-08-21:** Catatan sudah diselaraskan. 22 nama berkas
> (16 bermigrasi skema + 6 seed/update tanpa penanda) disisipkan ke
> `d1_migrations` produksi lewat `INSERT OR IGNORE` — tanpa menjalankan
> isinya, karena isinya terbukti sudah diterapkan (diverifikasi per berkas:
> pemeriksaan skema untuk migrasi berpenanda, pemeriksaan baris data untuk
> seed `0054`/`0063`/`0064`/`0066`/`0068_seed`/`0071`).
>
> Hasil verifikasi: `d1_migrations` berisi 75 entri;
> `wrangler d1 migrations list DB --remote` kini hanya menampilkan
> `0069_pondok_asrama_tahfidz_ujian.sql` — satu-satunya yang memang belum
> diterapkan. `migrations apply` sudah AMAN dijalankan, tapi ingat: ia akan
> menerapkan `0069`. Jalankan hanya bila fitur pondok-asrama memang mau
> diaktifkan.

Catatan sejarah di bawah ini dipertahankan sebagai pelajaran.

Tabel `d1_migrations` berhenti mencatat di `0057`. Namun pemeriksaan skema
membuktikan tabel dari `0049`, `0053`, `0062`, `0068` dan lainnya **sudah ada**
di produksi.

Artinya: migrasi selama ini dijalankan manual lewat
`wrangler d1 execute DB --remote --file=...`, bukan lewat
`wrangler d1 migrations apply`. Cara manual tidak menulis catatan.

### Kenapa ini berbahaya

Bila suatu saat dijalankan `wrangler d1 migrations apply DB --remote`, D1 akan
membaca catatan, mengira 16 migrasi itu belum pernah jalan, lalu
**menjalankannya ulang di atas data yang sudah hidup**. Sebagian migrasi
memakai pola `CREATE TABLE baru → INSERT dari lama → RENAME`, yang bila diulang
bisa menimpa atau menggandakan data nyata.

**Jangan jalankan `d1 migrations apply --remote` sebelum catatan diselaraskan.**

### 16 migrasi yang perlu dicatat susulan

```
0024_buku_folders.sql
0039_payment_notification_deliveries.sql
0049_business_agent.sql
0050_business_agent_security.sql
0051_registration_email_deliveries.sql
0053_habit_system_pilot.sql
0055_digital_coin_checkout.sql
0058_coin_topup_tool_pricing_hardening.sql
0059_santri_learn_paths.sql
0060_pilot_participants.sql
0061_setoran_santri_tanpa_akun.sql
0062_kursus.sql
0065_kursus_materi_format.sql
0067_users_work_status.sql
0068_push_subscriptions.sql
0070_learn_paths_kitab.sql
```

Cara menyelaraskan (butuh persetujuan eksplisit, menulis ke produksi):
sisipkan nama berkas ke `d1_migrations` **tanpa** menjalankan isinya, karena
isinya memang sudah diterapkan.

## Nomor Kembar — Sengaja Dibiarkan

| Nomor | Berkas |
|---|---|
| 0005 | `0005_org_media.sql`, `0005_shortlink_categories.sql` |
| 0024 | `0024_buku_author_royalties.sql`, `0024_buku_folders.sql` |
| 0030 | `0030_kitab_references.sql`, `0030_short_links.sql` |
| 0038 | `0038_payment_orders.sql`, `0038_santri_learn.sql` |
| 0039 | `0039_payment_notification_deliveries.sql`, `0039_santri_learn_seed.sql` |

**Kembar `0068` sudah SELESAI (2026-08-22).** `0068_seed_kursus_cloudflare_d1_r2.sql`
diganti nama menjadi `0077_seed_kursus_cloudflare_d1_r2.sql`. Aman dilakukan
karena nama lama itu TIDAK pernah tercatat di `d1_migrations` produksi (yang
tercatat hanya `0068_push_subscriptions.sql`), dan isinya idempoten
(`INSERT OR REPLACE` dengan id tetap). Tersisa 5 kembar warisan di atas.

**Keputusan: TIDAK diganti namanya.** Sebagian nama itu sudah tercatat di
`d1_migrations` produksi. Mengganti nama berkas membuat D1 menganggapnya
migrasi baru dan menjalankannya ulang — risikonya jauh lebih besar daripada
manfaat kerapian nama.

Yang dilakukan sebagai gantinya: tes penjaga
`tests/migrasi-penomoran.test.ts` memastikan **tidak ada kembar baru**
bertambah. Kembar warisan dikunci dalam daftar `KEMBAR_WARISAN`.

## Aturan Migrasi ke Depan

1. Nomor berikutnya: **`0072`** (`0071` sudah dipakai `kitab_question_bank`).
2. Format nama: `NNNN_nama_singkat.sql`, empat digit, tanpa spasi.
3. Sebelum membuat migrasi baru, jalankan `npm test` — penjaga akan menolak
   nomor kembar.
4. Tulis migrasi agar aman dijalankan dua kali (`IF NOT EXISTS`,
   `INSERT OR IGNORE`) selama memungkinkan.
5. Setelah menerapkan ke produksi, **catat** namanya ke `d1_migrations` agar
   masalah ini tidak terulang.

## Migrasi Belum Diterapkan

`0069_pondok_asrama_tahfidz_ujian.sql` — tabel `pondok_asrama`,
`pondok_asrama_santri`, `tahfidz_ujian` belum ada di produksi. Perlu
diputuskan: diterapkan, atau ditunda karena fiturnya belum dipakai.
