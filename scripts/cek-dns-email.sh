#!/usr/bin/env bash
# Memeriksa kesiapan DNS untuk pengiriman email Resend (read-only).
#
# Resend mensyaratkan TIGA record. Bila salah satu hilang, domain tidak
# terverifikasi dan setiap pengiriman ditolak dengan HTTP 403.
#
# Pakai:  bash scripts/cek-dns-email.sh [domain]
set -u

DOMAIN="${1:-santrionline.com}"
kurang=0

echo "Memeriksa DNS untuk: $DOMAIN"
echo

periksa() {
  local label="$1" tipe="$2" nama="$3"
  local hasil
  hasil=$(dig +short "$tipe" "$nama" 2>/dev/null | head -1)
  if [ -n "$hasil" ]; then
    printf '  [ADA]   %-26s %s\n' "$label" "$(echo "$hasil" | cut -c1-38)"
  else
    printf '  [HILANG] %-25s (%s di %s)\n' "$label" "$tipe" "$nama"
    kurang=$((kurang + 1))
  fi
}

echo "=== Syarat Resend ==="
periksa "DKIM"    TXT "resend._domainkey.$DOMAIN"
periksa "MX SPF"  MX  "send.$DOMAIN"
periksa "TXT SPF" TXT "send.$DOMAIN"

echo
if [ "$kurang" -eq 0 ]; then
  echo "  Semua record lengkap."
  echo "  Bila email masih gagal, klik 'Verify DNS Records' di https://resend.com/domains"
else
  echo "  $kurang record belum ada — inilah sebab email ditolak 403."
  echo
  echo "  Ambil nilainya di:  https://resend.com/domains"
  echo "  Tambahkan di    :  https://dash.cloudflare.com  ->  $DOMAIN  ->  DNS"
  echo
  echo "  Catatan penting:"
  echo "   - kolom Name diisi 'send' saja, BUKAN 'send.$DOMAIN'"
  echo "   - Proxy status wajib 'DNS only' (awan abu-abu), bukan proxied"
  echo "   - Priority MX: 10 (bila sudah dipakai, naikkan ke 20)"
fi

echo
echo "=== Konteks (tidak wajib, sekadar informasi) ==="
printf '  MX utama   : '; dig +short MX "$DOMAIN" 2>/dev/null | head -2 | tr '\n' ' '; echo
printf '  SPF utama  : '; dig +short TXT "$DOMAIN" 2>/dev/null | grep -i spf | cut -c1-60; echo
echo
echo "  MX utama dipakai untuk MENERIMA email dan tidak diubah oleh langkah ini."
echo "  Record 'send.' hanya dipakai Resend untuk MENGIRIM."
