#!/usr/bin/env python3
"""
Menghasilkan SQL seed untuk kursus perdana SantriOnline.

Dipisah sebagai skrip agar isi materi yang panjang mudah disunting tanpa
mengotori berkas SQL dengan escape manual.
"""
import pathlib
import time

SEKARANG = int(time.time() * 1000)


def kutip(teks: str) -> str:
    return "'" + teks.replace("'", "''") + "'"


KURSUS = [
    {
        "id": "kursus-peta-santrionline",
        "slug": "peta-lengkap-santrionline",
        "judul": "Peta Lengkap SantriOnline: Dari Nol sampai Menghasilkan",
        "ringkasan": "Satu kursus yang menerangkan seluruh isi platform — lembaga, buku, produk digital, kursus, dan koin — beserta cara kerjanya.",
        "harga_koin": 0,
        "level": "dasar",
        "kategori": "Panduan Platform",
        "durasi_menit": 75,
        "urutan": 1,
        "materi": [
            (
                "Apa itu SantriOnline dan untuk siapa",
                """SantriOnline bukan sekadar tempat belajar agama, dan bukan pula sekadar toko digital.

Platform ini dibangun untuk satu tujuan: **mencetak generasi muslim yang berilmu, beraqidah kuat, beradab, disiplin, dan kompeten di dunia nyata.**

Ada lima hal yang bisa Anda lakukan di sini:

1. **Mengelola lembaga** — TPQ, masjid, rumah tahfidz, pondok
2. **Menulis dan menjual buku**
3. **Menjual produk digital**
4. **Mengikuti atau membuat kursus**
5. **Memakai koin** sebagai alat bayar di seluruh platform

Satu akun bisa memakai semuanya sekaligus. Tidak perlu akun terpisah.

Siapa yang cocok memakai platform ini?

- **Pengurus lembaga** yang ingin mendata santri dan mencatat setoran hafalan
- **Penulis** yang ingin menerbitkan buku tanpa biaya awal
- **Pembuat produk digital** — template, desain, aplikasi
- **Pengajar** yang ingin membuat kursus
- **Santri dan orang tua** yang ingin belajar dan memantau kemajuan

Kursus ini menerangkan semuanya, satu per satu.""",
            ),
            (
                "Koin: satu dompet untuk semua",
                """Koin adalah alat bayar di seluruh SantriOnline. Satu dompet, dipakai untuk apa saja.

**Cara mendapatkan koin:**

Topup lewat menu Coin. Pembayaran diproses lewat payment gateway resmi, lalu koin masuk otomatis ke dompet Anda.

**Koin dipakai untuk apa:**

- Membeli buku
- Membeli produk digital
- Mendaftar kursus berbayar
- Membuka fitur tambahan lembaga

**Kenapa memakai koin, bukan bayar langsung?**

Tiga alasan praktis:

1. **Sekali bayar, banyak transaksi.** Tidak perlu memasukkan data pembayaran berulang kali untuk pembelian kecil.
2. **Riwayat rapi.** Semua pemakaian tercatat di satu tempat, mudah ditelusuri.
3. **Biaya lebih hemat.** Setiap transaksi payment gateway ada biayanya. Satu topup besar lebih hemat daripada sepuluh transaksi kecil.

**Yang perlu Anda tahu:**

Saldo koin tersimpan di akun Anda dan tidak hangus. Setiap pemakaian tercatat lengkap dengan keterangan dan waktunya.""",
            ),
            (
                "Lembaga: mengelola TPQ, masjid, dan pondok",
                """Bagian ini untuk pengurus lembaga.

**Yang bisa dikelola:**

- Data santri — nama, NIS, kelas, wali
- Setoran hafalan — siapa menyetor apa, kapan, dinilai siapa
- Kemajuan tiap santri
- Pengurus dan hak aksesnya

**Satu akun, banyak lembaga**

Bila Anda mengurus lebih dari satu lembaga — misalnya TPQ dan masjid sekaligus — cukup satu akun. Ada pemilih lembaga di dashboard untuk berpindah.

Dua lembaga pertama gratis.

**Santri tidak perlu punya akun**

Ini penting. Anak TPQ usia 5–12 tahun umumnya belum punya HP dan email.

Karena itu pendataan santri **tidak meminta email atau password**. Cukup nama — NIS, kelas, dan data wali boleh menyusul.

Buka menu **Data Santri**, masukkan santri, lalu setoran hafalan bisa langsung dicatat atas nama mereka.

**Bedanya dengan Kelola Santri**

Ada dua menu yang mirip namanya:

- **Data Santri** — untuk anak TPQ tanpa akun login
- **Kelola Santri** — untuk anggota yang punya akun login sendiri

Pakai yang pertama untuk anak-anak.""",
            ),
            (
                "Buku: menulis, menerbitkan, bagi hasil",
                """Siapa pun bisa menulis dan menerbitkan buku di SantriOnline.

**Tidak ada biaya pendaftaran penulis.** Gratis.

**Bagi hasil: penulis 70%, platform 30%**

Angka ini sengaja lebih berpihak kepada penulis dibanding kebanyakan platform sejenis yang umumnya membagi 50:50.

**Alurnya:**

1. Tulis naskah
2. Unggah beserta sampul
3. Tentukan harga dalam koin
4. Terbitkan
5. Pembaca membeli dengan koin
6. Bagian Anda masuk ke saldo

**Yang menjadi tanggung jawab platform:**

- Penyimpanan berkas
- Sistem pembayaran
- Perlindungan isi buku dari penyalinan
- Halaman penjualan

Anda cukup menulis.""",
            ),
            (
                "Produk digital dan kursus",
                """**Produk digital**

Selain buku, Anda bisa menjual berkas apa pun yang bisa diunduh: template, desain, aplikasi, materi ajar, dan lainnya.

Pembeli membayar dengan koin, lalu berkas terkirim otomatis. Untuk produk berlisensi, kunci lisensi dibuat sendiri oleh sistem.

**Kursus**

Kursus terdiri atas beberapa materi berurutan. Ada yang gratis, ada yang berbayar koin.

Kursus yang sedang Anda baca ini contohnya — dan gratis.

**Kenapa kursus dipisah dari buku?**

Buku dibaca sekali jalan. Kursus punya urutan, kemajuan yang tercatat, dan materi yang bisa diperbarui kapan saja tanpa menerbitkan ulang.

Untuk mengajarkan keterampilan bertahap, kursus lebih tepat.""",
            ),
            (
                "Cara memulai hari ini",
                """Jangan mencoba semuanya sekaligus. Pilih satu sesuai kebutuhan Anda.

**Bila Anda pengurus lembaga:**

1. Buat lembaga di menu Lembaga
2. Buka **Data Santri**, masukkan santri Anda
3. Catat setoran hafalan pertama

**Bila Anda penulis:**

1. Siapkan naskah
2. Buka menu Buku, unggah
3. Tentukan harga, terbitkan

**Bila Anda ingin belajar:**

1. Buka menu Kursus
2. Mulai dari kursus gratis
3. Selesaikan satu materi sebelum lanjut

**Bila Anda ingin berjualan:**

1. Siapkan produk digital
2. Unggah ke Digital Store
3. Tentukan harga koin

**Satu nasihat**

Mulai dari yang paling Anda butuhkan hari ini. Fitur lain akan terasa masuk akal setelah Anda memakai satu bagian sampai tuntas.

Selamat mencoba.""",
            ),
        ],
    },
    {
        "id": "kursus-adab-digital",
        "slug": "adab-santri-di-dunia-digital",
        "judul": "Adab Santri di Dunia Digital",
        "ringkasan": "Menjaga lisan, mata, dan waktu ketika sebagian besar hidup berpindah ke layar.",
        "harga_koin": 0,
        "level": "dasar",
        "kategori": "Adab & Akhlak",
        "durasi_menit": 45,
        "urutan": 2,
        "materi": [
            (
                "Layar juga majelis",
                """Para ulama dahulu sangat menjaga adab ketika masuk majelis ilmu: duduk rapi, diam, mendengar.

Hari ini sebagian besar majelis kita berpindah ke layar. Tetapi adabnya tidak ikut berpindah.

Kita menulis komentar yang tidak akan berani kita ucapkan langsung di depan orangnya. Kita membaca sambil mengerjakan lima hal lain. Kita membagikan kabar tanpa memeriksa kebenarannya.

Padahal **layar juga majelis**. Yang berubah hanya bentuknya, bukan hukum adabnya.

Pertanyaan yang jujur:

Bila ustadz Anda berdiri di belakang Anda sekarang dan melihat layar HP Anda — apakah Anda akan tenang?""",
            ),
            (
                "Menjaga lisan yang berbentuk ketikan",
                """Rasulullah ﷺ bersabda:

> "Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia berkata baik atau diam."
> (HR. Bukhari no. 6018, Muslim no. 47)

Hadits ini sering kita hafal untuk lisan. Padahal ketikan jauh lebih berbahaya:

- **Lisan hilang setelah diucapkan.** Ketikan tersimpan bertahun-tahun.
- **Lisan didengar yang hadir.** Ketikan bisa dibaca ribuan orang.
- **Lisan bisa diperbaiki nadanya.** Ketikan dibaca dengan nada tebakan pembaca.

**Tiga saringan sebelum mengirim:**

1. Benarkah ini?
2. Perlukah disampaikan?
3. Baikkah cara saya menyampaikannya?

Bila salah satu tidak lolos, jangan kirim.""",
            ),
            (
                "Waktu adalah modal yang tidak kembali",
                """Allah bersumpah dengan waktu:

> وَٱلْعَصْرِ ۞ إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ
>
> "Demi masa. Sesungguhnya manusia benar-benar dalam kerugian."
> (QS. Al-'Asr: 1–2)

Aplikasi hiburan dirancang oleh tim yang sangat ahli agar Anda betah berlama-lama. Itu memang pekerjaan mereka.

Menyalahkan diri sendiri karena "tidak kuat menahan" kurang tepat. Yang lebih tepat: **atur ulang keadaannya.**

**Yang bisa dilakukan hari ini:**

- Matikan notifikasi yang tidak penting
- Letakkan HP di luar kamar saat tidur
- Tetapkan satu jam bebas layar setiap hari
- Ganti, jangan hanya larang — isi waktu itu dengan bacaan, olahraga, atau hafalan

**Ukuran sederhana:**

Setelah satu jam memegang HP, tanyakan: apakah saya merasa lebih baik, atau justru kosong?

Jawaban jujurnya biasanya sudah cukup jadi petunjuk.""",
            ),
        ],
    },
    {
        "id": "kursus-fondasi-aqidah",
        "slug": "fondasi-aqidah-aswaja",
        "judul": "Fondasi Aqidah Ahlus Sunnah wal Jama'ah",
        "ringkasan": "Mengenal Allah, Rasul, dan pokok keyakinan Aswaja secara bertahap dan mudah dipahami.",
        "harga_koin": 150,
        "level": "menengah",
        "kategori": "Aqidah",
        "durasi_menit": 120,
        "urutan": 3,
        "materi": [
            (
                "Kenapa aqidah didahulukan",
                """Sebelum belajar cara shalat, seseorang perlu tahu **kepada siapa** ia shalat.

Inilah sebabnya para ulama mendahulukan aqidah. Amal tanpa keyakinan yang benar seperti bangunan tanpa pondasi — terlihat berdiri, tetapi tidak tahan goncangan.

Aqidah menjawab pertanyaan paling mendasar:

- Siapa Allah, dan bagaimana mengenal-Nya?
- Kenapa Allah mengutus para rasul?
- Apa yang terjadi setelah kematian?
- Apa yang menjadi tanggung jawab saya sebagai hamba?

Kursus ini mengikuti manhaj **Ahlus Sunnah wal Jama'ah** sebagaimana dirumuskan Imam Abu Hasan al-Asy'ari dan Imam Abu Manshur al-Maturidi, serta diamalkan mayoritas umat sejak dahulu.

Pembahasan disusun bertahap, dengan bahasa yang bisa dipahami tanpa latar belakang pesantren.""",
            ),
            (
                "Mengenal Allah lewat sifat-sifat-Nya",
                """Ahlus Sunnah mengenal Allah melalui sifat-sifat yang Dia kabarkan sendiri dalam Al-Qur'an dan lewat lisan Rasul-Nya.

**Prinsip utamanya:**

> لَيْسَ كَمِثْلِهِۦ شَىْءٌ ۖ وَهُوَ ٱلسَّمِيعُ ٱلْبَصِيرُ
>
> "Tidak ada sesuatu pun yang serupa dengan Dia. Dan Dialah Yang Maha Mendengar lagi Maha Melihat."
> (QS. Asy-Syura: 11)

Ayat ini menjaga dua sisi sekaligus:

1. **Allah tidak menyerupai makhluk** — tidak berbentuk, tidak bertempat, tidak berubah
2. **Sifat-sifat-Nya nyata** — Dia benar-benar mendengar dan melihat, bukan kiasan

**Sifat wajib yang perlu dikenal lebih dahulu:**

- **Wujud** — Allah ada
- **Qidam** — tidak berpermulaan
- **Baqa'** — tidak berakhir
- **Mukhalafatuhu lil-hawadits** — tidak menyerupai makhluk
- **Qiyamuhu binafsihi** — tidak membutuhkan selain-Nya
- **Wahdaniyyah** — Maha Esa

Enam ini menjadi pintu masuk sebelum membahas sifat-sifat berikutnya.""",
            ),
            (
                "Cinta kepada Rasulullah ﷺ",
                """Aqidah bukan hanya urusan akal. Ia juga urusan hati.

> "Tidak sempurna iman salah seorang di antara kalian sampai aku lebih dicintainya daripada anaknya, orang tuanya, dan seluruh manusia."
> (HR. Bukhari no. 15, Muslim no. 44)

**Bagaimana cinta itu tumbuh?**

Cinta lahir dari pengenalan. Sulit mencintai yang tidak dikenal.

Karena itu para ulama menganjurkan membaca **sirah** — perjalanan hidup Nabi ﷺ. Bukan sekadar menghafal tanggal, tetapi mengenal bagaimana beliau:

- bersabar menghadapi penolakan
- memaafkan orang yang menyakitinya
- memperlakukan anak-anak dan pembantu
- bersikap adil bahkan kepada yang memusuhinya

**Tanda cinta yang benar:**

Bukan hanya bershalawat di lisan, tetapi meneladani akhlaknya dalam kehidupan sehari-hari — di rumah, di tempat kerja, dan di layar HP kita.""",
            ),
        ],
    },
]


