# Enginemailer DNS Setup

Dokumen ini dipakai untuk verifikasi domain `santrionline.com` di Enginemailer melalui Cloudflare DNS.

Perubahan yang dilakukan script adalah perubahan DNS pada Cloudflare zone `santrionline.com`. Ini bukan perubahan aplikasi `app.santrionline.com`, bukan perubahan route SvelteKit, dan bukan perubahan konfigurasi Cloudflare Pages.

## Record Yang Dikelola

- SPF root `santrionline.com`
- CNAME `em1._domainkey.santrionline.com` ke `dkim1.enginemailer.org`
- CNAME `em2._domainkey.santrionline.com` ke `dkim2.enginemailer.org`
- CNAME `_dmarc.santrionline.com` ke `_dmarc.enginemailer.org`

Semua CNAME dibuat DNS only (`proxied: false`) dengan TTL auto.

## Token Cloudflare

Script membaca token dari environment variable `CLOUDFLARE_API_TOKEN`.

Jangan simpan token ke repo, `.env`, markdown, atau file lain. Set token hanya di terminal lokal:

```bash
export CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
```

## Dry Run

Jalankan dry-run untuk melihat rencana perubahan tanpa menulis DNS:

```bash
node scripts/cloudflare/setup-enginemailer-dns.mjs
```

Default script adalah dry-run. Tidak ada record DNS yang diubah tanpa `APPLY_DNS=1`.

## Apply

Setelah rencana perubahan sudah benar, jalankan:

```bash
APPLY_DNS=1 node scripts/cloudflare/setup-enginemailer-dns.mjs
```

Setelah apply selesai, buka Enginemailer dan klik "Check DNS Records Now".

DNS propagation bisa memerlukan beberapa menit sampai 24-48 jam.

## Catatan SPF

Script hanya mengelola satu SPF TXT record di root `santrionline.com`.

Jika sudah ada satu SPF, script akan mengubahnya menjadi:

```text
v=spf1 include:enginemailer.org include:_spf.mx.cloudflare.net ~all
```

Jika ditemukan lebih dari satu SPF TXT record di root domain, script akan berhenti dan meminta pengecekan manual supaya tidak membuat konfigurasi SPF ganda.
