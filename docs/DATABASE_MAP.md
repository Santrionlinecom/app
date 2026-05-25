# Database Map SantriOnline

Catatan penting:

- Banyak tabel inti dibuat lewat helper runtime di `src/lib/server/*`, bukan hanya lewat file migration.
- `migrations/0004_update_schema_baru.sql` di repo ini praktis kosong, jadi sumber skema awal lebih banyak harus dibaca dari helper dan adapter Lucia.
- Kolom tambahan di `users` dan beberapa tabel lain juga dimatangkan lewat `ALTER TABLE` runtime.
- `migrations/0037_multi_lembaga.sql` mulai memindahkan arsitektur v2 ke model multi-lembaga dengan tetap memakai `users` dan `organizations`.

## Auth, Organisasi, Log, dan Infrastruktur

| Tabel | Fungsi tabel | Relasi perkiraan | Migration asal | Dipakai oleh |
|---|---|---|---|---|
| `users` | Akun pengguna, role, org binding, profil dasar | `sessions.user_id`, banyak FK logika ke org dan fitur | Base schema Lucia, lalu runtime `ensureUserOptionalColumns` | Auth, dashboard, TPQ, admin, laporan, lisensi, buku |
| `sessions` | Session Lucia | `sessions.user_id -> users.id` | Base schema Lucia | Auth |
| `organizations` | Master lembaga | `users.org_id -> organizations.id`, banyak tabel org-scoped FK, `organizations.akun_admin_id -> users.id` | Runtime `ensureOrgSchema`, kolom v2 dari `0037_multi_lembaga.sql` | TPQ, komunitas, admin, public institution pages |
| `addon_lembaga` | Status addon aktif per lembaga | `lembaga_id -> organizations.id` | `0037_multi_lembaga.sql` | V2 addon gate dan billing |
| `api_rate_limits` | Penyimpan limiter untuk endpoint API | Tidak banyak FK, keyed by `scope + limiter_key` | Runtime `ensureApiRateLimitTable` | Hampir semua endpoint sensitif / berbiaya |
| `chat_messages` | Log chat sederhana | `sender_id -> users.id` | Runtime `ensureChatTable` | Chat internal / helper masa depan |
| `activity_logs` | Log aktivitas user | `user_id -> users.id` | `0008_activity_logs.sql` | Audit aktivitas |
| `system_logs` | Log sistem dan request | `user_id -> users.id` | `0009_system_logs.sql` | Dashboard, audit, monitoring |
| `traffic_sources` | Rekap sumber traffic per lembaga | `organization_id -> organizations.id` | `0007_create_traffic_sources.sql` | `/api/traffic`, dashboard, sponsor analytics |
| `org_media` | Media milik lembaga | `organization_id -> organizations.id` | `0005_org_media.sql` | `/api/org/media`, dashboard aset/media |
| `org_assets` | Aset lembaga | `organization_id -> organizations.id` | `0012_org_assets.sql` | Dashboard aset |
| `santri_ustadz` | Mapping santri ke ustadz | `santri_id`, `ustadz_id`, `org_id -> users/organizations` | `0010_santri_ustadz.sql` + runtime ensure | TPQ akademik, santri assignment |
| `jadwal_tarawih` | Jadwal tarawih | `organization_id -> organizations.id`, `created_by -> users.id` | `0011_jadwal_tarawih.sql` + runtime ensure | Legacy community schedule |
| `jadwal_imam` | Jadwal imam | `organization_id -> organizations.id`, `created_by -> users.id` | `0013_jadwal_imam_khotib.sql` + runtime ensure | Legacy community schedule |
| `jadwal_khotib_jumat` | Jadwal khotib Jumat | `organization_id -> organizations.id`, `created_by -> users.id` | `0013_jadwal_imam_khotib.sql` + runtime ensure | Legacy community schedule |

## TPQ Akademik, Hafalan, Kalender, dan Sertifikat

