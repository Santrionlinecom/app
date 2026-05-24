# Audit Sistem Informasi SantriOnline

Audit ini membaca struktur route, helper server, migration, dan halaman admin/public yang ada di repo saat ini. Fokusnya adalah memetakan kondisi nyata sistem, bukan merapikan kode atau menjalankan perubahan skema remote.

## Ringkasan Eksekutif

SantriOnline saat ini bukan satu aplikasi tunggal yang rapi, melainkan kumpulan beberapa lapisan produk yang berkembang dari satu basis kode:

- Core TPQ akademik sudah hidup dan paling dekat ke produk operasional.
- Shortlink analytics sudah matang dan paling dekat ke monetisasi cepat.
- Kitab digital, OpenITI import, dan RAG sudah ada, tetapi masih perlu guardrail biaya dan akses.
- Buku digital, coin wallet, DRM, dan digital store sudah membentuk jalur produk digital yang cukup lengkap.
- Ada banyak surface legacy untuk masjid, musholla, pondok, dan rumah tahfidz, tetapi konfigurasi saat ini menonaktifkan sebagian besar jalur itu.
- Sejumlah helper membuat tabel secara runtime, jadi sebagian skema penting tidak hanya bergantung pada migration.

### Snapshot Kondisi

| Area | Status audit | Catatan singkat |
|---|---|---|
| Auth dan RBAC | LIVE | Lucia + session, role lembaga, super admin, dan feature gating sudah jelas. |
| TPQ akademik | LIVE | Alur setoran, review, riwayat, rapor, sertifikat, dan dashboard sudah terhubung. |
| Shortlink | HARDENED | Redirect publik + analytics + admin CRUD + kategori sudah lengkap; click-log punya throttle untuk mengurangi abuse tulis analytics. |
| Kitab digital dan RAG | LIVE / PARTIAL | Catalog, reader, import, dan tanya kitab ada, tapi biaya AI perlu kontrol. |
| Buku digital, coin, DRM | LIVE / PARTIAL | Jalur monetisasi sudah ada, namun sebagian masih manual-operasional. |
| CMS dan AI konten | LIVE | Post management dan generator konten berjalan, namun harus diawasi biaya dan akses. |
| Surfaces legacy komunitas | UNUSED | Masjid/musholla/pondok/rumah tahfidz masih ada di kode, tetapi diblok konfigurasi. |
| Admin utilitas | HARDENED | `migrate` dan `seed-admin` sudah superadmin-only, secret wajib di production, dan logged; generator AI mahal sudah rate-limited. |

## Fitur Yang Ditemukan

Fitur yang paling jelas dari repo ini:

- Identitas dan onboarding: login, register, Google OAuth, reset password, akun, perangkat.
- Public content: homepage marketing, blog, fitur, tokoh, ulama, nabi, sahabat, walisongo, dinasti, kontak, syarat, privacy, sitemap, robots.
- TPQ akademik: setoran, review, riwayat, rapor hafalan, pencapaian, hafalan mandiri, sertifikat, halaqoh, santri, jadwal.
- Kitab digital: katalog kitab, bab/module reader, kitab Quran, import OpenITI, RAG, tanya kitab.
- Monetisasi: shortlink, digital store, coin wallet/topup, buku digital, DRM unlock, royalties, license services.
- Sistem teknis: organisasi, RBAC, rate limit, upload, media library, traffic analytics, logs, calendar/notes, reports.

## Route Map Ringkas

### Publik

- `/` dan kelompok `(marketing)` untuk homepage.
- `/blog`, `/blog/[slug]`, serta artikel statik.
- `/fitur`, `/fitur/[slug]`.
- `/tokoh`, `/ulama`, `/nabi`, `/sahabat`, `/walisongo`, `/dinasti`, `/tabiin`, `/tabiut-tabiin`.
- `/tentang`, `/kontak`, `/syarat`, `/privacy`, `/robots.txt`, `/sitemap.xml`.
- `/tpq`, `/tpq/[slug]`, `/tpq/daftar` dan pasangan institusi lain.
- `/kitab`, `/kitab/[slug]`, `/kitab/[slug]/bab/[module]`, `/kitab/quran`, `/kitab/coming-soon`.
- `/buku`, `/coins`, `/digital-store`, `/kalender`, `/sertifikat`, `/u/[id]`, `/r/[slug]`.

