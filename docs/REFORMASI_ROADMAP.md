# Roadmap Reformasi SantriOnline

Roadmap ini disusun dari kondisi repo saat ini. Urutannya sengaja dimulai dari pondasi dan kontrol risiko, baru naik ke monetisasi dan SaaS.

## Prinsip Dasar

- Jangan menyentuh remote deploy atau remote migration sebelum skema lokal dan boundary auth jelas.
- Jangan menambah surface baru sebelum route alias dan legacy path dipetakan.
- Jangan memaksa AI / RAG jadi core revenue sebelum ada limit, cache, dan audit biaya.
- Fokus pertama adalah menjadikan TPQ akademik sebagai core product yang rapi.

## Fase 1: Rapikan Pondasi

| Fokus | Deliverable minimum | Risiko yang ditutup |
|---|---|---|
| Auth, RBAC, dan session | Satu model role yang konsisten, session stabil, dan guard yang jelas | Akses liar ke dashboard/API |
| Skema data | Peta tabel final, bedakan migration-backed vs runtime ensure | Skema ganda dan drift antar environment |
| Endpoint admin utilitas | Quarantine atau harden `/api/admin/migrate`, `/api/seed-admin`, generator AI | Endpoint sensitif diekspos seperti API biasa |
| Docs sinkron | README, changelog, dan docs audit konsisten dengan kode | Salah tafsir tim / user baru |
| Legacy alias | Catat dan kunci route alias yang hanya redirect | Duplikasi navigasi dan kebingungan |

Status implementasi:

- `api/admin/migrate` dan `api/seed-admin` sudah dikunci melalui helper maintenance: superadmin-only, secret wajib di production, dan masuk `system_logs`.
- Endpoint `api/kitab/tanya` sudah punya role boundary, batas panjang pertanyaan, rate limit per user, dan audit log tanpa menyimpan isi pertanyaan.
- Generator AI admin yang mahal (`generate-thumbnail`, `generate-tts-id`, `generate-tts-ar`) sudah memakai rate limit reusable.
- Shortlink analytics memakai kategori aktif dan click-log throttle per slug+IP hash untuk mengurangi abuse tulis analytics.
- Akses CMS factory dipersempit ke superadmin.
- Placeholder `/kitab/coming-soon` dikunci sebagai redirect ke katalog `/kitab`.
- Link publik ke setoran sudah diarahkan ke jalur canonical `/tpq/akademik/*`; alias lama tetap redirect role-aware.

Kriteria selesai fase ini:

- Tidak ada lagi ambiguity besar antara schema runtime dan schema migration.
- Admin utilitas punya boundary yang jelas.
- Dokumen repo menjelaskan produk yang sebenarnya, bukan versi lama dari produk.

## Fase 2: Rapikan TPQ

| Fokus | Deliverable minimum | Risiko yang ditutup |
|---|---|---|
| TPQ akademik canonical | `setoran -> review -> riwayat` benar-benar jadi jalur utama | Alur guru/santri terpecah |
| Dashboard TPQ | Dashboard satu pintu untuk santri, ustadz, admin | Navigasi terlalu banyak pintu masuk |
| Rapor dan sertifikat | Rapor hafalan, pencapaian, dan sertifikat konsisten | Output akademik tidak dipercaya |
| Hafalan mandiri | Murojaah dan checklist surah dipisahkan dari jalur resmi | Data latihan tercampur dengan data resmi |
| Kalender kegiatan | Agenda, catatan, dan reminder lebih rapi | Catatan pribadi vs lembaga kabur |

Status implementasi:

- Dashboard utama TPQ sudah menjadi satu pintu untuk setoran hari ini, perlu review, santri aktif, progres hafalan, rapor/sertifikat, dan agenda lembaga.
- Ringkasan TPQ di dashboard membaca jalur canonical `tpq_setoran` dengan scope per `institution_id` dan filter role admin/koordinator/guru/santri.
- Menu guru diarahkan ke input dan riwayat setoran; review hanya tampil untuk admin/koordinator.
- Alias lama `/akademik`, `/dashboard/setoran-hari-ini`, dan `/dashboard/review-setoran` tinggal server-only redirect role-aware tanpa UI lama.

Kriteria selesai fase ini:

- TPQ menjadi surface paling jelas di aplikasi.
- Jalur alias lama sudah turun nilainya atau dihapus dari navigasi utama.
- Pengguna baru paham bedanya setoran resmi, review, dan latihan mandiri.