def bangun() -> str:
    baris = [
        "-- Seed kursus perdana. Dihasilkan oleh scripts/seed-kursus.py.",
        "-- Aman dijalankan ulang: INSERT OR REPLACE dengan id tetap.",
        "",
    ]

    for k in KURSUS:
        baris.append(
            "INSERT OR REPLACE INTO kursus "
            "(id, slug, judul, ringkasan, deskripsi, harga_koin, level, kategori, "
            "sampul_url, durasi_menit, status, urutan, created_at, updated_at) VALUES ("
            f"{kutip(k['id'])}, {kutip(k['slug'])}, {kutip(k['judul'])}, "
            f"{kutip(k['ringkasan'])}, {kutip(k['ringkasan'])}, {k['harga_koin']}, "
            f"{kutip(k['level'])}, {kutip(k['kategori'])}, NULL, {k['durasi_menit']}, "
            f"'published', {k['urutan']}, {SEKARANG}, {SEKARANG});"
        )
        for i, (judul, isi) in enumerate(k["materi"], start=1):
            mid = f"{k['id']}-m{i}"
            durasi = max(5, k["durasi_menit"] // len(k["materi"]))
            baris.append(
                "INSERT OR REPLACE INTO kursus_materi "
                "(id, kursus_id, judul, isi, urutan, durasi_menit, created_at, updated_at) VALUES ("
                f"{kutip(mid)}, {kutip(k['id'])}, {kutip(judul)}, {kutip(isi)}, "
                f"{i}, {durasi}, {SEKARANG}, {SEKARANG});"
            )
        baris.append("")

    return "\n".join(baris) + "\n"


if __name__ == "__main__":
    tujuan = pathlib.Path(__file__).resolve().parent.parent / "migrations" / "0063_seed_kursus.sql"
    tujuan.write_text(bangun(), encoding="utf-8")
    total_materi = sum(len(k["materi"]) for k in KURSUS)
    print(f"Ditulis: {tujuan}")
    print(f"  {len(KURSUS)} kursus, {total_materi} materi")
