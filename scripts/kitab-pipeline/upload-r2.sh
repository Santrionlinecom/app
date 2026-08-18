#!/usr/bin/env bash
# Upload artefak markdown + manifest kitab ke R2 (bucket santri-online-files).
#
# Pemakaian:  ./upload-r2.sh <slug>
# Contoh:     ./upload-r2.sh panduan-durusul-lughah-1
#
# Key R2:
#   kitab-markdown/<slug>.md
#   kitab-markdown/<slug>.json
#
# Catatan WSL: jika `npx wrangler r2` gagal dari WSL, jalankan varian cmd.exe
# sesuai skill cloudflare-worker-wsl-deploy.

set -euo pipefail

SLUG="${1:-}"
if [[ -z "$SLUG" ]]; then
  echo "Pemakaian: ./upload-r2.sh <slug>" >&2
  exit 1
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MD="$DIR/out/$SLUG.md"
MANIFEST="$DIR/out/$SLUG.json"
BUCKET="santri-online-files"

[[ -f "$MD" ]] || { echo "ERROR: tidak ada $MD (jalankan parse.py dulu)" >&2; exit 1; }

cd "$DIR/../.."   # root repo, agar wrangler membaca wrangler.toml

echo "[r2] upload $SLUG.md ..."
npx wrangler r2 object put "$BUCKET/kitab-markdown/$SLUG.md" \
  --file "$MD" --content-type "text/markdown; charset=utf-8" --remote

if [[ -f "$MANIFEST" ]]; then
  echo "[r2] upload $SLUG.json ..."
  npx wrangler r2 object put "$BUCKET/kitab-markdown/$SLUG.json" \
    --file "$MANIFEST" --content-type "application/json" --remote
fi

echo "[r2] OK: kitab-markdown/$SLUG.md"