## Fase 3: Monetisasi Shortlink

| Fokus | Deliverable minimum | Risiko yang ditutup |
|---|---|---|
| Kategori shortlink | Tag sponsor, affiliate, campaign, dan edukasi | Shortlink jadi gudang URL tanpa manajemen |
| Analytics | Laporan klik, sumber trafik, unique click, dan negara/kota | Sponsor tidak punya bukti performa |
| Governance | Aturan slug, domain target, dan abuse control | Spam / redirect abuse |
| Package penawaran | Paket sponsor, affiliate, dan report bulanan | Sulit dijual ke mitra |

Kriteria selesai fase ini:

- Shortlink bisa dijual sebagai produk media/traffic, bukan hanya helper redirect.
- Laporan sponsor bisa dihasilkan dari data yang sudah ada.

## Fase 4: Kitab AI / RAG

| Fokus | Deliverable minimum | Risiko yang ditutup |
|---|---|---|
| Import OpenITI | Pipeline import yang terukur, teranotasi, dan bisa diulang | Data kitab berantakan |
| Chunking dan citation | Potongan teks dan referensi jawabannya konsisten | Jawaban AI tanpa sumber |
| Quota dan cache | Limit per user/role, caching jawaban, dan rate limit ketat | Biaya token membengkak |
| Premium gating | Kelas akses gratis vs premium jelas | Produk AI tidak bisa dibundel |

Kriteria selesai fase ini:

- `tanya kitab` punya kontrol biaya dan kualitas.
- Import kitab bisa diaudit dan diulang.
- Jawaban AI selalu bisa ditelusuri ke referensi.

## Fase 5: SaaS Lembaga

| Fokus | Deliverable minimum | Risiko yang ditutup |
|---|---|---|
| Onboarding lembaga | Buat lembaga, undang admin, set role, set default data | Implementasi pelanggan terlalu manual |
| Multi-tenant | Scope org, feature gate, dan data isolation makin ketat | Lembaga saling melihat data |
| Template lembaga | Template TPQ / pesantren / masjid yang konsisten | Setup awal memakan waktu |
| Billing SaaS | Paket bulanan, per lembaga, per fitur | Sulit monetisasi B2B |

Kriteria selesai fase ini:

- SantriOnline bisa dijual sebagai SaaS lembaga, bukan hanya aplikasi internal.
- Setup lembaga baru tidak perlu banyak intervensi manual.

## Fase 6: Produk Digital / Coin

| Fokus | Deliverable minimum | Risiko yang ditutup |
|---|---|---|
| Buku digital | Katalog, reader, studio author, dan progress baca | Buku cuma jadi halaman statik |
| DRM + unlock | Chapter unlock, device limit, dan access log | Konten premium bocor begitu saja |
| Coin economy | Wallet, topup, transaksi, dan settlement | Ekonomi internal tidak jelas |
| Royalti author | Ledger royalti dan payout workflow | Penulis tidak punya insentif |
| Digital store | Checkout manual yang disederhanakan lalu bertahap otomatis | Penjualan produk digital belum scalable |

Kriteria selesai fase ini:

- Produk digital bisa dijual, dibuka, dilacak, dan disettlement.
- Coin dan DRM tidak lagi menjadi eksperimen terpisah.

## Urutan Eksekusi yang Paling Masuk Akal

1. Selesaikan fase 1.
2. Kunci fase 2 agar TPQ benar-benar jadi wajah produk.
3. Monetisasi cepat lewat fase 3.
4. Tambahkan fase 4 bila AI memang ingin dijadikan produk.
5. Baru naik ke fase 5 dan 6 bila operasi lembaga sudah stabil.

## Yang Sebaiknya Tidak Disentuh Dulu

- Refactor besar di layer auth dan organisasi sebelum skema final jelas.
- Pembersihan massal route lama sebelum mapping alias selesai.
- Menyebarkan AI endpoint baru sebelum quota dan logging beres.
- Mengubah alur pembayaran atau DRM sebelum `digital-store` dan `buku` dipetakan sebagai satu stack produk.

Roadmap ini bisa dipakai sebagai urutan kerja teknis dan sekaligus urutan produk. Kalau urutannya dibalik, biasanya yang muncul adalah fitur baru yang lebih cepat terlihat, tetapi biaya maintenance dan kebingungan user ikut naik.