### Admin Dan App

- `(app)/dashboard/*` untuk dashboard utama, TPQ, hafalan, aset, role, lembaga, dan jadwal.
- `(app)/tpq/akademik/*` untuk setoran/review/riwayat.
- `(app)/keuangan` dan `(app)/org/[slug]/ummah` untuk surface komunitas yang sekarang bersifat legacy.
- `admin/shortlinks/*`, `admin/super/*`, `(cms)/admin/posts/*`, `(app)/admin/licenses/*`.

### API

- Admin/CMS: `api/admin/*`, `api/upload/*`, `api/media`, `api/org/media`.
- TPQ akademik: `api/hafalan/*`, `api/certificates`, `api/santri`, `api/ustadz`.
- Kitab/RAG: `api/kitab/*`, `api/quran/*`.
- Monetisasi: `api/license/*`, `api/drm/*`, `api/buku/*`, `api/traffic`, `api/log-click`, serta flow coin/topup lewat halaman front-end.
- Kalender/notes: `api/calendar`, `api/notes/*`.

## Database Map Ringkas

### Migration-Backed

- `cms_posts`, `media_library`, `org_media`, `org_assets`.
- `traffic_sources`, `activity_logs`, `system_logs`, `chat_messages`.
- `santri_ustadz`, `jadwal_tarawih`, `jadwal_imam`, `jadwal_khotib_jumat`.
- `licenses`, `devices`, `license_events`, `streamer_licenses`, `streamer_license_devices`, `streamer_license_events`.
- `tpq_halaqoh`, `tpq_setoran`, `hafalan_progress`, `hafalan_surah_checks`.
- `calendar_notes`, `muroja_tracking`, `certificates`.
- `digital_products`, `digital_payment_methods`, `digital_product_payment_methods`, `digital_product_sales`.
- `kitab_catalog`, `kitab_referensi`.
- `buku_books`, `buku_chapters`, `buku_unlocks`, `coin_wallets`, `coin_transactions`, `coin_topup_requests`.
- `buku_author_wallets`, `buku_author_royalty_ledger`, `buku_reading_progress`, `buku_bookmarks`.
- `user_devices`, `user_book_access`, `reading_progress`, `drm_access_log`.
- `hafalan_kategori`, `hafalan_item`, `hafalan_pencapaian`, `rapor_periode`.
- `ai_generations`, `short_links`, `short_link_clicks`, `short_link_daily_stats`.
- `program_amal`, `transaksi_zakat`, `data_qurban`, `kas_masjid`.

### Runtime-Ensured

Beberapa tabel penting dibuat lewat helper server, bukan hanya migration, terutama `organizations`, `api_rate_limits`, `chat_messages`, `calendar_notes`, `muroja_tracking`, `certificates`, `kitab_referensi`, `digital_*`, `buku_*`, `coin_*`, dan beberapa tabel DRM/lisensi. Ini membuat audit skema harus membaca `src/lib/server/*`, bukan folder `migrations/` saja.

## Status Tiap Kategori

