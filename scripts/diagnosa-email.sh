#!/usr/bin/env bash
# Diagnosa pengiriman email (read-only).
#
# Menampilkan status pengiriman email pendaftaran & pembayaran beserta sebab
# kegagalannya. Setelah rilis yang mencatat nama galat Resend, kolom
# last_error_message berisi keterangan asli dari Resend — bukan sekadar kode
# status yang ambigu.
#
# Pakai:  bash scripts/diagnosa-email.sh
set -u
cd "$(dirname "$0")/.."

d1() {
  npx wrangler@4 d1 execute db-app --remote --command "$1" 2>/dev/null
}

echo "=== EMAIL PENDAFTARAN ==="
d1 "SELECT status, last_error_code, COUNT(*) AS jumlah
    FROM registration_email_deliveries
    GROUP BY status, last_error_code
    ORDER BY jumlah DESC" \
  | grep -aoE '"(status|last_error_code|jumlah)": ?("[^"]*"|[0-9]+|null)' \
  | sed 's/^/  /'

echo
echo "=== SEBAB TERAKHIR (jika ada) ==="
d1 "SELECT last_error_code, last_error_message, updated_at
    FROM registration_email_deliveries
    WHERE status = 'failed'
    ORDER BY updated_at DESC LIMIT 3" \
  | grep -aoE '"(last_error_code|last_error_message)": ?("[^"]*"|null)' \
  | sed 's/^/  /'

echo
echo "=== ARTI KODE RESEND ==="
cat <<'KETERANGAN'
  resend_invalid_api_key     Kunci API salah/dicabut.
                             -> buat ulang di resend.com/api-keys,
                                lalu: npx wrangler@4 pages secret put RESEND_API_KEY \
                                        --project-name app-santrionline

  resend_validation_error    Dua kemungkinan, baca pesannya:
                             a) "domain is not verified"
                                -> verifikasi domain di resend.com/domains
                                   (tambah DNS record di Cloudflare)
                             b) "only send testing emails to your own"
                                -> akun masih mode uji; verifikasi domain dulu

  resend_restricted_api_key  Kunci hanya boleh mengirim, butuh Full access.

  resend_http_429            Kuota harian/bulanan habis.

  resend_request_failed      Jaringan/timeout, bukan penolakan Resend.
KETERANGAN

echo
echo "=== PENGIRIM YANG DIPAKAI ==="
echo "  REGISTRATION_EMAIL_FROM & TRANSACTIONAL_EMAIL_FROM (terenkripsi di Pages)."
echo "  Domain pada alamat pengirim WAJIB sudah diverifikasi di Resend."
