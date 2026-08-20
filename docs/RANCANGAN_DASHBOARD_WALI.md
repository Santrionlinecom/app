# Rancangan: Dashboard Wali Santri + Perjalanan Santri + Rapor-Sertifikat

> Status: **rancangan v2, belum diimplementasikan**
> v1: 2026-08-20 (dashboard wali). v2: 2026-08-21 — ditambah arahan Mas Yogik:
> afiliasi lembaga per santri, santri mandiri tanpa wali, dan sertifikat-rapor
> akhir dari lembaga dengan slug publik.
> Menutup Pilar 5 SantriOnline (Komunitas & Pendampingan)

---

## 0. Gambaran Besar (v2)

Tiga rangkaian yang saling menyambung menjadi satu **perjalanan santri**:

```
santri memilih lembaga ──► belajar & habit tercatat ──► lembaga menerbitkan
   (afiliasi rapi)           di bawah lembaga itu         rapor-sertifikat
        │                                                      │
        ├── punya wali  → wali memantau lewat /wali            └── slug publik:
        └── tanpa wali  → mandiri, memantau dirinya sendiri        /s/[slug]
```

Prinsip: **wali itu pelengkap, bukan syarat.** Santri dewasa/mandiri tetap
mendapat seluruh perjalanan — hanya kartu pemantaunya yang berbeda.

## 0.1 Bahan v2 yang Sudah Ada di Produksi (diverifikasi 2026-08-21)

| Kebutuhan | Yang sudah ada | Status |
|---|---|---|
| Afiliasi santri↔lembaga | `organization_memberships` (`0043`): user_id, org_id, role, is_active, joined_at | ✅ produksi — **dipakai, bukan bikin tabel baru** |
| Slug lembaga | `organizations.slug` | ✅ produksi, 15 lembaga |
| Tabel sertifikat | `certificates` (santri_id, ustadz_id, title, duration_days, total_hifz_ayat, …) + `src/lib/server/certificates.ts` + rute `/sertifikat` | ✅ produksi, **0 baris** — sudah ada rangka, belum pernah dipakai |
| Data kitab selesai | `learn_progress`, `learn_modul.path_key` → `learn_paths.kitab_slug` | ✅ produksi |
| Data hafalan | `hafalan_progress`, `tpq_setoran` | ✅ produksi |
| Data habit | `habit_checkins`, `habit_streaks` | ✅ produksi |

Yang benar-benar baru tinggal: relasi wali↔anak, alur santri memilih lembaga,
perluasan `certificates` menjadi rapor (kolom org + slug + isi rapor), dan
halaman-halamannya.

## 1. Masalah yang Diselesaikan

Peran `wali` sudah terdaftar di `src/lib/server/auth/rbac.ts` (baris 23) dan
`src/lib/types/rbac.ts`, tapi penelusuran `grep 'wali'` di seluruh
`src/routes/(app)/` menghasilkan **nol** berkas.

Akibatnya hari ini: orang tua bisa mendaftar dan login, lalu melihat layar yang
tidak dirancang untuk mereka. Tidak ada satu pun cara melihat perkembangan
anaknya.

Ini melumpuhkan tiga hal sekaligus:

1. **Pembinaan** — habit tanpa orang tua yang menyaksikan mudah ditinggalkan.
2. **Retensi** — anak berhenti, tidak ada yang menyadari.
3. **Monetisasi** — yang membayar biasanya orang tua, tapi mereka tidak
   diberi apa pun yang bisa dilihat.

## 2. Bahan yang Sudah Ada (jangan dibangun ulang)

Audit menemukan fondasinya sebagian sudah tertanam:

