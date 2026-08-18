# Kitab Pipeline — Parse → R2 → Vectorize

Pipeline offline (dijalankan dari WSL) untuk mengubah PDF kitab menjadi markdown
berkualitas tinggi (LlamaParse mode agentic), menyimpannya sebagai artefak permanen
di R2, lalu meng-ingest chunk-nya ke Vectorize + D1 untuk fitur tanya-jawab RAG
di `app.santrionline.com/kitab`.

## Prasyarat

- `~/.config/llamacloud.env` berisi `LLAMA_CLOUD_API_KEY=llx-...`
  (dan nanti `KITAB_INGEST_SECRET=...` untuk Fase 2)
- Python 3 (stdlib saja, tanpa pip install)
- `npx wrangler` login ke akun Cloudflare (untuk upload R2)

## Alur per kitab (4 perintah)

```bash
source ~/.config/llamacloud.env
cd scripts/kitab-pipeline

# 1. Parse PDF → out/<slug>.md (+ manifest out/<slug>.json)
python3 parse.py --pdf /path/kitab.pdf --slug nama-kitab --judul "Judul Kitab"

# 2. Chunk markdown → out/<slug>.chunks.json
python3 chunk.py out/nama-kitab.md

# 3. Upload markdown + manifest ke R2 (kitab-markdown/<slug>.md)
./upload-r2.sh nama-kitab

# 4. Ingest chunk ke Vectorize via endpoint ber-secret (Fase 2)
python3 ingest.py out/nama-kitab.chunks.json
```

## Catatan

- Mode parse TERUJI 2026-08-19: `parse_mode=parse_page_with_agent`,
  `model=anthropic-sonnet-4.5`, `high_res_ocr=true` — tabel Arab berharakat sempurna.
  Mode basic (1 kredit/hal) merusak urutan huruf Arab dalam tabel; jangan dipakai
  untuk kitab Arab.
- Biaya: kuota gratis LlamaCloud 10K kredit/bulan; kitab 29 hal mode agentic ≈ ratusan
  kredit. Pantau di https://cloud.llamaindex.ai
- `out/` dan `*.pdf` TIDAK ikut git (lihat .gitignore). Artefak resmi ada di R2.
- Kitab besar (> ~135 chunk): pecah per jilid dengan `--slug kitab-jilid-2` dan
  `corpus_key` otomatis berbeda.
