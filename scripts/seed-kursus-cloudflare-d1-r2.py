#!/usr/bin/env python3
"""
Seed kursus "Bangun & Deploy Aplikasi Edge dalam 1 Hari".

Disusun dari deck Kursus-1-Cloudflare-D1-R2.pptx (16 slide, 7 modul).
Berkas PPT diunggah ke R2 dan ditautkan dari materi, bukan disimpan di Git.
"""
import pathlib
import time

SEKARANG = int(time.time() * 1000)
KURSUS_ID = "kursus-cloudflare-d1-r2"
SLUG = "bangun-deploy-aplikasi-edge-1-hari"
PPT_URL = (
    "https://files.santrionline.com/kursus/cloudflare-d1-r2/"
    "Kursus-1-Cloudflare-D1-R2.pptx"
)


def kutip(teks: str) -> str:
    return "'" + teks.replace("'", "''") + "'"


MATERI = [
    (
        "Pengantar — apa yang Anda miliki di akhir kursus",
        f"""Ini **Kursus 1 dari 2**. Tujuh modul, studi kasus nyata, dari nol sampai aplikasi **LIVE**.

**Judul deck:** Bangun & Deploy Aplikasi Edge dalam 1 Hari.

Anda akan memakai **Cloudflare D1 + R2**, **WSL**, **Wrangler**, dan **GitHub** — sampai kelola website cukup dari Telegram.

## Unduh slide resmi

[Unduh PPT: Kursus 1 — Cloudflare D1 + R2]({PPT_URL})

Simpan berkas itu. Setiap modul di bawah merujuk slide yang sama.

## Hasil di akhir kursus

1. **Aplikasi live di edge** — form pendaftaran online + unggah berkas, berjalan di jaringan global Cloudflare, tanpa sewa VPS.
2. **Database & storage siap pakai** — data di D1, berkas di R2. Keduanya punya paket gratis untuk mulai.
3. **Portofolio di GitHub** — kode tersimpan dan terdokumentasi di repositori publik.
4. **Kelola website dari Telegram** — perintah singkat → agent AI (Hermes) menjalankan Wrangler → website atau subdomain baru aktif.

Lanjut ke kamus istilah dulu. Jangan lompat ke perintah sebelum kata-katanya jelas.
""",
    ),
    (
        "Kamus istilah — Cloudflare, D1, R2, GitHub",
        """Tanpa kamus ini, perintah di terminal terasa seperti bahasa asing. Baca sekali, lalu pakai sebagai rujukan.

## Fondasi

**Cloudflare** — perusahaan jaringan global dengan 300+ kota data center. Selain CDN, ini platform hosting lengkap: Workers, Pages, D1, R2, dan DNS.

**Serverless** — “tanpa server” bukan berarti servernya tidak ada. Artinya Anda tidak mengurusnya. Bayar hanya saat kode berjalan.

**Edge** — kode dijalankan di server terdekat dengan pengunjung. Pengunjung Surabaya dilayani dari Singapura, bukan Amerika. Responsnya cepat di mana pun.

## Perkakas inti

**D1** — database SQL Cloudflare (berbasis SQLite). Tempat data terstruktur: nama, email, tanggal daftar. Analogi: lemari arsip berlaci rapi.

Dokumentasi: [developers.cloudflare.com/d1](https://developers.cloudflare.com/d1/)

**R2** — penyimpanan objek: foto, PDF, video, PPT. Kompatibel dengan S3 Amazon, tanpa biaya egress saat berkas diunduh. Analogi: gudang penitipan barang.

Dokumentasi: [developers.cloudflare.com/r2](https://developers.cloudflare.com/r2/)

**Wrangler** — alat baris perintah resmi Cloudflare. Satu perintah untuk membuat database, bucket, mengatur domain, sampai menerbitkan aplikasi. Analogi: remote control Cloudflare.

## Alur kode

| Istilah | Artinya |
|---|---|
| **GitHub** | Tempat kode hidup secara daring, berbasis Git |
| **Commit** | Titik simpan — seperti save point di game |
| **Push** | Mengirim commit dari WSL ke GitHub |
| **Deploy** | Menerbitkan aplikasi agar bisa dibuka publik |

Di kursus ini: satu perintah `wrangler deploy` → aplikasi live di edge.
""",
    ),
    (
        "Modul 1–2 — kenapa serverless, lalu siapkan WSL",
        """## Modul 1 — VPS vs Cloudflare

| | VPS tradisional | Cloudflare serverless |
|---|---|---|
| Biaya awal | Rp75–300 ribu / bulan, jalan terus | Rp0 — paket gratis cukup untuk mulai |
| Perawatan | Update OS, keamanan, backup sendiri | Diurus Cloudflare |
| Skala | Upgrade manual saat trafik naik | Otomatis menyesuaikan trafik |
| Kecepatan global | Satu lokasi server | 300+ lokasi edge |

Inilah alasan SantriOnline tidak menyewa VPS untuk aplikasi utamanya.

## Modul 2 — environment di WSL

Semua perintah dijalankan dari **WSL (Windows Subsystem for Linux)**. Bukan PowerShell, bukan Git Bash.

Urutan pasang:

1. **WSL2 + Ubuntu** — dari PowerShell admin: `wsl --install -d Ubuntu`
2. **Tool dasar** — `build-essential`, `curl`, `git`, `unzip`
3. **Node.js via nvm** — `nvm install --lts` (jangan pakai `apt` untuk Node)
4. **pnpm** — opsional, lebih cepat: `npm install -g pnpm`
5. **Wrangler** — `npm install -g wrangler`
6. **GitHub CLI** — `sudo apt install gh`, lalu `gh auth login`

Contoh rangkaian di terminal WSL:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl git unzip ca-certificates gh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc && nvm install --lts
npm install -g pnpm wrangler
git config --global user.name "Nama"
git config --global user.email "e@mail"
gh auth login
```

Setelah semua siap, barulah instal Hermes Agent.

Panduan WSL: [learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)
""",
    ),
    (
        "Modul 3–4 — Wrangler, D1, R2, dan API Token",
        """## Modul 3 — tiga perintah pertama

```bash
wrangler login
wrangler d1 create db-kursus
wrangler r2 bucket create berkas-kursus
```

- `wrangler login` — autentikasi lewat browser, menghubungkan CLI ke akun Cloudflare (gratis daftar).
- `wrangler d1 create` — membuat database D1. **Catat `database_id`** untuk file konfigurasi.
- `wrangler r2 bucket create` — membuat wadah penyimpanan untuk file unggahan.

`wrangler login` cocok untuk pemakaian manual. Untuk otomasi via Telegram (Modul 6), perlu cara lain: **API Token**.

Dokumentasi Wrangler: [developers.cloudflare.com/workers/wrangler](https://developers.cloudflare.com/workers/wrangler/)

## Modul 4 — syarat wajib otomasi

API Token = izin resmi agar Wrangler dan Hermes bisa memerintah Cloudflare **tanpa login browser**. Tanpa token ini, otomasi Telegram tidak jalan.

Langkah:

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → login
2. Ikon profil → **My Profile** → tab **API Tokens**
3. **Create Token** → template “Edit zone DNS”, tambah izin Workers & Pages
4. Batasi ke domain tertentu → **Create** → **salin token** (muncul sekali)
5. Simpan di WSL sebagai environment variable

```bash
export CLOUDFLARE_API_TOKEN="cf_xxx"
source ~/.bashrc
wrangler whoami
```

Token = kunci rumah Anda. Jangan dibagikan. Jangan ikut di-commit ke GitHub. Bocor? Cabut (revoke) dan buat baru.

Halaman token: [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
""",
    ),
    (
        "Modul 5–6 — form + R2, lalu website dari Telegram",
        """## Modul 5 — studi kasus aplikasi

Satu kasus, dua fitur:

- Pengunjung mengisi form + unggah file
- Cloudflare Worker menyediakan API: `POST /daftar` dan `GET /peserta`
- **D1** menyimpan data pendaftar (nama, email, waktu daftar)
- **R2** menyimpan berkas (foto / KTP / PDF)

Pola ini mudah dipetakan ke kebutuhan nyata: pendaftaran event, santri, member, atau lowongan.

SantriOnline sendiri memakai pola yang sama: D1 untuk data terstruktur, R2 untuk berkas.

## Modul 6 — puncak kursus

Alur:

**Telegram (HP Anda)** → **Hermes Agent di WSL** → **Wrangler + API Token** → **website LIVE**

Syarat sebelum mulai:

1. API Token (Modul 4) sudah tersimpan di WSL
2. Domain sudah dibeli dan zone-nya aktif di Cloudflare — Wrangler mengatur DNS/deploy, **tidak bisa membeli domain**
3. Bot Telegram sudah dibuat — dibahas tuntas di **Kursus 2**

Contoh perintah yang dikirim dari HP:

- “Buat website baru dengan domain utama …”
- “Tambahkan subdomain english.…”

Semua eksekusi tetap terjadi di WSL. Telegram hanya remote-nya.
""",
    ),
    (
        "Modul 7 — commit, push, deploy, plus unduh slide",
        f"""## Alur yang dibawa pulang

1. `git init` — mulai pencatatan versi
2. `git add .` — pilih perubahan
3. `git commit` — rekam titik simpan + pesan
4. `git push` / `gh repo create` — kirim ke GitHub
5. `wrangler deploy` — aplikasi LIVE di edge

Tiga kata: **CATAT → KIRIM → TERBITKAN**.

## Bukti nyata

`santrionline.com` dikelola dengan alur ini:

- Hosting & deploy di Cloudflare Pages + Workers
- D1 menyimpan data, R2 menyimpan berkas
- Setiap perubahan melalui commit → push ke GitHub sebelum deploy
- Subdomain & update harian lewat perintah Telegram ke Hermes

## Referensi

- WSL: [learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)
- nvm: [github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm)
- Wrangler: [developers.cloudflare.com/workers/wrangler](https://developers.cloudflare.com/workers/wrangler/)
- D1: [developers.cloudflare.com/d1](https://developers.cloudflare.com/d1/)
- R2: [developers.cloudflare.com/r2](https://developers.cloudflare.com/r2/)
- API Tokens: [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
- Telegram Bot API: [core.telegram.org/bots/api](https://core.telegram.org/bots/api)
- GitHub (ID): [docs.github.com/id](https://docs.github.com/id)

## Slide dan rundown video

[Unduh PPT resmi Kursus 1]({PPT_URL})

Rundown produksi (total ± 2 jam 15 menit):

| Modul | Isi | Durasi |
|---|---|---|
| 1 | Kenapa serverless & edge | ± 15 mnt |
| 2 | Setup WSL & paket CLI | ± 25 mnt |
| 3 | Login & buat D1 + R2 | ± 10 mnt |
| 4 | Ambil & pasang API Token | ± 10 mnt |
| 5 | Bangun studi kasus aplikasi | ± 40 mnt |
| 6 | Otomasi website via Telegram | ± 20 mnt |
| 7 | Commit, push, deploy + penutup | ± 15 mnt |

Satu hari belajar, website dikendalikan dari genggaman.
""",
    ),
]