| Yang sudah ada | Letak | Catatan |
|---|---|---|
| `habit_guardian_weekly` | migrasi `0053`, produksi ✅ | Konfirmasi mingguan wali. Sudah punya penulis di `service.ts:671`, **belum punya pembaca dan belum punya UI** |
| `pilot_participants.guardian_user_id` | migrasi `0060`, produksi ✅ | Relasi wali↔anak, tapi khusus pilot dan hanya 1 wali per anak |
| `santri.wali_nama`, `santri.wali_hp` | tabel `santri` | **Teks bebas, bukan akun.** Tidak bisa dipakai untuk otorisasi |
| `habit_streaks`, `habit_checkins`, `habit_missions` | `0053`, produksi ✅ | Sumber data habit |
| `learn_progress`, `learn_badge` | produksi ✅ | Sumber data belajar |
| `tpq_setoran`, `hafalan_progress` | produksi ✅ | Sumber data hafalan |

**Kesimpulan: yang benar-benar kurang hanya dua** — relasi wali↔anak yang
berlaku umum (bukan cuma pilot), dan halamannya.

## 3. Keputusan Rancangan

### 3.1 Relasi wali↔anak harus berbasis akun, bukan nomor HP

`santri.wali_hp` tidak boleh dipakai sebagai dasar otorisasi. Nomor HP bisa
diketik siapa saja, berganti pemilik, dan tidak membuktikan apa pun. Memakainya
berarti siapa pun yang tahu nomor HP wali bisa membaca data anak orang lain.

Karena itu: tabel relasi baru `wali_santri`, mengacu `users(id)` di kedua sisi.

### 3.2 Wali tidak boleh mengklaim anak sendiri — harus diundang

Alur yang **ditolak**: wali mengetik nama/NIS anak lalu langsung tersambung.
Ini membuka kebocoran data anak.

Alur yang **dipakai**: lembaga (admin/ustadz) atau santri dewasa menerbitkan
**kode undangan** berumur pendek. Wali memasukkan kode itu. Kode sekali pakai,
kedaluwarsa, dan tercatat siapa yang menerbitkan.

```
Admin TPQ  ──terbitkan kode──►  WALI-7F3K2M  (berlaku 7 hari, sekali pakai)
                                     │
Wali  ──masukkan kode──────────────►  relasi wali_santri dibuat
                                     │
                                     └── tercatat: siapa menerbitkan, kapan dipakai
```

### 3.3 Satu anak boleh punya lebih dari satu wali

Ayah dan ibu keduanya berhak melihat. `pilot_participants.guardian_user_id`
hanya menampung satu, karena itu tidak dipakai sebagai fondasi.

### 3.4 Wali membaca, tidak menulis

Wali **tidak boleh** mencentang habit anak. Kalau orang tua bisa mencentang,
angka streak berhenti berarti apa-apa dan sistemnya berubah jadi teater.

Satu-satunya tulisan yang boleh dilakukan wali: **konfirmasi mingguan** ke
`habit_guardian_weekly` — sekadar menyatakan "sesuai pantauan saya",
"perlu dibicarakan", atau "belum sempat". Nilai `CHECK` ini sudah ada di
skema `0053`, tinggal dipakai.

### 3.5 Nada halaman: menumbuhkan, bukan menghakimi

Rancangan sengaja **tidak** menampilkan peringkat antaranak, dan tidak memakai
warna merah untuk hari yang terlewat. Anak yang shalatnya bolong lalu dimarahi
karena dashboard bukan hasil yang diinginkan.

Yang ditonjolkan: perkembangan dari pekan lalu, streak terpanjang, dan satu
saran percakapan konkret untuk orang tua.

## 4. Skema Data (migrasi `0072`)

### 4.1 Relasi wali ↔ santri (dari v1, tetap)