| Tabel | Fungsi tabel | Relasi perkiraan | Migration asal | Dipakai oleh |
|---|---|---|---|---|
| `tpq_halaqoh` | Halaqoh/kelas TPQ | `institution_id -> organizations.id`, `ustadz_user_id -> users.id` | `0016_tpq_academic_workflow.sql` + runtime ensure | `/tpq/akademik`, dashboard TPQ |
| `tpq_setoran` | Setoran harian | `institution_id -> organizations.id`, `santri_user_id`, `ustadz_user_id`, `halaqoh_id` | `0016_tpq_academic_workflow.sql` + runtime ensure | Setoran/review/riwayat, rapor |
| `santri` | Data santri v2 yang terpisah dari akun login | `lembaga_id -> organizations.id`, `user_id -> users.id` | `0037_multi_lembaga.sql` | V2 manajemen santri dan limit santri |
| `hafalan_progress` | Progres hafalan inti | `user_id -> users.id` | Base schema lama + `0006_add_indexes.sql` + runtime ensure | Dashboard hafalan, rapor, sertifikat, report |
| `hafalan_surah_checks` | Checklist surah per user | `user_id -> users.id` | Runtime `ensureHafalanSurahChecksTable` | Hafalan mandiri |
| `hafalan_kategori` | Kategori rapor hafalan | `organization_id -> organizations.id` | `0026_rapor_hafalan_kategori.sql` + runtime ensure | Rapor hafalan |
| `hafalan_item` | Item penilaian hafalan | `kategori_id -> hafalan_kategori.id` | `0026_rapor_hafalan_kategori.sql` + runtime ensure | Rapor hafalan |
| `hafalan_pencapaian` | Pencapaian santri | `santri_id -> users.id`, `item_id -> hafalan_item.id`, `guru_id -> users.id` | `0026_rapor_hafalan_kategori.sql` + runtime ensure | Pencapaian hafalan, dashboard |
| `rapor_periode` | Periode rapor | `organization_id -> organizations.id` | `0026_rapor_hafalan_kategori.sql` + runtime ensure | Rapor periodik |
| `calendar_notes` | Catatan kalender / agenda | `user_id -> users.id`, scope lewat role/org | Runtime `ensureCalendarTable` | `/kalender`, `/api/calendar`, `/api/notes` |
| `muroja_tracking` | Riwayat murojaah mandiri | `user_id -> users.id` | Runtime `ensureMurojaTable` | Hafalan mandiri |
| `certificates` | Sertifikat hafalan | `santri_id`, `ustadz_id -> users.id` | Runtime `ensureCertificateTable` | `/sertifikat`, certificate download |

## CMS, Media, Kitab, dan Shortlink

| Tabel | Fungsi tabel | Relasi perkiraan | Migration asal | Dipakai oleh |
|---|---|---|---|---|
| `cms_posts` | Konten CMS / artikel | `source_url` unik, `slug` unik | `001_cms_posts.sql`, `002_add_seo_fields.sql`, `0029_news_auto_columns.sql` + runtime ensure | `/admin/posts`, blog, news generator |
| `media_library` | Perpustakaan media umum | Tidak banyak FK; metadata upload | `003_media_library.sql` + runtime ensure | Upload endpoint, CMS, digital assets |
| `kitab_catalog` | Katalog kitab publik | `slug` unik; status publik/draft | `0021_kitab_library.sql` + runtime ensure | `/kitab`, curated catalogue |
| `kitab_referensi` | Potongan teks kitab / chunk RAG | `kitab_slug`, `chunk_index` | `0030_kitab_references.sql` + runtime ensure | OpenITI import, tanya kitab |
| `short_links` | Master shortlink | `slug` unik | `0030_short_links.sql`, `0005_shortlink_categories.sql`, `0032_shortlink_category_columns.sql` | `/r/[slug]`, admin shortlinks |
| `short_link_clicks` | Log klik shortlink | `slug`, metadata click | `0030_short_links.sql` | Analytics shortlink |
| `short_link_daily_stats` | Agregat klik harian | `slug`, `date_key` | `0030_short_links.sql` | Chart shortlink |

## Monetisasi, Buku, DRM, dan Lisensi

