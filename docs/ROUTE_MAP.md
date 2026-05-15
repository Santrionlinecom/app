# Route Map SantriOnline

Peta ini merangkum route yang benar-benar ada di repo saat ini. Beberapa route masih hidup sebagai alias atau shell legacy, jadi statusnya saya tandai apa adanya.

## Public Routes

| Path | Status | Catatan |
|---|---|---|
| `/` | LIVE | Homepage marketing di `(marketing)`. |
| `/blog` | LIVE | Index artikel. |
| `/blog/[slug]` | LIVE | Detail artikel blog. |
| `/blog/fatima-al-fihri-masjid-dan-kampus-tertua` | LIVE | Artikel statik contoh. |
| `/blog/keutamaan-alquran-akhir-zaman` | LIVE | Artikel statik contoh. |
| `/blog/keutamaan-santri` | LIVE | Artikel statik contoh. |
| `/blog/keutamaan-surat-quran` | LIVE | Artikel statik contoh. |
| `/fitur` | LIVE | Halaman daftar fitur. |
| `/fitur/[slug]` | LIVE | Detail fitur. |
| `/tokoh` | LIVE | Halaman tokoh. |
| `/ulama` | LIVE | Daftar ulama. |
| `/ulama/[slug]` | LIVE | Detail ulama. |
| `/nabi` | LIVE | Daftar nabi. |
| `/nabi/[slug]` | LIVE | Detail nabi. |
| `/sahabat` | LIVE | Daftar sahabat. |
| `/sahabat/abu-bakar` | LIVE | Detail sahabat. |
| `/sahabat/ali` | LIVE | Detail sahabat. |
| `/sahabat/umar` | LIVE | Detail sahabat. |
| `/sahabat/utsman` | LIVE | Detail sahabat. |
| `/walisongo` | LIVE | Landing Walisongo. |
| `/walisongo/sunan-*` | LIVE | Delapan halaman sunan di repo. |
| `/dinasti` | LIVE | Halaman dinasti. |
| `/tabiin` | LIVE | Halaman tabiin. |
| `/tabiut-tabiin` | LIVE | Halaman tabiut-tabiin. |
| `/tentang` | LIVE | About page. |
| `/kontak` | LIVE | Kontak. |
| `/syarat` | LIVE | Syarat dan ketentuan. |
| `/privacy` | LIVE | Kebijakan privasi. |
| `/robots.txt` | LIVE | Robots policy. |
| `/sitemap.xml` | LIVE | Sitemap. |
| `/u/[id]` | LIVE | Public user profile page. |
| `/r/[slug]` | LIVE | Public shortlink redirect + analytics. |
| `/tpq` | LIVE | Landing TPQ. |
| `/tpq/[slug]` | LIVE | Detail TPQ. |
| `/tpq/daftar` | LIVE | Register TPQ. |
| `/tpq/[slug]/daftar` | LIVE | Register TPQ by slug. |
| `/pondok` | UNUSED | Disabled by institution config, shell legacy. |
| `/pondok/[slug]` | UNUSED | Disabled by institution config. |
| `/pondok/daftar` | UNUSED | Disabled by institution config. |
| `/pondok/[slug]/daftar` | UNUSED | Disabled by institution config. |
| `/masjid` | UNUSED | Disabled by institution config, legacy surface. |
| `/masjid/[slug]` | UNUSED | Disabled by institution config. |
| `/masjid/daftar` | UNUSED | Disabled by institution config. |
| `/masjid/[slug]/daftar` | UNUSED | Disabled by institution config. |
| `/musholla` | UNUSED | Disabled by institution config, legacy surface. |
| `/musholla/[slug]` | UNUSED | Disabled by institution config. |
| `/musholla/daftar` | UNUSED | Disabled by institution config. |
| `/musholla/[slug]/daftar` | UNUSED | Disabled by institution config. |
| `/rumah-tahfidz` | UNUSED | Disabled by institution config, legacy surface. |
| `/rumah-tahfidz/[slug]` | UNUSED | Disabled by institution config. |
| `/rumah-tahfidz/daftar` | UNUSED | Disabled by institution config. |
| `/rumah-tahfidz/[slug]/daftar` | UNUSED | Disabled by institution config. |
| `/kitab` | LIVE | Katalog kitab publik. |
| `/kitab/[slug]` | LIVE | Detail kitab, fallback ke curated series. |
| `/kitab/[slug]/bab/[module]` | LIVE | Reader modul curated. |
| `/kitab/quran` | LIVE | Landing mushaf. |
| `/kitab/coming-soon` | LIVE | Placeholder. |
| `/buku` | LIVE | Katalog buku digital. |
| `/buku/[slug]` | LIVE | Detail buku. |
| `/buku/[slug]/bab/[chapter]` | LIVE | Chapter reader. |
| `/buku/[slug]/baca` | LIVE | Reader mode. |
| `/buku/saya` | LIVE | Buku milik pengguna. |
| `/buku/studio` | LIVE | Author studio index. |
| `/buku/studio/new` | LIVE | Create book. |
| `/buku/studio/[id]/edit` | LIVE | Edit book. |
| `/buku/studio/[id]/chapters/new` | LIVE | Create chapter. |
| `/buku/studio/[id]/chapters/[chapterId]/edit` | LIVE | Edit chapter. |
| `/buku/studio/earnings` | LIVE | Royalty/earning view. |
| `/coins` | LIVE | Wallet dan transaksi coin. |
| `/coins/topup` | PARTIAL | Topup request manual. |
| `/digital-store` | LIVE | Katalog produk digital. |
| `/digital-store/[slug]` | LIVE | Checkout produk. |
| `/digital-store/order/[reference]` | LIVE | Tracking order + proof upload. |
| `/digital-store/order/[reference]/download` | LIVE | Download setelah paid. |
| `/kalender` | LIVE | Kalender + catatan. |
| `/sertifikat` | LIVE | Landing/generator sertifikat. |
| `/akun` | LIVE | Profil dan pengaturan. |
| `/akun/perangkat` | LIVE | Perangkat akun / device view. |
| `/menunggu` | LIVE | Waiting room untuk status org pending. |
| `/logout` | LIVE | Logout via server handler. |

