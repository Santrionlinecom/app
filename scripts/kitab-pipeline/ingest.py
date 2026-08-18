#!/usr/bin/env python3
"""Ingest chunks.json ke Vectorize via endpoint /api/kitab/ingest.

Pemakaian:
    source ~/.config/llamacloud.env   # berisi KITAB_INGEST_SECRET
    python3 ingest.py out/<slug>.chunks.json [--base https://app.santrionline.com]

Alur: init (reservasi corpus) -> batch per 15 chunk (retry 3x) -> finalize
(ulangi finalize otomatis sampai status indexed, maksimal ~2 menit).
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BATCH_SIZE = 15
MAX_RETRY = 3
FINALIZE_ATTEMPTS = 8
FINALIZE_WAIT_S = 10


def call(base: str, secret: str, payload: dict, timeout: int = 120) -> dict:
    req = urllib.request.Request(
        f"{base}/api/kitab/ingest",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-ingest-secret": secret,
            "User-Agent": "SantriOnline-KitabPipeline/1.0 (+https://app.santrionline.com)",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def call_retry(base: str, secret: str, payload: dict, label: str) -> dict:
    last: Exception | None = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            return call(base, secret, payload)
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", "replace")[:300]
            if exc.code in {400, 401, 404, 409}:
                sys.exit(f"ERROR {label}: HTTP {exc.code} (fatal, tidak diulang)\n{body}")
            last = exc
            print(f"[ingest] {label}: HTTP {exc.code}, retry {attempt}/{MAX_RETRY} ...\n{body}")
        except Exception as exc:  # jaringan/timeout
            last = exc
            print(f"[ingest] {label}: {exc}, retry {attempt}/{MAX_RETRY} ...")
        time.sleep(3 * attempt)
    sys.exit(f"ERROR {label}: gagal setelah {MAX_RETRY} percobaan: {last}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Ingest chunk kitab ke Vectorize")
    ap.add_argument("chunks_file", help="out/<slug>.chunks.json")
    ap.add_argument("--base", default="https://app.santrionline.com")
    args = ap.parse_args()

    secret = os.environ.get("KITAB_INGEST_SECRET", "").strip()
    if not secret:
        sys.exit("ERROR: KITAB_INGEST_SECRET kosong. Jalankan: source ~/.config/llamacloud.env")

    path = Path(args.chunks_file)
    if not path.is_file():
        sys.exit(f"ERROR: tidak ditemukan: {path}")
    chunks = json.loads(path.read_text(encoding="utf-8"))
    if not chunks:
        sys.exit("ERROR: chunks kosong")

    meta = chunks[0]["metadata"]
    slug = meta["kitab_slug"]
    corpus_key = meta["corpus_key"]
    judul = meta["judul_kitab"]
    print(f"[ingest] {slug}: {len(chunks)} chunk -> {args.base}")

    init = call_retry(
        args.base,
        secret,
        {
            "action": "init",
            "kitabSlug": slug,
            "corpusKey": corpus_key,
            "judul": judul,
            "expectedChunks": len(chunks),
        },
        "init",
    )
    revision = init.get("indexRevision")
    if not revision:
        sys.exit(f"ERROR: init tanpa indexRevision: {init}")
    print(f"[ingest] indexRevision: {revision}")

    for start in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[start : start + BATCH_SIZE]
        result = call_retry(
            args.base,
            secret,
            {
                "action": "batch",
                "kitabSlug": slug,
                "corpusKey": corpus_key,
                "judul": judul,
                "indexRevision": revision,
                "chunks": batch,
            },
            f"batch {start // BATCH_SIZE + 1}",
        )
        done = min(start + BATCH_SIZE, len(chunks))
        print(f"[ingest] batch OK: {done}/{len(chunks)} (stored={result.get('stored')})")

    for attempt in range(1, FINALIZE_ATTEMPTS + 1):
        final = call_retry(
            args.base,
            secret,
            {
                "action": "finalize",
                "kitabSlug": slug,
                "corpusKey": corpus_key,
                "indexRevision": revision,
            },
            "finalize",
        )
        status = final.get("status")
        print(f"[ingest] finalize {attempt}: status={status} chunks={final.get('chunks')}")
        if status == "indexed":
            print(f"[ingest] SELESAI: {slug} terindeks ({final.get('chunks')} chunk)")
            return
        time.sleep(FINALIZE_WAIT_S)

    sys.exit("ERROR: belum indexed setelah menunggu; jalankan ulang ingest.py nanti (aman, idempotent)")


if __name__ == "__main__":
    main()