def bangun() -> str:
    baris = [
        "-- Seed kursus 'Bangun & Deploy Aplikasi Edge dalam 1 Hari'.",
        "-- Dihasilkan oleh scripts/seed-kursus-cloudflare-d1-r2.py.",
        "-- Aman dijalankan ulang: INSERT OR REPLACE dengan id tetap.",
        "-- PPT di R2: files.santrionline.com/kursus/cloudflare-d1-r2/Kursus-1-Cloudflare-D1-R2.pptx",
        "",
        "INSERT OR REPLACE INTO kursus "
        "(id, slug, judul, ringkasan, deskripsi, harga_koin, level, kategori, "
        "sampul_url, durasi_menit, status, urutan, created_at, updated_at) VALUES ("
        f"{kutip(KURSUS_ID)}, "
        f"{kutip(SLUG)}, "
        f"{kutip('Bangun & Deploy Aplikasi Edge dalam 1 Hari')}, "
        f"{kutip('Cloudflare D1 + R2, WSL, Wrangler, dan GitHub — sampai kelola website cukup dari Telegram. Termasuk slide PPT resmi.')}, "
        f"{kutip('Kursus 1 dari 2. Tujuh modul dari kamus istilah sampai commit-push-deploy, plus studi kasus form + unggah berkas.')}, "
        f"0, {kutip('dasar')}, {kutip('Teknologi & Platform')}, NULL, 135, "
        f"'published', 5, {SEKARANG}, {SEKARANG});",
        "",
    ]

    for i, (judul, isi) in enumerate(MATERI, start=1):
        baris.append(
            "INSERT OR REPLACE INTO kursus_materi "
            "(id, kursus_id, judul, isi, urutan, durasi_menit, created_at, updated_at) VALUES ("
            f"{kutip(f'{KURSUS_ID}-m{i}')}, {kutip(KURSUS_ID)}, {kutip(judul)}, "
            f"{kutip(isi)}, {i}, 22, {SEKARANG}, {SEKARANG});"
        )

    return "\n".join(baris) + "\n"


if __name__ == "__main__":
    tujuan = (
        pathlib.Path(__file__).resolve().parent.parent
        / "migrations"
        / "0077_seed_kursus_cloudflare_d1_r2.sql"
    )
    tujuan.write_text(bangun(), encoding="utf-8")
    print(f"Ditulis: {tujuan}")
    print(f"  1 kursus, {len(MATERI)} materi")