- **LIVE/HARDENED**: TPQ akademik, shortlink analytics, kitab catalog, buku digital, digital store, auth/RBAC, media upload, reports, logs, traffic.
- **PARTIAL**: OpenITI import, RAG tanya kitab, coin topup flow, AI content factory, beberapa jalur export/report yang masih bergantung data runtime.
- **DUPLICATE**: `/akademik`, `/hafalan-mandiri`, `/setoran-hari-ini`, `/review-setoran`, serta beberapa alias navigasi dashboard yang hanya memindahkan user ke jalur canonical.
- **UNUSED**: surface komunitas non-TPQ yang masih ada di kode tetapi diblok config dan cleanup migration.
- **NEEDS MIGRATION**: tabel yang lahir dari helper runtime tapi belum terlihat jelas di migration historis repo ini.
- **NEEDS SECURITY REVIEW**: import kitab dan upload/checkout yang menerima file atau traffic publik. Endpoint migrasi/admin seed, generator AI mahal, dan shortlink click-log sudah masuk status hardened, tetapi tetap perlu dipantau sebagai surface berisiko tinggi.
- **NEEDS UI POLISH**: homepage yang terlalu luas secara narasi produk, dashboard yang masih memuat banyak fungsi legacy, serta beberapa jalur monetisasi yang belum dipisah jelas antara free dan paid.

## Risiko Keamanan

1. `api/admin/migrate` adalah utilitas yang sangat sensitif karena menginisialisasi banyak tabel dari HTTP surface. Endpoint ini sudah superadmin-only dan membutuhkan secret di production.
2. `api/seed-admin` juga sensitif; endpoint ini sudah superadmin-only, membutuhkan secret di production, dan tetap harus dianggap internal.
3. `api/kitab/upload` dan `api/kitab/tanya` bisa mahal di AI/vectorize bila disalahgunakan. `tanya kitab` sudah dibatasi role, panjang input, rate limit, dan audit log.
4. `r/[slug]` adalah endpoint publik yang bisa dipukul berulang; click-log sekarang punya throttle per slug+IP hash agar analytics write tidak bebas tanpa batas.
5. `calendar_notes` dan `api/calendar` memegang data pribadi dan agenda; batasan role dan scope perlu dijaga.
6. Upload endpoint dan R2 object harus terus diproteksi oleh signature/size/type validation.
7. Sistem lisensi dan DRM menggunakan banyak endpoint publik; pembatasan rate limit dan audit log perlu dipelihara.

## Potensi Monetisasi

Peluang uang yang paling realistis dari state repo saat ini:

- Shortlink affiliate/sponsor: paling cepat karena sudah ada redirect publik dan analytics admin.
- Digital store manual checkout: sudah ada katalog, checkout, bukti bayar, dan token akses.
- Buku digital berbayar: bisa dipakai untuk chapter unlock, DRM, dan royalti penulis.
- Coin economy: topup dan transaksi sudah ada, cocok untuk unlock konten atau chapter premium.
- Kitab premium dan AI kitab: bisa monetisasi query, paket lembaga, atau akses curated/RAG.
- SaaS TPQ bulanan: paling bernilai jangka panjang, tetapi butuh penyederhanaan produk dan onboarding lembaga.

## Prioritas Audit dan Reformasi

1. Kunci dulu boundary schema dan auth, terutama `organizations`, `users`, `sessions`, dan endpoint admin utilitas.
2. Pisahkan jalur aktif vs legacy. Saat ini kode masih memuat surface komunitas lama yang tidak lagi sejalan dengan TPQ-only mode.
3. Konsolidasikan TPQ akademik sebagai core workflow utama.
4. Tambahkan guardrail biaya untuk AI dan import RAG.
5. Dorong monetisasi paling cepat dari shortlink dan digital store.
6. Baru sesudah itu rapikan SaaS lembaga, produk digital, dan coin economy.

## Sinkronisasi Dokumentasi

- `README.md` sudah menyebut TPQ-only mode sekaligus lapisan monetisasi, Kitab AI/RAG, dan batasan endpoint maintenance.
- `CHANGES.md` sudah menambahkan catatan hardening roadmap pondasi.
- `FITUR_BARU_SUMMARY.md` tampak lebih tua dan tidak lagi sinkron dengan struktur runtime saat ini.
- `scripts/openiti/README.md` relatif masih akurat untuk pipeline import OpenITI, terutama bahwa produksi harus lewat jalur super admin.

Kesimpulannya: dokumentasi ada, tetapi belum satu suara dengan kode. Repo ini lebih maju daripada narasi README-nya.