```sql
-- Relasi wali ↔ santri berbasis akun.
CREATE TABLE IF NOT EXISTS wali_santri (
  id            TEXT PRIMARY KEY,
  wali_user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  santri_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hubungan      TEXT NOT NULL CHECK (hubungan IN ('ayah','ibu','wali')),
  lembaga_id    TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'aktif'
                  CHECK (status IN ('aktif','dicabut')),
  dibuat_oleh   TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at    INTEGER NOT NULL,
  revoked_at    INTEGER,
  UNIQUE(wali_user_id, santri_user_id)
);

-- Kode undangan sekali pakai.
CREATE TABLE IF NOT EXISTS wali_undangan (
  kode           TEXT PRIMARY KEY,
  santri_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lembaga_id     TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  hubungan       TEXT NOT NULL CHECK (hubungan IN ('ayah','ibu','wali')),
  diterbitkan_oleh TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at     INTEGER NOT NULL,
  dipakai_oleh   TEXT REFERENCES users(id) ON DELETE SET NULL,
  dipakai_at     INTEGER,
  created_at     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wali_santri_wali ON wali_santri(wali_user_id, status);
CREATE INDEX IF NOT EXISTS idx_wali_santri_santri ON wali_santri(santri_user_id, status);
CREATE INDEX IF NOT EXISTS idx_wali_undangan_santri ON wali_undangan(santri_user_id);
```

### 4.2 Afiliasi santri ↔ lembaga — TANPA tabel baru

Dipakai `organization_memberships` yang sudah ada (role `santri`). Yang perlu
ditambah hanya **alur UI** dan satu kolom penanda afiliasi utama:

```sql
-- Santri boleh anggota beberapa lembaga (TPQ + rumah tahfidz), tapi satu
-- yang menjadi induk pendidikannya — untuk rapor dan tampilan "aku santri di…".
ALTER TABLE organization_memberships ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_memberships_primary
  ON organization_memberships(user_id, is_primary) WHERE is_primary = 1;
```

Aturan: maksimal satu `is_primary=1` per user (dijaga di lapisan service,
SQLite tidak bisa menegakkannya lintas baris dengan sederhana).

Alur bergabung memakai pola yang SAMA dengan undangan wali: lembaga
menerbitkan kode santri (atau menyetujui permintaan), supaya tidak ada orang
asing mengaku-ngaku santri sebuah pondok. Yang memilih tetap santri; yang
mengesahkan lembaga.

### 4.3 Rapor-sertifikat — perluasan tabel `certificates` yang sudah ada

Tabel `certificates` sudah ada di produksi (0 baris, belum pernah dipakai)
tapi rangkanya kurang untuk rapor lembaga: tidak ada `org_id`, tidak ada slug
publik, dan isinya baru angka hafalan. Diperluas, bukan diganti:

```sql
ALTER TABLE certificates ADD COLUMN org_id TEXT REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE certificates ADD COLUMN jenis TEXT NOT NULL DEFAULT 'sertifikat'
  -- 'sertifikat' = selembar kelulusan; 'rapor' = pencapaian berkala
  CHECK (jenis IN ('sertifikat','rapor'));
ALTER TABLE certificates ADD COLUMN periode_mulai TEXT;   -- YYYY-MM-DD, awal terhitung
ALTER TABLE certificates ADD COLUMN periode_selesai TEXT; -- YYYY-MM-DD
ALTER TABLE certificates ADD COLUMN slug TEXT UNIQUE;     -- untuk /s/[slug]
ALTER TABLE certificates ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0;
ALTER TABLE certificates ADD COLUMN payload TEXT;         -- JSON isi rapor (snapshot)

CREATE INDEX IF NOT EXISTS idx_certificates_org ON certificates(org_id, issued_at DESC);
```

**`payload` adalah snapshot, bukan kueri ulang.** Saat lembaga menerbitkan
rapor, sistem menghitung dari `learn_progress`, `hafalan_progress`,
`tpq_setoran`, `habit_streaks` lalu MEMBEKUKAN hasilnya sebagai JSON:

