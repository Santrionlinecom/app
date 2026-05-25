# SYSTEM MAP - app.santrionline.com

> Platform manajemen lembaga Islam - Multi-Lembaga + Addon Berbayar
> Stack: SvelteKit + TailwindCSS + Cloudflare Pages + D1 (SQLite) + R2
> Author: SantriOnline Dev Studio - Mas Yogik Pratama
> Last updated: Mei 2026 (v2 - Multi-Lembaga Architecture)

---

## 1. IDENTITAS PLATFORM

| Atribut | Detail |
|---|---|
| Nama | SantriOnline App |
| Domain | app.santrionline.com |
| Target User | Admin TPQ/Pondok/Masjid/Musholla/Rumah Tahfidz, Wali Santri |
| Model Bisnis | Freemium B2B - 1 lembaga TPQ gratis, lembaga tambahan & modul premium berbayar |
| Bahasa UI | Bahasa Indonesia + elemen Arab (font Scheherazade/Amiri) |
| Tema | Light mode utama, dark mode opsional |
| Palet Warna | Hijau tua (#1B4332), Emas (#C9A84C), Putih Krem (#FAF8F3), Abu netral |
| Brand Feel | Islami, amanah, profesional, modern - bukan kaku/formal |

---

## 2. MODEL BISNIS - FREEMIUM + ADDON

### Tier Gratis (Selamanya)

- 1 lembaga TPQ atau Pondok
- Maks 30 santri aktif
- Fitur: Manajemen Santri, Setoran Hafalan, Kas Dasar

### Addon Berbayar (Aktivasi per Lembaga)

| Addon | Harga | Fitur |
|---|---|---|
| Lembaga Tambahan | Rp15K/bulan/lembaga | Tambah lembaga ke-2, ke-3, dst |
| Modul Masjid | Rp25K/bulan | Kas jamaah, Zakat & Qurban, Agenda jamaah |
| Modul Rumah Tahfidz | Rp20K/bulan | Halaqoh, Setoran detail, Ujian + Ijazah |
| Modul Musholla | Rp15K/bulan | Kas musholla, Kegiatan rutin, Pelayanan warga |
| Santri Unlimited | Rp20K/bulan | Hapus batas 30 santri |
| Raport PDF Premium | Rp15K/bulan | Template custom, kirim ke wali via WA |

### Pembayaran

- Via coin SantriOnline (santrionline.com)
- Via Midtrans (kartu, transfer, QRIS)
- Via BSI (bank syariah)

---

## 3. ARSITEKTUR TEKNIS

```text
app.santrionline.com
├── Frontend: SvelteKit (SSR + CSR hybrid)
├── Styling: TailwindCSS v4 + custom CSS variables
├── Deploy: Cloudflare Pages
├── Database: Cloudflare D1 (SQLite via Drizzle ORM)
├── Storage: Cloudflare R2 (files.santrionline.com)
├── Auth: Session-based (cookie domain .santrionline.com - shared dengan santrionline.com)
├── Analytics: Umami + Microsoft Clarity (cookie consent gated)
├── Error Tracking: Sentry
└── AI Features: Groq API (Llama 4) - AI assistant admin
```

### Shared Auth dengan santrionline.com

```text
Cookie domain: .santrionline.com
-> Berlaku di app.santrionline.com DAN santrionline.com
-> User login sekali, bisa akses kedua platform
-> Set di: cookies.set('session', token, { domain: '.santrionline.com' })
```

### Folder Structure (SvelteKit)

```text
src/
├── routes/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/          -> wizard 3 step
│   │   └── forgot-password/
│   ├── (app)/
│   │   ├── dashboard/         -> dashboard aktif per lembaga
│   │   ├── lembaga/           -> switcher + manajemen semua lembaga
│   │   │   ├── +page.svelte   -> daftar semua lembaga milik admin
│   │   │   ├── [id]/          -> detail & pengaturan per lembaga
│   │   │   └── tambah/        -> tambah lembaga baru + pilih addon
│   │   ├── santri/            -> (TPQ/Pondok/Rumah Tahfidz)
│   │   ├── hafalan/
│   │   ├── setoran/
│   │   ├── ujian/
│   │   ├── raport/
│   │   ├── jamaah/            -> (Masjid/Musholla)
│   │   ├── kas/
│   │   ├── zakat/
│   │   ├── addon/             -> halaman aktivasi & billing addon
│   │   └── pengaturan/
├── lib/
│   ├── components/
│   ├── stores/
│   │   ├── lembagaAktif.ts    -> lembaga yang sedang dipilih admin
│   │   ├── currentUser.ts
│   │   └── addonStatus.ts     -> status addon aktif per lembaga
│   ├── api/
│   └── db.js
└── app.html
```

---

## 4. SKEMA DATABASE D1 - MULTI-LEMBAGA

Implementasi repo v2 memakai tabel existing `users` sebagai akun admin dan `organizations`
sebagai lembaga. Migration awal ada di `migrations/0037_multi_lembaga.sql`.
Tabel TPQ existing seperti `tpq_setoran` tetap dipakai selama masa transisi; alias
kanonik `setoran`/`kas_transaksi` bisa ditambahkan setelah route dan query selesai
dipindahkan.

```sql
-- users = akun admin / ustadz / wali / santri login
-- organizations = lembaga
-- organizations.type memakai nilai existing repo:
-- 'tpq', 'pondok', 'masjid', 'musholla', 'rumah-tahfidz'

ALTER TABLE organizations ADD COLUMN akun_admin_id TEXT REFERENCES users(id);
ALTER TABLE organizations ADD COLUMN logo_url TEXT;
ALTER TABLE organizations ADD COLUMN is_aktif INTEGER DEFAULT 1;

-- Addon aktif per lembaga
CREATE TABLE addon_lembaga (
  id TEXT PRIMARY KEY,
  lembaga_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tipe_addon TEXT NOT NULL CHECK(tipe_addon IN (
    'lembaga_tambahan','modul_masjid','modul_tahfidz',
    'modul_musholla','santri_unlimited','raport_premium'
  )),
  status TEXT DEFAULT 'aktif' CHECK(status IN ('aktif','expired','trial')),
  berlaku_hingga INTEGER,  -- unix timestamp
  created_at INTEGER DEFAULT (unixepoch())
);

-- Santri (terhubung ke lembaga, bukan ke akun_admin)
CREATE TABLE santri (
  id TEXT PRIMARY KEY,
  lembaga_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  nama TEXT NOT NULL,
  nis TEXT,
  kelas TEXT,
  wali_nama TEXT,
  wali_hp TEXT,
  foto_url TEXT,
  is_aktif INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Jamaah (untuk lembaga tipe masjid/musholla)
CREATE TABLE jamaah (
  id TEXT PRIMARY KEY,
  lembaga_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  alamat TEXT,
  no_hp TEXT,
  kategori TEXT DEFAULT 'umum',
  is_aktif INTEGER DEFAULT 1
);

-- Billing addon
CREATE TABLE billing (
  id TEXT PRIMARY KEY,
  akun_admin_id TEXT NOT NULL REFERENCES users(id),
  lembaga_id TEXT REFERENCES organizations(id),
  addon_tipe TEXT,
  nominal INTEGER NOT NULL DEFAULT 0,
  metode TEXT CHECK(metode IN ('coin','midtrans','bsi')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','sukses','gagal')),
  created_at INTEGER DEFAULT (unixepoch())
);
```

---

## 5. LOGIKA BISNIS - MULTI-LEMBAGA

### 5.1 Lembaga Switcher

- Setiap admin punya **lembagaAktif** store
- TopBar menampilkan nama + tipe lembaga aktif
- Klik -> dropdown daftar semua lembaga milik admin
- Switch lembaga -> semua halaman re-fetch data dari lembaga baru
- URL tidak berubah (state di store, bukan URL param)

### 5.2 Gate Addon

```typescript
// src/lib/stores/addonStatus.ts
// Cek apakah lembaga aktif punya addon tertentu
export function hasAddon(lembagaId: string, tipeAddon: string): boolean

// Contoh penggunaan di halaman:
// {#if hasAddon(lembagaAktif.id, 'modul_masjid')}
//   <ZakatPage />
// {:else}
//   <AddonGate addon="modul_masjid" harga="Rp25K/bulan" />
// {/if}
```

### 5.3 Logika Fitur per Tipe Lembaga

| Fitur | TPQ | Pondok | Masjid | Musholla | Rumah Tahfidz |
|---|---|---|---|---|---|
| Manajemen Santri | Ya | Ya | Tidak | Tidak | Ya |
| Setoran Hafalan | Ya | Ya | Tidak | Tidak | Ya |
| Ujian & Raport | Ya | Ya | Tidak | Tidak | Ya |
| Manajemen Jamaah | Tidak | Tidak | Ya | Ya | Tidak |
| Kas Lembaga | Ya | Ya | Ya | Ya | Ya |
| Zakat & Qurban | Tidak | Tidak | Ya, addon | Tidak | Tidak |
| Halaqoh Detail | Tidak | Tidak | Tidak | Tidak | Ya, addon |

### 5.4 Batas Santri Gratis

```typescript
// Cek sebelum tambah santri baru
const jumlahSantri = await countSantriAktif(lembagaId);
const hasUnlimited = hasAddon(lembagaId, 'santri_unlimited');
if (jumlahSantri >= 30 && !hasUnlimited) {
  // Tampilkan gate upgrade addon
}
```

---

## 6. HALAMAN UTAMA

### 6.1 AUTH

- Login - email/password, remember me
- Register - wizard 3 step:
  - Step 1: Data admin (nama, email, password)
  - Step 2: Data lembaga pertama (nama, tipe, alamat)
  - Step 3: Selamat datang + onboarding singkat
- Forgot Password - via email OTP

### 6.2 DASHBOARD

- Header: nama lembaga aktif + tipe badge + tombol switcher
- StatCard: total santri/jamaah, setoran hari ini, saldo kas, ujian aktif
- Feed aktivitas terbaru
- Shortcut fitur utama
- AI Assistant widget (Groq)
- Banner addon jika ada fitur yang belum aktif

### 6.3 HALAMAN LEMBAGA (BARU)

- Daftar semua lembaga milik admin (card per lembaga)
- Status addon per lembaga (aktif/expired/belum aktif)
- Tombol: Kelola | Tambah Lembaga Baru
- Halaman tambah lembaga: pilih tipe -> isi data -> pilih addon -> bayar

### 6.4 HALAMAN ADDON (BARU)

- Katalog semua addon tersedia
- Status per addon (aktif/belum aktif/expired)
- Tombol aktivasi -> redirect ke pembayaran
- Riwayat billing

### 6.5 HALAMAN LAINNYA

(sama seperti v1 - Santri, Hafalan, Setoran, Ujian, Raport, Jamaah, Kas, Zakat, Pengaturan)

---

## 7. KOMPONEN UI REUSABLE

| Komponen | Deskripsi |
|---|---|
| `<AppShell>` | Layout utama dengan Sidebar + TopBar |
| `<Sidebar>` | Navigasi kiri, collapsible, role-aware, tipe-aware |
| `<TopBar>` | Search, notif, profil, **LembagaSwitcher** |
| `<LembagaSwitcher>` | Dropdown switch lembaga aktif (BARU) |
| `<AddonGate>` | Blocker halaman dengan CTA upgrade (BARU) |
| `<AddonBadge>` | Badge status addon aktif/expired (BARU) |
| `<StatCard>` | Kartu statistik dengan ikon + trend |
| `<DataTable>` | Tabel dengan sort, filter, pagination |
| `<ProgressRing>` | Ring progress hafalan (SVG) |
| `<Modal>` | Dialog konfirmasi & form |
| `<Toast>` | Notifikasi sukses/error/warning |
| `<EmptyState>` | Ilustrasi saat data kosong |
| `<AIWidget>` | Chat mini Groq assistant |

---

## 8. STATE MANAGEMENT

```typescript
// Store utama
lembagaAktif: Lembaga        // lembaga yang sedang dikelola
currentUser: AkunAdmin        // admin yang login
addonStatus: AddonMap         // map<lembagaId, AddonTipe[]>
viewMode: 'pondok' | 'masjid' // derived dari lembagaAktif.tipe

// Derived stores
isFreeTier: boolean           // derived dari jumlah lembaga + addon
santriLimit: number           // 30 jika gratis, unlimited jika addon aktif
availableMenus: MenuItem[]    // derived dari lembagaAktif.tipe + addonStatus
```

---

## 9. DESIGN TOKENS

```css
:root {
  --color-primary: #1B4332;
  --color-primary-light: #2D6A4F;
  --color-primary-dark: #0F2F24;
  --color-accent: #C9A84C;
  --color-accent-light: #E8C97A;
  --color-bg: #FAF8F3;
  --color-surface: #FFFFFF;
  --color-border: #E8E4DC;
  --color-text: #1A1A1A;
  --color-text-muted: #6B7280;

  --font-display: 'Fraunces', serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;
  --font-arabic: 'Scheherazade New', serif;

  --sidebar-width: 276px;
  --topbar-height: 64px;
  --radius: 12px;
  --radius-lg: 20px;
  --shadow-card: 0 12px 34px rgb(27 67 50 / 0.08);
  --shadow-soft: 0 18px 60px rgb(27 67 50 / 0.10);
}
```

---

## 10. MOBILE RESPONSIVENESS

- Sidebar -> bottom nav di mobile
- LembagaSwitcher -> bottom sheet di mobile
- DataTable -> swipeable card view di mobile
- Input setoran -> one-hand UX, tombol besar
- Auto-hide header/footer saat scroll (planned)

---

## 11. INTEGRASI EKSTERNAL

| Layanan | Fungsi |
|---|---|
| Groq API (Llama 4) | AI Assistant admin |
| Cloudflare R2 | Foto santri, dokumen, raport PDF |
| Fonnte | Notifikasi WhatsApp ke wali/jamaah |
| Midtrans | Pembayaran addon (kartu, transfer, QRIS) |
| BSI | Pembayaran addon syariah |
| Coin SantriOnline | Pembayaran addon via santrionline.com |
| Sentry | Error tracking |
| Umami + Clarity | Analytics (cookie-consent gated) |

---

## 12. ROADMAP IMPLEMENTASI

### Phase 1 - Sekarang (sudah jalan)

- [x] Auth login/register
- [x] Dashboard TPQ
- [x] Manajemen santri
- [x] Setoran hafalan
- [x] Kas dasar

### Phase 2 - Q3 2026 (Multi-Lembaga)

- [x] Skema D1 multi-lembaga (migration awal `0037_multi_lembaga.sql`)
- [x] LembagaSwitcher UI
- [x] Halaman manajemen lembaga (`/lembaga`)
- [ ] AddonGate component
- [ ] Register wizard 3 step

### Phase 3 - Q3 2026 (Billing)

- [ ] Halaman katalog addon
- [ ] Integrasi Midtrans untuk addon
- [ ] Integrasi coin santrionline.com
- [ ] Riwayat billing

### Phase 4 - Q4 2026 (Modul Baru)

- [ ] Modul Masjid (jamaah, zakat, qurban)
- [ ] Modul Rumah Tahfidz (halaqoh, ijazah)
- [ ] Modul Musholla
- [ ] Raport PDF premium

---

*File ini adalah referensi utama untuk Codex, generate mockup UI, dan implementasi fitur.*
*Update setiap ada perubahan arsitektur signifikan.*
