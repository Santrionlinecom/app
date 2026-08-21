# Prosedur Tanggap Kebocoran Data Pribadi
### SantriOnline — dokumen internal

Versi 1.0 · 21 Agustus 2026
Dasar: UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi

---

## Untuk Siapa Dokumen Ini

Untuk Mas Yogik selaku penanggung jawab data, dan siapa pun yang kelak
membantu mengelola SantriOnline.

Semoga tidak pernah dipakai. Tapi kalau dibutuhkan, tidak akan ada waktu
untuk menyusunnya dari nol — itulah sebabnya ditulis sekarang.

---

## Apa yang Dihitung sebagai Kebocoran

Kebocoran adalah **akses, pengungkapan, perubahan, atau kehilangan data
pribadi tanpa hak**. Contoh yang relevan untuk SantriOnline:

| Kategori | Contoh nyata |
|---|---|
| Akses tanpa hak | Kredensial Cloudflare bocor; token API tersebar di repo publik |
| Pengungkapan | Bug membuat data santri lembaga A terlihat oleh lembaga B |
| Kesalahan kirim | Email massal salah sasaran; nomor WA tampil di halaman publik |
| Kehilangan | Database terhapus tanpa cadangan |
| Perangkat | Laptop kerja hilang dalam keadaan sesi terbuka |

**Bukan kebocoran:** kesalahan tampilan yang tidak membuka data orang lain,
atau pengguna yang lupa password.

Kalau ragu — **perlakukan sebagai kebocoran** sampai terbukti bukan.

---

## Langkah 1 — Hentikan Pendarahan (0–1 jam)

Prioritas pertama bukan mencari penyebab, tapi **menghentikan kebocoran
yang sedang berjalan**.

1. **Cabut kredensial yang dicurigai.**
   ```
   # Cloudflare: putar ulang API token lewat dasbor
   # Wrangler: keluar dan masuk ulang
   HOME=/home/yogik npx wrangler logout
   HOME=/home/yogik npx wrangler login
   ```

2. **Cabut seluruh sesi pengguna** bila ada dugaan pengambilalihan akun:
   ```bash
   HOME=/home/yogik npx wrangler d1 execute DB --remote \
     --command "DELETE FROM sessions"
   ```
   Semua orang terpaksa masuk ulang. Merepotkan, tapi jauh lebih baik
   daripada membiarkan satu sesi curian tetap hidup.

3. **Kalau kebocoran lewat bug di kode**, kembalikan ke versi aman:
   ```bash
   git log --oneline -10          # cari commit terakhir yang aman
   git revert <commit-bermasalah>
   npm run build && npx wrangler pages deploy .svelte-kit/cloudflare \
     --project-name app-santrionline --branch main
   ```

4. **Jangan hapus log.** Log adalah bukti. Sekali hilang, rekonstruksi
   kejadian menjadi tebak-tebakan.

---

## Langkah 2 — Catat Fakta (1–4 jam)

Buat berkas `insiden-YYYY-MM-DD.md` dan isi apa adanya:

- **Kapan** terjadi, dan kapan pertama kali diketahui (dua waktu berbeda)
- **Bagaimana** diketahui — laporan pengguna, log, atau temuan sendiri
- **Data apa** yang terpapar (email? WA? nama? sekadar id internal?)
- **Berapa banyak** orang terdampak — angka nyata dari kueri, bukan kira-kira
- **Apakah masih berlangsung** atau sudah berhenti
- **Apa yang sudah dilakukan**, lengkap dengan jamnya

Kueri untuk memperkirakan cakupan:
```bash
# berapa akun yang punya data pribadi
HOME=/home/yogik npx wrangler d1 execute DB --remote \
  --command "SELECT COUNT(*) FROM users WHERE dihapus_at IS NULL"

# aktivitas mencurigakan sekitar waktu kejadian
HOME=/home/yogik npx wrangler d1 execute DB --remote \
  --command "SELECT action, COUNT(*) n FROM activity_logs \
             WHERE created_at > <epoch_ms> GROUP BY action ORDER BY n DESC"
```

**Tulis jujur, termasuk bila penyebabnya kelalaian sendiri.** Dokumen ini
untuk memahami dan memperbaiki, bukan untuk membela diri.

---

## Langkah 3 — Beri Tahu yang Terdampak (dalam 3×24 jam)

UU 27/2022 mewajibkan pemberitahuan kepada subjek data bila terjadi
kegagalan pelindungan data pribadi.

**Rentang waktu yang dijadikan patokan: paling lambat 3×24 jam** sejak
kebocoran diketahui. Jangan menunggu semuanya jelas — beri tahu apa yang
sudah diketahui, lalu perbarui.