```json
{
  "lama_pendidikan": { "mulai": "2025-01-10", "selesai": "2026-06-30", "hari": 536 },
  "kitab_selesai": [
    { "kitab_slug": "safinatun-najah-makna-perkata", "judul": "Safinatun Najah", "level_tuntas": 8, "dari_level": 8 },
    { "kitab_slug": "terjemah-aqidatul-awam", "judul": "Aqidatul Awam", "level_tuntas": 6, "dari_level": 6 }
  ],
  "hafalan": [
    { "kategori": "Juz 30", "tuntas": 37, "dari": 37 },
    { "kategori": "Doa Harian", "tuntas": 25, "dari": 30 }
  ],
  "habit": {
    "periode_hari": 180,
    "shalat_5_waktu": { "persen": 87 },
    "ngaji_harian": { "persen": 92, "streak_terbaik": 41 }
  },
  "catatan_lembaga": "Alhamdulillah, Zaid istiqamah …"
}
```

Alasan snapshot: rapor adalah dokumen — angkanya tidak boleh berubah setelah
diterbitkan hanya karena data hidup terus bergerak, dan halaman publiknya
tidak boleh menjalankan kueri berat ke tabel-tabel hidup.

Slug sertifikat: `[slug-lembaga]-[nama-pendek]-[acak4]`, contoh
`tpq-alhidayah-zaid-7f3k`. Acak 4 karakter supaya tidak bisa ditebak-urut.

### 4.4 Halaman publik `/s/[slug]`

- Hanya tampil bila `is_public = 1` — **keputusan santri/wali, bukan lembaga**.
  Bawaan privat.
- Yang privat dibalas 404 (bukan 403), supaya keberadaannya tidak bocor.
- Isinya dari `payload` beku + nama lembaga + tanggal terbit. Tanpa data
  kontak, tanpa tanggal lahir.
- Ini pengganti ijazah yang bisa dibagikan: grup keluarga, lamaran mengajar,
  pendaftaran jenjang berikutnya. Sekaligus pintu masuk organik: setiap rapor
  yang dibagikan membawa nama lembaga + SantriOnline.

## 5. Rute

| Rute | Isi |
|---|---|
| `/wali` | Daftar anak. Bila satu anak, langsung dialihkan ke detailnya |
| `/wali/[santriId]` | Dashboard satu anak |
| `/wali/hubungkan` | Formulir memasukkan kode undangan |
| `/api/wali/konfirmasi` | POST konfirmasi mingguan → `habit_guardian_weekly` |
| `/lembaga/wali-undangan` | Sisi admin: terbitkan & cabut kode wali |
| `/akun/lembagaku` | **Santri memilih/melihat lembaga induknya**, masukkan kode gabung |
| `/lembaga/santri-undangan` | Sisi admin: kode gabung santri + sahkan permintaan |
| `/lembaga/rapor` | Sisi admin: susun & terbitkan rapor/sertifikat per santri |
| `/sertifikat` | Sisi santri: daftar rapornya (rute SUDAH ADA, disambungkan) |
| `/s/[slug]` | **Halaman publik** rapor-sertifikat (privat = 404) |

Semua kecuali `/s/[slug]` di bawah `src/routes/(app)/`, memakai shell yang ada.

### Dashboard santri mandiri (tanpa wali)

Santri tanpa relasi `wali_santri` TIDAK kehilangan apa pun:

- `/habit` dan `/belajar` yang sudah ada tetap dashboard pribadinya;
- kartu "Perjalananku di [lembaga]" ditambahkan ke `/dashboard` — lama
  menempuh, kitab tuntas, hafalan, streak — data yang sama yang dilihat wali,
  dilihat sendiri;
- konfirmasi mingguan wali tidak tampil; diganti refleksi pribadi ringan
  (opsional, tanpa paksaan);
- rapor-sertifikat akhir tetap terbit dari lembaganya, sama persis.

Dengan begitu "tanpa wali" bukan kondisi cacat data, melainkan jalur yang
memang dirancang.

## 6. Isi Dashboard Anak

