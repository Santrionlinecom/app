#!/usr/bin/env python3
"""Parse PDF kitab via LlamaParse (mode agentic) menjadi markdown.

Pemakaian:
    source ~/.config/llamacloud.env
    python3 parse.py --pdf /path/kitab.pdf --slug nama-kitab --judul "Judul Kitab"

Output:
    out/<slug>.md    — markdown hasil parse
    out/<slug>.json  — manifest {slug, judul, job_id, pages, chars, parsed_at, parse_mode}

Hanya stdlib (urllib); tanpa dependensi pip.
Mode TERUJI 2026-08-19: parse_page_with_agent + anthropic-sonnet-4.5 + high_res_ocr
(tabel Arab berharakat sempurna; mode basic merusak urutan huruf Arab dalam tabel).
"""

import argparse
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

API_BASE = "https://api.cloud.llamaindex.ai/api/v1/parsing"
PARSE_MODE = "parse_page_with_agent"
MODEL = "anthropic-sonnet-4.5"
POLL_INTERVAL_S = 10
TIMEOUT_S = 30 * 60


def api_keys() -> list[str]:
    keys = []
    for name in (
        "LLAMA_CLOUD_API_KEY",
        "LLAMA_CLOUD_API_KEY_BACKUP",
        "LLAMA_CLOUD_API_KEY_BACKUP_2",
        "LLAMA_CLOUD_API_KEY_BACKUP_3",
    ):
        key = os.environ.get(name, "").strip()
        if key and key not in keys:
            keys.append(key)
    if not keys:
        sys.exit("ERROR: LLAMA_CLOUD_API_KEY kosong. Jalankan: source ~/.config/llamacloud.env")
    return keys


class CreditExhausted(Exception):
    def __init__(self, url: str, body: str) -> None:
        super().__init__(f"HTTP 402 dari {url}\n{body}")
        self.url = url
        self.body = body


def http(req: urllib.request.Request, timeout: int = 120) -> dict:
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")[:500]
        if exc.code == 402:
            raise CreditExhausted(req.full_url, body) from exc
        sys.exit(f"ERROR: HTTP {exc.code} dari {req.full_url}\n{body}")


def upload(pdf_path: Path, key: str) -> str:
    boundary = uuid.uuid4().hex
    ctype = mimetypes.guess_type(pdf_path.name)[0] or "application/pdf"
    fields = {"parse_mode": PARSE_MODE, "model": MODEL, "high_res_ocr": "true"}
    parts: list[bytes] = []
    for name, value in fields.items():
        parts.append(
            (
                f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n"
            ).encode()
        )
    parts.append(
        (
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; "
            f"filename=\"{pdf_path.name}\"\r\nContent-Type: {ctype}\r\n\r\n"
        ).encode()
    )
    parts.append(pdf_path.read_bytes())
    parts.append(f"\r\n--{boundary}--\r\n".encode())
    body = b"".join(parts)

    req = urllib.request.Request(
        f"{API_BASE}/upload",
        data=body,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    job = http(req, timeout=300)
    job_id = job.get("id")
    if not job_id:
        sys.exit(f"ERROR: respons upload tanpa job id: {job}")
    print(f"[parse] job dibuat: {job_id} (mode={PARSE_MODE}, model={MODEL})")
    return job_id


def wait(job_id: str, key: str) -> None:
    deadline = time.monotonic() + TIMEOUT_S
    attempt = 0
    while time.monotonic() < deadline:
        attempt += 1
        req = urllib.request.Request(
            f"{API_BASE}/job/{job_id}",
            headers={"Authorization": f"Bearer {key}"},
        )
        status = http(req).get("status", "UNKNOWN")
        print(f"[parse] cek {attempt}: {status}")
        if status == "SUCCESS":
            return
        if status in {"ERROR", "CANCELLED", "FAILED"}:
            sys.exit(f"ERROR: job {job_id} berakhir dengan status {status}")
        time.sleep(POLL_INTERVAL_S)
    sys.exit(f"ERROR: job {job_id} belum selesai setelah {TIMEOUT_S // 60} menit")


def fetch_markdown(job_id: str, key: str) -> dict:
    req = urllib.request.Request(
        f"{API_BASE}/job/{job_id}/result/markdown",
        headers={"Authorization": f"Bearer {key}"},
    )
    return http(req, timeout=300)


def main() -> None:
    ap = argparse.ArgumentParser(description="Parse PDF kitab via LlamaParse agentic")
    ap.add_argument("--pdf", required=True, help="Path PDF lokal")
    ap.add_argument("--slug", required=True, help="Slug kitab (a-z0-9-)")
    ap.add_argument("--judul", required=True, help="Judul kitab untuk manifest")
    args = ap.parse_args()

    pdf_path = Path(args.pdf).expanduser()
    if not pdf_path.is_file():
        sys.exit(f"ERROR: PDF tidak ditemukan: {pdf_path}")
    slug = args.slug.strip().lower()
    if not slug or any(c for c in slug if not (c.isalnum() or c == "-")):
        sys.exit("ERROR: slug hanya boleh a-z, 0-9, dan tanda hubung")

    keys = api_keys()
    out_dir = Path(__file__).parent / "out"
    out_dir.mkdir(exist_ok=True)

    last_error: Exception | None = None
    job_id = ""
    for index, key in enumerate(keys, start=1):
        try:
            if index > 1:
                print(f"[parse] kuota key #{index - 1} habis, coba key cadangan #{index}")
            job_id = upload(pdf_path, key)
            wait(job_id, key)
            result = fetch_markdown(job_id, key)
            break
        except CreditExhausted as exc:
            last_error = exc
            print(f"[parse] key #{index} kena HTTP 402 (kredit habis)")
    else:
        sys.exit(
            "ERROR: semua API key LlamaCloud kehabisan kredit. "
            "Tunggu reset kuota bulanan atau pasang LLAMA_CLOUD_API_KEY_BACKUP."
            + (f"\n{last_error}" if last_error else "")
        )
    markdown = result.get("markdown", "")
    if not markdown.strip():
        sys.exit("ERROR: hasil markdown kosong")

    md_path = out_dir / f"{slug}.md"
    md_path.write_text(markdown, encoding="utf-8")

    manifest = {
        "slug": slug,
        "judul": args.judul,
        "job_id": job_id,
        "pages": len(markdown.split("\n---\n")),
        "chars": len(markdown),
        "parsed_at": datetime.now(timezone.utc).isoformat(),
        "parse_mode": f"{PARSE_MODE}/{MODEL}/high_res_ocr",
        "source_pdf": pdf_path.name,
    }
    manifest_path = out_dir / f"{slug}.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[parse] OK: {md_path} ({len(markdown):,} karakter)")
    print(f"[parse] manifest: {manifest_path}")


if __name__ == "__main__":
    main()