### Siapa yang diberi tahu

1. **Pengguna terdampak** — lewat email akun mereka
2. **Pengurus lembaga**, bila menyangkut data santri (mereka pengendali
   atas data santrinya, dan wali akan bertanya kepada mereka lebih dulu)
3. **Lembaga berwenang**, sesuai ketentuan yang berlaku saat itu

### Template pemberitahuan

> **Perihal: Pemberitahuan Insiden Keamanan Data — SantriOnline**
>
> Assalamu'alaikum warahmatullahi wabarakatuh.
>
> Kami menyampaikan bahwa pada [tanggal] terjadi [ringkasan singkat] yang
> menyebabkan [jenis data] milik sebagian pengguna dapat diakses tanpa hak.
>
> **Data yang terpengaruh:** [sebutkan tepat — jangan dikurangi]
> **Data yang TIDAK terpengaruh:** [sebutkan juga, agar tidak salah paham]
> **Perkiraan jumlah terdampak:** [angka]
>
> **Yang sudah kami lakukan:**
> - [langkah 1, dengan waktunya]
> - [langkah 2]
>
> **Yang kami sarankan Anda lakukan:**
> - [mis. ganti password, waspada pesan mengatasnamakan SantriOnline]
>
> Kami memohon maaf atas kejadian ini dan bertanggung jawab penuh atas
> penanganannya. Pertanyaan dapat disampaikan ke masyogik@santrionline.com.
>
> Wassalamu'alaikum warahmatullahi wabarakatuh.

**Jangan** memperhalus dengan kalimat seperti "kemungkinan kecil ada
dampak" bila belum dipastikan. Kepercayaan yang hilang karena informasi
menyesatkan jauh lebih sulit dipulihkan daripada karena kabar buruk.

---

## Langkah 4 — Perbaiki Akarnya (1–7 hari)

1. Cari **sebab paling dasar**, bukan gejalanya.
2. Perbaiki, lalu **tulis tes yang gagal bila bug itu kembali**.
3. **Jalankan uji mutasi** pada tes itu — pastikan benar-benar menggigit.
4. Perbarui dokumen ini bila prosedurnya ternyata kurang.

Setiap insiden harus meninggalkan satu tes baru. Tanpa itu, perbaikan
hanya bertahan sampai orang lupa.

---

## Langkah 5 — Tinjau (dalam 30 hari)

Empat pertanyaan:

1. Mengapa ini bisa terjadi?
2. Mengapa tidak terdeteksi lebih awal?
3. Apa yang membuat penanganan lambat?
4. Data apa yang sebetulnya **tidak perlu kita simpan** sejak awal?

Pertanyaan keempat paling berharga. Data yang tidak disimpan tidak bisa
bocor — itu perlindungan terkuat yang ada.

---

## Pencegahan yang Sudah Berjalan

Kondisi per 21 Agustus 2026, hasil audit langsung ke basis data produksi:

| Perlindungan | Status |
|---|---|
| NIK / KTP / KK / tanggal lahir / alamat rumah | **Tidak disimpan sama sekali** |
| Password | Di-hash (Scrypt), bukan teks asli |
| Nomor WhatsApp | Opsional — hanya 7 dari 41 akun mengisinya |
| Kebijakan Privasi & Syarat Ketentuan | Ada, merujuk UU 27/2022 |
| Persetujuan pengguna | Tercatat (`consent_at`, `consent_versi`) |
| Hak hapus akun | Mandiri lewat `/akun`, dengan anonimisasi |
| Otorisasi | Ditegakkan di server, lolos uji mutasi |
| Rapor santri | Privat secara bawaan |
| Data wali | Hanya-baca, berbasis kode undangan lembaga |

**Nilai penting:** karena NIK dan KK tidak pernah dikumpulkan, kebocoran
terburuk sekalipun hanya memaparkan email dan nama — bukan identitas
kependudukan yang bisa dipakai memalsukan dokumen.

---

## Kontak

| Peran | Kontak |
|---|---|
| Penanggung jawab data | Yogik Pratama Aprilian — masyogik@santrionline.com |
| Akun Cloudflare | websantrionline@gmail.com |
| Basis data produksi | D1 `db-app` (binding `DB`) |

---

## Riwayat Dokumen

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 21 Agustus 2026 | Dokumen awal |

> Tinjau dokumen ini setiap kali struktur data berubah besar, dan setidaknya
> sekali setahun. Prosedur yang tidak pernah ditinjau biasanya sudah tidak
> cocok dengan sistem yang dijaganya.