```
┌────────────────────────────────────────────┐
│  Zaid · TPQ Al-Hidayah · kelas 2           │
├────────────────────────────────────────────┤
│  Pekan ini                                 │
│  Shalat 5 waktu    ███████░░  5 dari 7 hari│
│  Ngaji harian      █████████  7 dari 7 hari│
│  Streak terpanjang 12 hari 🔥              │
├────────────────────────────────────────────┤
│  Belajar                                   │
│  Aqidah Aswaja     level 3 · 2 badge baru  │
│  Bahasa Arab 1     level 1                 │
├────────────────────────────────────────────┤
│  Hafalan                                   │
│  Setoran terakhir  An-Naba 1–20 (3 hari lalu)│
├────────────────────────────────────────────┤
│  Bahan obrolan pekan ini                   │
│  "Zaid konsisten ngaji 7 hari penuh.       │
│   Coba tanyakan bagian mana yang paling    │
│   dia suka — apresiasi lebih menempel      │
│   daripada teguran."                       │
├────────────────────────────────────────────┤
│  Konfirmasi pekan ini                      │
│  ( ) Sesuai pantauan saya                  │
│  ( ) Perlu dibicarakan                     │
│  ( ) Belum sempat memantau                 │
│  [catatan singkat untuk ustadz…]           │
└────────────────────────────────────────────┘
```

Bagian "Bahan obrolan" dihitung dari data, bukan LLM — supaya tidak ada biaya
per tampilan dan tidak ada risiko kalimat yang tidak diinginkan.

## 7. Aturan Keamanan

1. Setiap `load` memanggil `assertWaliDariSantri(db, waliId, santriId)`. Bila
   tidak ada baris `wali_santri` berstatus `aktif`, balas **404** (bukan 403 —
   403 membocorkan bahwa anak itu ada).
2. Wali hanya melihat data anak yang tersambung. Tidak ada rute yang menerima
   `santriId` tanpa pemeriksaan relasi.
3. Kode undangan: minimal 8 karakter acak kriptografis, huruf-angka tanpa
   karakter rancu (0/O, 1/I), kedaluwarsa maksimal 7 hari, sekali pakai.
4. Wali tidak pernah melihat data santri lain, termasuk peringkat kelas.
5. Pencabutan relasi berlaku seketika (`status = 'dicabut'`), tidak dihapus,
   agar jejaknya tetap terbaca saat audit.

## 8. Urutan Pengerjaan (v2)

| Tahap | Isi | Perkiraan |
|---|---|---|
| A | Migrasi `0072` (wali_santri + wali_undangan + is_primary + perluasan certificates) + `wali/service.ts` + tes | 1 sesi |
| B | `/wali/hubungkan` + `/akun/lembagaku` + kode undangan sisi admin (wali & santri — satu pola, dua pintu) | 1–2 sesi |
| C | `/wali/[santriId]` — habit, belajar, hafalan + kartu "Perjalananku" untuk santri mandiri | 1–2 sesi |
| D | Konfirmasi mingguan + bahan obrolan | 1 sesi |
| E | Rapor-sertifikat: penyusun snapshot + `/lembaga/rapor` + `/s/[slug]` publik + sambungkan `/sertifikat` lama | 2 sesi |

Tahap A dan B lebih dulu: tanpa relasi yang aman, halaman secantik apa pun
tidak boleh ditayangkan. Tahap E terakhir karena bergantung pada data yang
mengalir dari A–D — dan rapor pertama baru bermakna setelah ada isi.

## 9. Yang Sengaja Ditunda

- Notifikasi push mingguan ke wali (infrastruktur `push_subscriptions` sudah
  ada di `0068`, tapi jangan ditambahkan sebelum halamannya terbukti dipakai).
- Rapor karakter bulanan berformat PDF.
- Percakapan wali↔ustadz. Ini kebutuhan nyata, tapi membuka ruang moderasi
  yang belum siap ditangani.
