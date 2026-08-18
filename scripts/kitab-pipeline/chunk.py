#!/usr/bin/env python3
"""Chunk markdown hasil parse.py menjadi potongan siap-embedding.

Pemakaian:
    python3 chunk.py out/<slug>.md

Output:
    out/<slug>.chunks.json — array {text, metadata:{...}} selaras KitabChunkInput
    di src/lib/server/rag.ts (metadata: judul_kitab, kitab_slug, halaman, chapter,
    section_title, chunk_index, source_type, corpus_key).

Aturan (selaras batas server):
- pecah per heading '#'/'##'; sub-pecah per paragraf bila > MAX_CHARS (1.800)
- buang sampah: header halaman berulang, footer URL, nomor halaman yatim
- chunk valid 100–2.000 karakter; total maksimum 135 (MAX_TEXT_CHUNKS server)
"""

import json
import re
import sys
from pathlib import Path

MAX_CHARS = 1800
MIN_CHARS = 100
HARD_MAX_CHARS = 2000
MAX_CHUNKS = 135
CORPUS_SUFFIX = "llamaparse-v1"

NOISE_PATTERNS = [
    re.compile(r"^\s*Panduan Durusul Lughah al-Arabiyyah\s*[–-]?\s*\d*\s*$", re.IGNORECASE),
    re.compile(r"^\s*https?://\S+\s*$"),
    re.compile(r"^\s*www\.\S+\s*$"),
    re.compile(r"^\s*RM\s*$"),
    re.compile(r"^\s*_{5,}\s*$"),
    re.compile(r"^\s*\d{1,3}\s*$"),  # nomor halaman yatim
]

HEADING_RE = re.compile(r"^(#{1,2})\s+(.*)$")
PAGE_BREAK_RE = re.compile(r"^\s*---\s*$")


def clean_lines(raw: str) -> list[str]:
    lines = []
    for line in raw.splitlines():
        if any(p.match(line) for p in NOISE_PATTERNS):
            continue
        lines.append(line.rstrip())
    return lines


def split_paragraphs(text: str) -> list[str]:
    """Pecah teks panjang pada batas paragraf, menjaga tabel markdown tetap utuh."""
    blocks: list[str] = []
    current: list[str] = []
    for para in re.split(r"\n\s*\n", text):
        para = para.strip("\n")
        if not para.strip():
            continue
        candidate = "\n\n".join(current + [para])
        if current and len(candidate) > MAX_CHARS:
            blocks.append("\n\n".join(current))
            current = [para]
        else:
            current.append(para)
    if current:
        blocks.append("\n\n".join(current))
    return blocks


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("Pemakaian: python3 chunk.py out/<slug>.md")
    md_path = Path(sys.argv[1])
    if not md_path.is_file():
        sys.exit(f"ERROR: tidak ditemukan: {md_path}")
    slug = md_path.stem
    manifest_path = md_path.with_suffix(".json")
    judul = slug
    if manifest_path.is_file():
        judul = json.loads(manifest_path.read_text(encoding="utf-8")).get("judul", slug)

    raw = md_path.read_text(encoding="utf-8")

    # Lacak halaman: pemisah '---' dari LlamaParse menandai batas halaman PDF
    page = 1
    sections: list[dict] = []  # {chapter, title, lines, page}
    current = {"chapter": None, "title": "Pembuka", "lines": [], "page": page}

    for line in clean_lines(raw):
        if PAGE_BREAK_RE.match(line):
            page += 1
            continue
        m = HEADING_RE.match(line)
        if m:
            if current["lines"]:
                sections.append(current)
            title = m.group(2).strip().lstrip("🗎🕮 ").strip("* ")
            current = {"chapter": title, "title": title, "lines": [], "page": page}
            continue
        current["lines"].append(line)
    if current["lines"]:
        sections.append(current)

    chunks: list[dict] = []
    for sec in sections:
        text = "\n".join(sec["lines"]).strip()
        if not text:
            continue
        for block in split_paragraphs(text):
            block = block.strip()
            if len(block) < MIN_CHARS:
                # gabungkan potongan mini ke chunk sebelumnya bila satu bab
                if chunks and chunks[-1]["metadata"]["chapter"] == sec["chapter"] and len(
                    chunks[-1]["text"] + "\n\n" + block
                ) <= HARD_MAX_CHARS:
                    chunks[-1]["text"] += "\n\n" + block
                continue
            if len(block) > HARD_MAX_CHARS:
                block = block[:HARD_MAX_CHARS]
            chunks.append(
                {
                    "text": block,
                    "metadata": {
                        "judul_kitab": judul,
                        "kitab_slug": slug,
                        "halaman": sec["page"],
                        "chapter": sec["chapter"],
                        "section_title": sec["title"],
                        "chunk_index": len(chunks),
                        "source_type": "llamaparse-agentic",
                        "corpus_key": f"{slug}:{CORPUS_SUFFIX}",
                    },
                }
            )

    if not chunks:
        sys.exit("ERROR: tidak ada chunk yang dihasilkan")
    if len(chunks) > MAX_CHUNKS:
        sys.exit(
            f"ERROR: {len(chunks)} chunk > batas {MAX_CHUNKS}. "
            "Pecah kitab per jilid (slug berbeda) lalu ulangi."
        )

    out_path = md_path.parent / f"{slug}.chunks.json"
    out_path.write_text(json.dumps(chunks, ensure_ascii=False, indent=1), encoding="utf-8")

    sizes = [len(c["text"]) for c in chunks]
    print(f"[chunk] OK: {out_path}")
    print(
        f"[chunk] {len(chunks)} chunk | ukuran min/med/max: "
        f"{min(sizes)}/{sorted(sizes)[len(sizes) // 2]}/{max(sizes)} karakter | "
        f"bab unik: {len({c['metadata']['chapter'] for c in chunks})}"
    )


if __name__ == "__main__":
    main()