| Tabel | Fungsi tabel | Relasi perkiraan | Migration asal | Dipakai oleh |
|---|---|---|---|---|
| `digital_products` | Produk digital | `slug` unik | `0020_digital_commerce.sql` + `0022_digital_manual_checkout.sql` + runtime ensure | `/digital-store` |
| `digital_payment_methods` | Metode pembayaran digital | Tabel referensi | `0020_digital_commerce.sql` + `0022_digital_manual_checkout.sql` | Checkout digital store |
| `digital_product_payment_methods` | Relasi produk ke metode bayar | `product_id`, `payment_method_id` | `0020_digital_commerce.sql` | Digital store checkout |
| `digital_product_sales` | Pesanan / penjualan produk digital | `product_id`, `verified_by -> users.id` | `0020_digital_commerce.sql` + `0022_digital_manual_checkout.sql` | Digital order tracking |
| `buku_books` | Master buku digital | `author_id -> users.id` | `0023_buku_novel_coin.sql` + runtime ensure | `/buku`, studio penulis |
| `buku_chapters` | Chapter / bab buku | `book_id -> buku_books.id` | `0023_buku_novel_coin.sql` + runtime ensure | Reader, studio |
| `buku_unlocks` | Unlock chapter dengan coin | `user_id`, `chapter_id` | `0023_buku_novel_coin.sql` + runtime ensure | DRM / monetisasi chapter |
| `coin_wallets` | Wallet coin user | `user_id -> users.id` | `0023_buku_novel_coin.sql` + runtime ensure | `/coins` |
| `coin_transactions` | Mutasi coin | `user_id -> users.id` | `0023_buku_novel_coin.sql` + runtime ensure | `/coins`, topup, unlock |
| `coin_topup_requests` | Request topup coin | `user_id -> users.id` | `0023_buku_novel_coin.sql` + runtime ensure | `/coins/topup`, admin moderation |
| `billing` | Tagihan addon lembaga | `akun_admin_id -> users.id`, `lembaga_id -> organizations.id` | `0037_multi_lembaga.sql` | V2 pembayaran addon |
| `buku_author_wallets` | Wallet royalti author | `author_id -> users.id` | `0024_buku_author_royalties.sql` + runtime ensure | `/buku/studio/earnings`, admin royalties |
| `buku_author_royalty_ledger` | Ledger royalti author | `author_id`, `book_id`, `chapter_id`, `reader_id` | `0024_buku_author_royalties.sql` + runtime ensure | Royalti buku |
| `buku_reading_progress` | Progress baca | `user_id`, `book_id` | `0025_buku_reading_progress.sql` + runtime ensure | `/buku/saya`, reader |
| `buku_bookmarks` | Bookmark buku | `user_id`, `book_id` | `0025_buku_reading_progress.sql` + runtime ensure | Reader |
| `user_devices` | Device registry untuk DRM buku | `user_id -> users.id`, `book_id` | `0028_drm_books.sql` + runtime ensure | `/api/drm/devices` |
| `user_book_access` | Hak akses buku per user | `user_id`, `book_id`, `chapter_id` | `0028_drm_books.sql` + runtime ensure | `/api/drm/check-access`, `/api/drm/serve-pdf` |
| `reading_progress` | Progress baca DRM | `user_id`, `book_id` | `0028_drm_books.sql` + runtime ensure | DRM reader |
| `drm_access_log` | Log akses DRM | `user_id`, `book_id` | `0028_drm_books.sql` + runtime ensure | Audit DRM |
| `licenses` | Lisensi legacy desktop/app | `user_email` / license key | `0015_licenses.sql` | `/api/license/verify`, admin licenses |
| `devices` | Device legacy license | `license_key` | `0015_licenses.sql` | Legacy license verify |
| `license_events` | Event lisensi legacy | `license_key` | `0015_licenses.sql` | Audit lisensi legacy |
| `streamer_licenses` | Lisensi streamer | `plaintext_key` tambahan dari `0019` | `0017_streamer_license_service.sql`, `0019_streamer_license_plaintext_key.sql` | `/api/license/activate`, admin streamer licenses |
| `streamer_license_devices` | Device lisensi streamer | `license_id -> streamer_licenses.id` | `0017_streamer_license_service.sql` | Streamer activation / refresh |
| `streamer_license_events` | Event lisensi streamer | `license_id -> streamer_licenses.id` | `0017_streamer_license_service.sql` | Audit streamer licenses |
| `ai_generations` | Log generasi AI | `user_id`, `post_id` | `0027_ai_generations.sql` | AI artikel, thumbnail, TTS |

## Legacy Community / Non-TPQ

| Tabel | Fungsi tabel | Relasi perkiraan | Migration asal | Dipakai oleh |
|---|---|---|---|---|
| `program_amal` | Master program amal | `organization_id -> organizations.id` | Runtime `ensureUmmahTables` | `/keuangan`, `/org/[slug]/ummah` |
| `jamaah` | Data jamaah v2 untuk masjid/musholla | `lembaga_id -> organizations.id` | `0037_multi_lembaga.sql` | V2 modul masjid/musholla |
| `transaksi_zakat` | Transaksi zakat | `program_id -> program_amal.id` | Runtime `ensureUmmahTables` | Report keuangan, ummah |
| `data_qurban` | Data qurban | `program_id -> program_amal.id` | Runtime `ensureUmmahTables` | Report keuangan, ummah |
| `kas_masjid` | Buku kas masjid/musholla | `organization_id -> organizations.id` | Runtime `ensureUmmahTables` | `/keuangan`, dashboard legacy |

## Catatan Tambahan

- `short_links_category_metadata_backup` dan `short_links_category_migration_new` ada di migration sebagai tabel bantu migrasi, bukan sebagai tabel fitur utama yang dipakai aplikasi.
- Banyak tabel di atas punya indeks tambahan yang dibuat di migration `0006_add_indexes.sql` atau di helper runtime.
- Kalau mau merapikan skema, urutan paling aman adalah: `users/sessions`, `organizations`, TPQ akademik, lalu monetisasi dan AI.