## App Routes

| Path | Status | Catatan |
|---|---|---|
| `/(app)/dashboard` | LIVE | Dashboard utama, role-aware. |
| `/(app)/dashboard/diniyah` | LIVE | Submenu dashboard. |
| `/(app)/dashboard/halaqoh` | LIVE | Submenu dashboard. |
| `/(app)/dashboard/jadwal` | LIVE | Jadwal kegiatan. |
| `/(app)/dashboard/kelola-aset` | LIVE | Asset management. |
| `/(app)/dashboard/kelola-lembaga` | LIVE | Lembaga management. |
| `/(app)/dashboard/kelola-role` | LIVE | Role management. |
| `/(app)/dashboard/kelola-santri` | LIVE | Santri management. |
| `/(app)/dashboard/hafalan-mandiri` | LIVE | Murojaah / self practice. |
| `/(app)/dashboard/hafalan-belum-lancar` | LIVE | Weak memorization report. |
| `/(app)/dashboard/pencapaian-hafalan` | LIVE | Achievement summary. |
| `/(app)/dashboard/rapor-hafalan` | LIVE | Rapor view. |
| `/(app)/dashboard/review-setoran` | LIVE | Review queue. |
| `/(app)/dashboard/sertifikat` | LIVE | Certificate view. |
| `/(app)/dashboard/setoran-hari-ini` | DUPLICATE | Redirect ke TPQ academic canonical route. |
| `/(app)/dashboard/ujian-tahfidz` | LIVE | Tahfidz exam page. |
| `/(app)/akademik` | DUPLICATE | Alias redirect ke `tpq/akademik`. |
| `/(app)/keuangan` | UNUSED | Legacy community finance surface. |
| `/(app)/org/[slug]/ummah` | UNUSED | Legacy community finance/program hub. |
| `/(app)/tpq/akademik` | LIVE | Canonical TPQ academic hub. |
| `/(app)/tpq/akademik/setoran` | LIVE | Input setoran. |
| `/(app)/tpq/akademik/review` | LIVE | Review setoran. |
| `/(app)/tpq/akademik/riwayat` | LIVE | Riwayat setoran. |
| `/(app)/tpq/hafalan-rapor` | LIVE | Hafalan rapor. |
| `/(app)/tpq/rapor-rekap` | LIVE | Rekap rapor. |
| `/(app)/admin/licenses` | LIVE | License management UI. |
| `/(app)/+layout` | N/A | Layout guard; bukan route user-facing. |
| `/(app)/dashboard/+layout` | N/A | Layout guard dan pending-member redirect. |

