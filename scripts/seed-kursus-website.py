#!/usr/bin/env python3
"""
Seed kursus "Membangun Website Sendiri" — kurikulum lengkap dari nol.

Disusun dari 37 pertanyaan nyata seorang pemula yang ingin membangun
platformnya sendiri di atas Cloudflare + GitHub. Urutannya sengaja
bertahap: istilah dasar, Cloudflare, GitHub, dashboard, lalu monetisasi.
"""
import pathlib
import time

SEKARANG = int(time.time() * 1000)
KURSUS_ID = "kursus-bangun-website"


def kutip(teks: str) -> str:
    return "'" + teks.replace("'", "''") + "'"


MATERI = [
    (
        "Tahap 1 — Istilah dasar yang wajib dipahami",
        """Sebelum menyentuh alat apa pun, tujuh istilah ini perlu jelas dahulu. Tanpa ini, semua tahap berikutnya terasa seperti bahasa asing.

## UI dan UX

**UI (User Interface)** adalah apa yang Anda **lihat**: tombol, warna, huruf, tata letak.

**UX (User Experience)** adalah apa yang Anda **rasakan**: mudah atau membingungkan, cepat atau lambat, menyenangkan atau melelahkan.

Perumpamaannya seperti rumah makan:

- **UI** — piring, meja, penataan ruangan
- **UX** — apakah pesanan cepat datang, apakah kursinya nyaman, apakah kamar mandinya mudah ditemukan

Rumah makan bisa berpiring indah tetapi pelayanannya lambat. Itu UI bagus, UX buruk.

## Frontend dan backend

**Frontend** adalah bagian yang berjalan di HP atau komputer pengunjung. Tampilan, tombol, animasi.

**Backend** adalah bagian yang berjalan di server. Memeriksa password, menyimpan data, menghitung transaksi.

Perumpamaan rumah makan lagi:

- **Frontend** — ruang makan yang dilihat tamu
- **Backend** — dapur yang tidak terlihat, tempat masakan benar-benar dibuat

Tamu tidak perlu tahu isi dapur. Tetapi tanpa dapur, tidak ada yang bisa disajikan.

## Database

**Database** adalah tempat menyimpan data secara rapi dan bisa dicari kembali.

Kenapa website butuh database? Karena data harus bertahan.

Bila pengguna mendaftar hari ini, datanya harus masih ada besok, minggu depan, tahun depan. Tanpa database, semua hilang begitu server dimatikan.

Yang disimpan biasanya: akun pengguna, isi artikel, riwayat transaksi, dan pengaturan.

## CRUD — ini yang paling penting untuk Anda

**CRUD** adalah empat hal yang bisa dilakukan terhadap data. Ini singkatan:

| Huruf | Arti | Contoh nyata |
|---|---|---|
| **C** — Create | Membuat | Menambah artikel baru |
| **R** — Read | Membaca | Melihat daftar pasien |
| **U** — Update | Mengubah | Memperbaiki harga yang salah |
| **D** — Delete | Menghapus | Membuang data ganda |

Terdengar sederhana, tetapi **hampir seluruh aplikasi hanyalah CRUD**.

Instagram? Create foto, Read beranda, Update caption, Delete unggahan.
Aplikasi klinik? Create pasien, Read rekam medis, Update diagnosis, Delete data keliru.

## Kenapa CRUD penting bagi superadmin

Sebagai pemilik website, Anda adalah orang yang paling sering memakai CRUD.

Setiap kali Anda:

- menambah pengguna baru → **Create**
- melihat laporan penjualan → **Read**
- mengubah harga produk → **Update**
- menghapus komentar kasar → **Delete**

Anda sedang memakai CRUD.

Bila dashboard Anda tidak punya keempatnya untuk setiap jenis data, akan ada saat Anda terpaksa menghubungi programmer hanya untuk mengubah satu angka. Itu melelahkan dan mahal.

Karena itu, ketika merancang dashboard, tanyakan untuk **setiap jenis data**: apakah saya bisa menambah, melihat, mengubah, dan menghapusnya sendiri?

## API

**API** adalah cara dua program berbicara satu sama lain.

Perumpamaan: pelayan di rumah makan.

Anda tidak masuk ke dapur untuk mengambil makanan. Anda bilang ke pelayan, pelayan menyampaikan ke dapur, lalu membawakan hasilnya.

API adalah pelayan itu.

Kenapa dibutuhkan? Karena frontend tidak boleh menyentuh database secara langsung — berbahaya. Semua permintaan lewat API, dan API yang memeriksa: apakah orang ini berhak?

## Domain dan subdomain

**Domain** adalah alamat utama: `elmozza.com`

**Subdomain** adalah cabang di depannya:

- `klinik.elmozza.com`
- `english.elmozza.com`
- `catatandokter.elmozza.com`

Perumpamaan: domain adalah nama gedung, subdomain adalah nomor lantai.

Yang penting: **subdomain tidak perlu dibeli lagi.** Satu domain bisa punya ratusan subdomain tanpa biaya domain tambahan.""",
    ),
    (
        "Tahap 2 — Cloudflare: rumah bagi website Anda",
        """Seluruh website bisa berjalan di Cloudflare tanpa menyewa server sendiri. Ini menjelaskan caranya.

## Apa itu Cloudflare

Cloudflare awalnya perusahaan keamanan dan pemercepat website. Kini ia juga menyediakan tempat menjalankan website secara utuh.

Yang membuatnya berbeda: Cloudflare punya komputer di **ratusan kota di dunia**. Website Anda disalin ke semuanya. Pengunjung dari Surabaya dilayani dari server terdekat, bukan dari Amerika.

## Layanan yang perlu Anda kenal

Hanya empat. Selebihnya bisa menyusul.

**Pages** — tempat menaruh website. Anda sambungkan ke GitHub, dan setiap perubahan kode otomatis tayang.

**Workers** — tempat menjalankan logika backend. Memeriksa password, memproses pembayaran, mengirim email.

Bedanya Pages dan Workers? Pages untuk **halaman**, Workers untuk **pekerjaan**. Dalam praktiknya keduanya sering dipakai bersama, dan sekarang batasnya makin kabur.

**D1** — database. Tempat menyimpan pengguna, artikel, transaksi.

**R2** — penyimpanan berkas. Gambar, PDF, video. Data biasa ke D1, berkas besar ke R2.

## Cloudflare dibanding sewa VPS

VPS adalah menyewa komputer di pusat data. Anda mengurus semuanya sendiri.

| | VPS | Cloudflare |
|---|---|---|
| Biaya bulanan | Rp80.000–500.000 tetap | Bayar sesuai pemakaian |
| Perawatan server | Anda | Cloudflare |
| Pembaruan keamanan | Anda | Cloudflare |
| Lokasi server | Satu tempat | Ratusan kota |
| Website sepi | Tetap bayar penuh | Nyaris nol |

Untuk website yang baru mulai, Cloudflare jauh lebih hemat — karena Anda tidak membayar server yang menganggur.

Contoh nyata: satu bulan pemakaian bisa hanya sekitar **0,7 dolar** (kurang dari dua belas ribu rupiah). Sewa VPS dengan kemampuan setara jauh lebih mahal.

## Menambah subdomain

Prosesnya singkat:

1. Masuk ke dashboard Cloudflare
2. Pilih domain Anda
3. Buka menu **DNS**
4. Klik **Add record**, isi nama subdomainnya
5. Di Cloudflare Pages, tambahkan sebagai **custom domain**

Selesai. Biasanya aktif dalam hitungan menit.

## Biaya bila punya banyak subdomain

Subdomain sendiri **tidak dikenakan biaya**. Yang dihitung adalah pemakaian: berapa banyak permintaan yang dilayani dan berapa data yang disimpan.

Seribu subdomain yang sepi lebih murah daripada satu subdomain yang sangat ramai.

## Bisakah 24/7 tanpa VPS?

Bisa, dan justru lebih andal.

Alasannya: website Anda tidak berada di satu komputer. Ia disalin ke ratusan lokasi. Bila satu pusat data mati, yang lain mengambil alih tanpa Anda melakukan apa pun.

Bandingkan dengan VPS: satu komputer, satu lokasi. Bila mati, website mati.

Sebagai gambaran, perusahaan-perusahaan teknologi besar dunia memakai Cloudflare untuk melayani lalu lintas mereka. Skala layanannya sudah teruji jauh di atas kebutuhan sebuah klinik atau penerbit.

## DNS record

DNS adalah buku alamat internet. Ia menerjemahkan nama (`elmozza.com`) menjadi alamat komputer.

Empat jenis yang perlu dikenal:

| Jenis | Fungsi | Contoh pemakaian |
|---|---|---|
| **A** | Menunjuk ke alamat IP | Website utama |
| **CNAME** | Menunjuk ke nama lain | Subdomain ke Cloudflare Pages |
| **MX** | Ke mana email dikirim | Agar email masuk |
| **TXT** | Catatan teks bebas | Verifikasi kepemilikan, keamanan email |

Yang paling sering Anda pakai: **CNAME** untuk subdomain, dan **TXT** ketika memasang layanan pengirim email.""",
    ),
    (
        "Tahap 3 — GitHub: menyimpan dan menerbitkan kode",
        """GitHub sering membingungkan pemula karena istilahnya terdengar teknis. Padahal idenya sederhana.

## Apa itu GitHub

**GitHub adalah tempat menyimpan kode** — dengan seluruh riwayat perubahannya.

Bayangkan menulis buku di Word, dan setiap kali menyimpan, Word menyimpan versi baru **tanpa menimpa yang lama**. Anda bisa kembali ke versi minggu lalu kapan saja, dan bisa melihat persis apa yang berubah.

Itulah yang GitHub lakukan untuk kode.

Kegunaan keduanya: menjadi jembatan ke Cloudflare. Anda kirim kode ke GitHub, Cloudflare mengambilnya dan menayangkannya. Otomatis.

## Repository

**Repository** (sering disingkat "repo") adalah satu folder proyek beserta seluruh riwayatnya.

Satu website = satu repository. Bila Anda punya elmozza.com dan proyek lain, itu dua repository terpisah.

## Commit dan push

Dua kata yang paling sering dipakai.

**Commit** = menyimpan perubahan beserta catatan.

Seperti menekan Ctrl+S, tetapi Anda juga menulis keterangan: *"memperbaiki harga yang salah di halaman produk"*. Catatan ini yang membuat riwayat berguna — enam bulan lagi Anda masih paham apa yang berubah dan kenapa.

**Push** = mengirim simpanan itu ke GitHub.

Commit menyimpan di komputer Anda. Push mengunggahnya. Setelah push, kode aman meski laptop Anda rusak.

## Alur dari menulis kode sampai tayang

Inilah rangkaian lengkapnya:

```
1. Tulis atau ubah kode
2. git commit    → simpan dengan catatan
3. git push      → kirim ke GitHub
4. Cloudflare mendeteksi perubahan
5. Cloudflare membangun website
6. Website tayang di internet
```

Langkah 4 sampai 6 berjalan **sendiri**. Anda hanya mengerjakan tiga langkah pertama.

## Deploy dan auto-deploy

**Deploy** artinya menerbitkan — memindahkan kode dari komputer ke internet sehingga bisa dibuka orang.

**Auto-deploy** artinya itu terjadi otomatis setiap kali Anda push.

Dahulu, menerbitkan website berarti menyalin berkas satu per satu ke server. Sekarang cukup `git push`, sisanya ditangani.

## Branch dan branch main

**Branch** adalah jalur pengerjaan yang terpisah.

Perumpamaan: Anda sedang menulis buku, lalu ingin mencoba mengubah satu bab besar-besaran. Anda buat salinan, coba di salinan itu. Bila hasilnya bagus, gabungkan. Bila jelek, buang — naskah asli tetap utuh.

**Branch `main`** adalah jalur utama — versi resmi yang tayang di internet.

Aturan praktis: apa pun yang masuk ke `main` akan langsung tayang. Karena itu percobaan sebaiknya dilakukan di branch lain dahulu.""",
    ),
    (
        "Tahap 4 — Dashboard dan superadmin",
        """Ini bagian yang paling sering Anda pakai sehari-hari sebagai pemilik platform.

## Apa itu dashboard admin

**Dashboard** adalah halaman khusus pengelola — tidak terlihat oleh pengunjung biasa.

Isinya biasanya:

- **Ringkasan** — berapa pengguna, berapa penjualan hari ini
- **Kelola data** — daftar pengguna, artikel, produk
- **Pengaturan** — nama situs, logo, harga
- **Laporan** — grafik dan angka

Yang membuat dashboard baik bukan banyaknya fitur, melainkan seberapa cepat Anda menemukan yang dicari.

## Superadmin dan admin biasa

**Superadmin** adalah pemilik. Bisa melakukan segalanya, termasuk mengangkat dan memberhentikan admin lain.

**Admin biasa** punya kewenangan terbatas. Misalnya boleh menyunting artikel, tetapi tidak boleh menghapus pengguna atau mengubah harga.

Kenapa dibedakan? Karena kesalahan besar biasanya tidak disengaja. Membatasi kewenangan berarti membatasi kerusakan yang mungkin terjadi.

Sebagai pemilik, Anda superadmin. Staf Anda sebaiknya admin biasa.

## Role dan permission

**Role** adalah jabatan: superadmin, admin, editor, anggota.

**Permission** adalah izin: boleh-hapus-pengguna, boleh-ubah-harga, boleh-lihat-laporan.

Satu role berisi sekumpulan permission. Ini lebih rapi daripada memberi izin satu per satu ke tiap orang.

Contoh:

| Role | Izin |
|---|---|
| Superadmin | semuanya |
| Admin | kelola konten, lihat laporan |
| Editor | kelola konten saja |
| Anggota | lihat saja |

Ketika staf baru masuk, Anda cukup memberinya role — tidak perlu mengatur belasan izin satu-satu.

## Sidebar menu

**Sidebar** adalah menu di sisi kiri dashboard.

Menyusun menu yang rapi:

1. **Kelompokkan** yang sejenis — semua tentang pengguna jadi satu grup
2. **Urutkan menurut kekerapan** — yang paling sering dipakai di atas
3. **Batasi jumlahnya** — lebih dari tujuh grup mulai membingungkan
4. **Sembunyikan yang tak berhak** — jangan tampilkan menu yang akan ditolak
5. **Pakai kata yang jelas** — "Data Pasien" lebih baik daripada "Manajemen Entitas"

Ujinya sederhana: bila staf baru butuh lebih dari sepuluh detik menemukan sesuatu, susunannya perlu diperbaiki.

## Membuat halaman CRUD

Setiap halaman kelola data biasanya berisi:

**Daftar (Read)** — tabel berisi data, dengan pencarian dan penomoran halaman

**Tambah (Create)** — tombol yang membuka formulir

**Ubah (Update)** — tombol di setiap baris

**Hapus (Delete)** — tombol yang **selalu meminta konfirmasi**

Beberapa hal yang sering terlupa:

- Konfirmasi sebelum menghapus. Sekali terhapus, hilang.
- Pesan galat yang jelas. Bukan "Error 500", tetapi "Nama wajib diisi".
- Penomoran halaman. Seribu baris dalam satu halaman akan membuat browser berat.
- Pencarian. Tanpa ini, data banyak menjadi tidak berguna.

## Autentikasi dan otorisasi

Dua kata mirip, artinya berbeda.

**Autentikasi** menjawab: *siapa Anda?*
Ini proses login — memeriksa email dan password.

**Otorisasi** menjawab: *apa yang boleh Anda lakukan?*
Ini pemeriksaan izin setelah login.

Perumpamaan hotel:

- **Autentikasi** — resepsionis memeriksa KTP, memastikan Anda tamu
- **Otorisasi** — kartu Anda membuka kamar 302, tetapi tidak membuka kamar 405 atau ruang staf

Login berhasil bukan berarti boleh segalanya. Keduanya harus ada.

## Meminta Hermes membuat tampilan

Bila Anda ingin tampilan dibuatkan, cukup katakan langsung:

> "Tolong buatkan tampilan UI/UX modern untuk english.elmozza.com"

Semakin jelas keterangannya, semakin tepat hasilnya. Sebutkan:

- untuk siapa websitenya
- kesan yang diinginkan (bersih, hangat, tegas)
- halaman apa saja yang dibutuhkan

Setelah tampilan jadi, lanjutkan dengan sidebar dan dashboard, baru sambungkan ke Cloudflare.""",
    ),
    (
        "Tahap 5 — Monetisasi: dari pengunjung menjadi pemasukan",
        """Website yang bagus tanpa cara menerima uang hanyalah biaya. Ini menutup rantainya.

## Payment gateway

**Payment gateway** adalah perantara yang menerima pembayaran atas nama Anda.

Anda tidak berhubungan langsung dengan bank atau e-wallet satu per satu. Gateway yang mengurusnya.

Cara kerjanya:

```
1. Pembeli menekan tombol Bayar
2. Website meminta gateway membuat tagihan
3. Pembeli membayar (transfer, QRIS, kartu)
4. Gateway memberi tahu website: "sudah dibayar"
5. Website membuka akses / mengirim produk
```

Langkah 4 disebut **webhook** — gateway menghubungi website Anda tanpa diminta.

Yang penting dipahami: **jangan percaya tombol, percayalah webhook.** Pembeli bisa saja menutup halaman sebelum selesai. Yang menentukan lunas atau tidak adalah kabar dari gateway, bukan klik pembeli.

## Sistem koin atau saldo

**Koin** adalah saldo di dalam aplikasi. Pengguna mengisinya sekali, lalu memakainya berkali-kali.

Alurnya:

```
Topup  → uang masuk → saldo bertambah
Belanja → saldo berkurang → barang terkirim
```

Kenapa memakai koin, bukan bayar langsung setiap kali?

1. **Lebih hemat biaya.** Setiap transaksi gateway ada potongannya. Satu topup Rp100.000 jauh lebih murah daripada dua puluh transaksi Rp5.000.
2. **Lebih nyaman.** Pembeli tidak perlu memasukkan data pembayaran berulang kali.
3. **Uang masuk lebih dahulu.** Anda menerima dana saat topup, bukan saat barang dipakai.

Yang wajib diperhatikan: **setiap perubahan saldo harus dicatat.** Bukan hanya angka akhirnya, tetapi riwayatnya — kapan, berapa, untuk apa. Tanpa riwayat, selisih satu rupiah pun tidak bisa ditelusuri.

## Menghitung bagi hasil

Bila penulis mendapat 70% dan pemilik platform 30%, sistem harus menghitung dan mencatatnya otomatis.

Yang perlu disimpan setiap ada penjualan:

- harga jual saat itu
- bagian penulis
- bagian platform
- siapa penulisnya
- kapan terjadi

**Simpan angka hasil hitungan, bukan hanya persentasenya.** Bila kelak persentase berubah, riwayat lama tidak boleh ikut berubah.

Sebagai perbandingan, platform besar umumnya membagi 50:50. Memberi 70% kepada penulis adalah pembeda yang nyata bagi platform baru — dan itu alasan kuat bagi penulis untuk pindah.

## Produk digital

**Produk digital** adalah barang yang tidak berwujud fisik: e-book, template, materi ajar, aplikasi, rekaman.

Keunggulannya besar:

- dibuat sekali, dijual tanpa batas
- tanpa ongkos kirim, tanpa stok
- keuntungan hampir seluruhnya bersih

Yang perlu dijaga: **berkasnya jangan bisa diunduh tanpa membayar.** Tautan unduhan sebaiknya berlaku sementara dan hanya untuk pembeli.

## Komisi dan afiliasi

**Afiliasi** adalah orang yang mempromosikan produk Anda dan mendapat komisi dari setiap penjualan yang ia bawa.

Cara kerjanya: setiap afiliasi mendapat tautan khusus. Bila ada yang membeli lewat tautan itu, sistem mencatat dan menghitung komisinya.

Ini cara bertumbuh tanpa biaya iklan di muka — Anda hanya membayar ketika penjualan benar-benar terjadi.

## Alur otomatis dari pendaftaran sampai pembayaran

Inilah rangkaian penuh sebuah platform yang berjalan sendiri:

```
1. Pengunjung mendaftar
2. Email sambutan terkirim otomatis
3. Ia menjelajah katalog
4. Memilih produk, menekan Bayar
5. Payment gateway memproses
6. Webhook mengabarkan pembayaran berhasil
7. Akses terbuka / berkas terkirim
8. Bagi hasil tercatat otomatis
9. Penjual melihatnya di dashboard
```

Sembilan langkah, dan **tidak satu pun butuh campur tangan Anda.**

Inilah bedanya sistem dengan pekerjaan manual. Sistem bekerja saat Anda tidur.

Namun perlu jujur: membangun kesembilan langkah ini butuh waktu. Jangan mengerjakan semuanya sekaligus. Mulailah dari pendaftaran dan satu produk, pastikan berjalan, baru lanjutkan.""",
    ),
    (
        "Bonus — Peluang yang belum digarap orang lain",
        """Bagian ini bukan materi dasar, melainkan peluang nyata yang layak dipertimbangkan.

## Masalah yang belum terpecahkan

Di kebanyakan platform penerbitan digital, seorang penulis yang ingin menerbitkan buku harus menata sendiri:

- memecah naskah menjadi bab
- menyusun daftar isi
- merapikan judul dan sub-judul
- mengatur urutan halaman

Semuanya **manual**. Melelahkan, dan menjadi penghalang bagi penulis yang bukan orang teknis — misalnya seorang dokter yang ingin menerbitkan catatan medisnya.

## Gagasan pemecahannya

Bagaimana bila penulis cukup mengunggah satu berkas Word, lalu sistem menata sendiri seluruh strukturnya?

Alurnya:

```
1. Penulis mengunggah berkas Word
2. Sistem membaca isinya
3. AI mengenali mana judul bab, mana isi
4. Struktur buku terbentuk sendiri
5. Penulis memeriksa dan memperbaiki bila perlu
6. Terbit
```

Yang dikerjakan AI di langkah 3:

- mengenali pola judul (huruf tebal, ukuran besar, penomoran)
- memecah teks panjang menjadi bab yang masuk akal
- membuat daftar isi
- mengusulkan ringkasan tiap bab

## Kenapa ini bernilai

Tiga alasan:

**Menghilangkan penghalang.** Penulis yang gaptek kini bisa menerbitkan tanpa bantuan.

**Menghemat waktu.** Pekerjaan berjam-jam menjadi hitungan menit.

**Menjadi pembeda.** Selama platform lain masih manual, ini alasan kuat bagi penulis untuk memilih Anda.

## Cara memulainya

Jangan bangun semuanya sekaligus. Uji gagasannya dahulu:

1. Ambil satu berkas Word nyata
2. Coba proses dengan AI, lihat hasilnya
3. Bila hasilnya masuk akal, baru bangun antarmukanya
4. Uji dengan tiga penulis sungguhan
5. Perbaiki berdasarkan keluhan mereka

Bila di langkah 2 hasilnya berantakan, Anda baru menghabiskan satu jam — bukan satu bulan.

## Catatan penting: jangan tercampur jalur

Ada satu kekeliruan yang sering terjadi ketika belajar AI.

Alat seperti **ComfyUI**, **Higgsfield**, dan token **AI Studio** adalah untuk membuat **gambar dan video**. Alat-alat itu membutuhkan GPU dan biaya render.

Membangun **website** tidak memakai alat-alat itu sama sekali.

Keduanya sama-sama disebut "AI", tetapi jalurnya berbeda:

| | Jalur website | Jalur video |
|---|---|---|
| Alat | Cloudflare, GitHub | ComfyUI, Higgsfield |
| Kebutuhan | Peramban dan editor | GPU |
| Hasil | Aplikasi yang bisa dibuka | Berkas video |

Bila tujuan Anda membangun platform, fokuslah pada jalur pertama. Jalur kedua bisa menyusul bila kelak butuh materi promosi.

## Penutup

Bila Anda telah sampai di sini, Anda sudah mengenal seluruh rangkaiannya: istilah dasar, tempat menaruh website, cara menerbitkan, cara mengelola, dan cara menghasilkan.

Yang tersisa adalah mengerjakannya.

Satu nasihat terakhir: **jangan menunggu paham semuanya sebelum mulai.** Pemahaman yang benar-benar melekat datang dari mengerjakan, bukan dari membaca.

Mulailah dari satu halaman. Terbitkan. Lihat hasilnya di internet. Perasaan itu — melihat karya sendiri bisa dibuka siapa saja — adalah bahan bakar untuk langkah berikutnya.""",
    ),
]


def bangun() -> str:
    baris = [
        "-- Seed kursus 'Membangun Website Sendiri'.",
        "-- Dihasilkan oleh scripts/seed-kursus-website.py.",
        "-- Aman dijalankan ulang: INSERT OR REPLACE dengan id tetap.",
        "",
        "INSERT OR REPLACE INTO kursus "
        "(id, slug, judul, ringkasan, deskripsi, harga_koin, level, kategori, "
        "sampul_url, durasi_menit, status, urutan, created_at, updated_at) VALUES ("
        f"{kutip(KURSUS_ID)}, "
        f"{kutip('membangun-website-sendiri')}, "
        f"{kutip('Membangun Website Sendiri: Dari Istilah Dasar sampai Menghasilkan')}, "
        f"{kutip('Kurikulum lengkap untuk pemula yang ingin punya platform sendiri: istilah dasar, Cloudflare, GitHub, dashboard superadmin, dan monetisasi.')}, "
        f"{kutip('Disusun dari pertanyaan nyata seorang pemula yang ingin membangun platformnya sendiri. Tidak mengandaikan latar belakang teknis apa pun.')}, "
        f"0, {kutip('dasar')}, {kutip('Teknologi & Platform')}, NULL, 180, "
        f"'published', 4, {SEKARANG}, {SEKARANG});",
        "",
    ]

    for i, (judul, isi) in enumerate(MATERI, start=1):
        baris.append(
            "INSERT OR REPLACE INTO kursus_materi "
            "(id, kursus_id, judul, isi, urutan, durasi_menit, created_at, updated_at) VALUES ("
            f"{kutip(f'{KURSUS_ID}-m{i}')}, {kutip(KURSUS_ID)}, {kutip(judul)}, "
            f"{kutip(isi)}, {i}, 30, {SEKARANG}, {SEKARANG});"
        )

    return "\n".join(baris) + "\n"


if __name__ == "__main__":
    tujuan = (
        pathlib.Path(__file__).resolve().parent.parent
        / "migrations"
        / "0064_seed_kursus_website.sql"
    )
    tujuan.write_text(bangun(), encoding="utf-8")
    print(f"Ditulis: {tujuan}")
    print(f"  1 kursus, {len(MATERI)} materi")