## Admin Routes

| Path | Status | Catatan |
|---|---|---|
| `/admin/super/overview` | LIVE | Super admin overview. |
| `/admin/super/overview/live` | LIVE | Live overview endpoint. |
| `/admin/super/cms-hub` | LIVE | CMS hub. |
| `/admin/super/buku` | LIVE | Super admin buku index. |
| `/admin/super/buku/[id]` | LIVE | Detail buku admin. |
| `/admin/super/buku/royalties` | LIVE | Royalty overview. |
| `/admin/super/coin-topups` | LIVE | Topup moderation. |
| `/admin/super/coin-topups/[id]` | LIVE | Detail topup. |
| `/admin/super/impersonate` | LIVE | Impersonation entry. |
| `/admin/super/impersonate/stop` | LIVE | Stop impersonation. |
| `/admin/shortlinks` | LIVE | Shortlink list + analytics. |
| `/admin/shortlinks/new` | LIVE | Create shortlink. |
| `/admin/shortlinks/[id]` | LIVE | Detail shortlink. |
| `/admin/shortlinks/[id]/edit` | LIVE | Edit shortlink. |
| `/(cms)/admin/posts` | LIVE | Post list. |
| `/(cms)/admin/posts/new` | LIVE | Create post. |
| `/(cms)/admin/posts/[id]/edit` | LIVE | Edit post. |

## API Routes

### Admin dan Internal

| Path | Status | Catatan |
|---|---|---|
| `/api/admin/check-seo` | LIVE | SEO checklist helper. |
| `/api/admin/cloudflare` | LIVE | Health check binding Cloudflare. |
| `/api/admin/generate-artikel` | LIVE | AI article generator. |
| `/api/admin/generate-thumbnail` | LIVE | AI image generator. |
| `/api/admin/generate-tts-id` | LIVE | TTS Indonesia. |
| `/api/admin/generate-tts-ar` | LIVE | TTS Arab. |
| `/api/admin/kitab/openiti-import` | LIVE | Super-admin OpenITI import. |
| `/api/admin/licenses` | LIVE | Legacy license CRUD. |
| `/api/admin/licenses/[key]` | LIVE | Legacy license detail. |
| `/api/admin/licenses/[key]/devices` | LIVE | Legacy device list. |
| `/api/admin/licenses/[key]/reset-devices` | LIVE | Reset devices. |
| `/api/admin/migrate` | NEEDS SECURITY REVIEW | HTTP migration utility, sangat sensitif. |
| `/api/admin/posts/ai-generate` | LIVE | Draft generation untuk CMS. |
| `/api/admin/streamer-licenses` | LIVE | Streamer license CRUD. |
| `/api/admin/streamer-licenses/[id]` | LIVE | Streamer license detail. |
| `/api/admin/trigger-news` | LIVE | News worker trigger. |
| `/api/admin/users` | LIVE | User management. |
| `/api/seed-admin` | NEEDS SECURITY REVIEW | Seed demo users, sebaiknya internal. |

### TPQ, Kalender, Reports, dan Media

| Path | Status | Catatan |
|---|---|---|
| `/api/hafalan/assign` | LIVE | Assign santri. |
| `/api/hafalan/daily` | LIVE | Daily hafalan workflow. |
| `/api/certificates` | LIVE | Create/list certificates. |
| `/api/certificates/[id]/file` | LIVE | Download certificate file. |
| `/api/calendar` | LIVE | Public calendar notes feed. |
| `/api/notes` | LIVE | CRUD notes. |
| `/api/notes/[id]` | LIVE | Update/delete note. |
| `/api/santri` | LIVE | Santri list, pagination, stats. |
| `/api/santri/[id]` | LIVE | Santri detail/update/delete. |
| `/api/ustadz` | LIVE | Teacher assignment/self-service. |
| `/api/reports/anggota` | LIVE | Member report export. |
| `/api/reports/anggota/[id]` | LIVE | Member report detail export. |
| `/api/reports/keuangan` | LIVE | Finance export. |
| `/api/media` | LIVE | Media list. |
| `/api/org/media` | LIVE | Org media CRUD. |
| `/api/org/media/[id]` | LIVE | Org media delete/update. |
| `/api/upload` | LIVE | Generic image upload. |
| `/api/upload/buku-cover` | LIVE | Book cover upload. |
| `/api/upload/digital` | LIVE | Digital asset upload. |
| `/api/upload/topup-proof` | LIVE | Topup proof upload. |
| `/api/log-click` | LIVE | Activity log endpoint. |
| `/api/traffic` | LIVE | Traffic source analytics. |

### Kitab dan Quran

| Path | Status | Catatan |
|---|---|---|
| `/api/kitab/tanya` | PARTIAL | Login-only, biaya AI/vectorize perlu kontrol. |
| `/api/kitab/upload` | PARTIAL | Upload text/PDF/Drive untuk RAG. |
| `/api/quran/juz-insights/[juz]` | LIVE | Enrichment data quran. |
| `/api/quran/tafsir-ulama/[source]/[surah]/[ayah]` | LIVE | Tafsir ulama dari upstream API. |

### Monetisasi dan DRM

| Path | Status | Catatan |
|---|---|---|
| `/api/buku/bookmark` | LIVE | Bookmark buku. |
| `/api/buku/progress` | LIVE | Reading progress. |
| `/api/drm/check-access` | LIVE | Access check / unlock. |
| `/api/drm/devices` | LIVE | Device registrations. |
| `/api/drm/progress` | LIVE | DRM progress save. |
| `/api/drm/serve-pdf` | LIVE | Serve protected PDF. |
| `/api/license/activate` | LIVE | Streamer/desktop activation flow. |
| `/api/license/deactivate` | LIVE | Deactivation. |
| `/api/license/refresh` | LIVE | Token refresh. |
| `/api/license/revoke-device` | LIVE | Admin revoke. |
| `/api/license/status` | LIVE | Super admin status lookup. |
| `/api/license/validate` | LIVE | Desktop validation. |
| `/api/license/verify` | LIVE | Legacy verify flow. |

## Duplicate Dan Legacy Routes

| Path | Status | Catatan |
|---|---|---|
| `/akademik` | DUPLICATE | Alias ke TPQ academic hub. |
| `/hafalan-mandiri` | DUPLICATE | Alias ke dashboard hafalan mandiri. |
| `/dashboard/setoran-hari-ini` | DUPLICATE | Alias ke TPQ academic route canonical. |
| `/pondok/*` | UNUSED | Legacy shell, disabled by config. |
| `/masjid/*` | UNUSED | Legacy shell, disabled by config. |
| `/musholla/*` | UNUSED | Legacy shell, disabled by config. |
| `/rumah-tahfidz/*` | UNUSED | Legacy shell, disabled by config. |
| `/keuangan` | UNUSED | Surface komunitas lama, masih tergantung data lama. |
| `/org/[slug]/ummah` | UNUSED | Surface komunitas lama, tidak sejalan dengan TPQ-only mode. |

## Catatan Navigasi

- Jalur canonical TPQ akademik sekarang ada di `/tpq/akademik/*`, bukan `/akademik` atau `/dashboard/setoran-hari-ini`.
- `admin/super` adalah pusat operasi super admin. `admin/shortlinks` adalah surface monetisasi yang paling siap.
- Route non-TPQ masih terlihat di tree, tetapi banyak yang diblok oleh `src/lib/config/institutions.ts` dan `src/lib/server/institution-guards.ts`.
