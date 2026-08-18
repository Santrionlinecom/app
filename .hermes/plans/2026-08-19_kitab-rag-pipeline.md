# Kitab Digital RAG Pipeline — Implementation Plan

> **For Hermes:** Kerjakan task-by-task, commit per task, verifikasi tiap langkah.
> Dibuat: 2026-08-19 · Status: DISETUJUI untuk disusun (eksekusi menunggu perintah Mas Yogik)

**Goal:** Pipeline lengkap PDF kitab → LlamaParse (agentic) → markdown di R2 → chunking → embedding Workers AI → Vectorize + D1 → tanya-jawab RAG di `/kitab`.

**Architecture:** Parsing berat dilakukan OFFLINE dari WSL (sekali jalan per kitab, kuota gratis LlamaCloud). Hasil markdown adalah artefak permanen milik sendiri di R2. Ingest ke Vectorize lewat endpoint baru ber-secret di app (memakai infra `insertDokumenBatch` yang SUDAH ADA). Production tidak pernah bergantung ke LlamaCloud saat runtime.

**Tech Stack:** LlamaParse API (mode `parse_page_with_agent`), Cloudflare R2 (`santri-online-files`), Vectorize (`santri_kitab_index`), Workers AI (`@cf/google/embeddinggemma-300m`), D1 (`db-app`), SvelteKit.

---

## Kondisi yang SUDAH ADA (jangan dibangun ulang)

| Komponen | Lokasi | Status |
|---|---|---|
| Vectorize binding | `wrangler.toml` → `VECTORIZE_INDEX` / `santri_kitab_index` | ✅ |
| R2 binding | `wrangler.toml` → `BUCKET` / `santri-online-files` | ✅ |
| Workers AI binding | `wrangler.toml` → `AI` | ✅ |
| Mesin RAG lengkap | `src/lib/server/rag.ts` (embedding, chunk id stabil, reservation, reconcile, batch ≤15) | ✅ |
| Tabel D1 | `kitab_referensi`, `kitab_corpora` (auto-migrate) | ✅ |
| Endpoint upload (session-auth) | `src/routes/api/kitab/upload/+server.ts` (PDF text-layer basic + JSON chunks) | ✅ |
| Endpoint tanya | `src/routes/api/kitab/tanya/+server.ts` | ✅ |
| Katalog kitab | D1 `kitab_catalog` (9 entri) + `src/lib/data/kitab-curated.ts` (4 PDF) | ✅ |
| API key LlamaCloud | WSL `~/.config/llamacloud.env` (`LLAMA_CLOUD_API_KEY`, sudah teruji parse 29 hal) | ✅ |

**Gap yang ditutup plan ini:**
1. Kualitas teks: extractor basic (`$lib/server/pdf`) buruk untuk Arab; LlamaParse agentic terbukti sempurna
2. Belum ada penyimpanan markdown hasil parse (R2) sebagai artefak permanen
3. Belum ada jalur ingest machine-to-machine dari WSL (endpoint existing pakai session cookie)
4. Belum ada halaman baca markdown per kitab

---

## FASE 1 — Skrip Parser WSL (offline, `scripts/kitab-pipeline/`)

### Task 1.1: Buat struktur + konfigurasi pipeline
**Files:** Create `scripts/kitab-pipeline/README.md`, `scripts/kitab-pipeline/.gitignore` (isi: `out/`, `*.pdf`)
- Direktori kerja: `scripts/kitab-pipeline/` di repo `app.santrionline` (ikut git, TANPA file rahasia/PDF)
- Commit: `chore(kitab): scaffold pipeline parsing kitab`

### Task 1.2: Skrip parse LlamaParse
**Files:** Create `scripts/kitab-pipeline/parse.py` (Python stdlib + `urllib`/`requests`)
Perilaku:
1. Input: `--pdf <path|url> --slug <kitab-slug> --judul "..."`
2. Upload ke `POST https://api.cloud.llamaindex.ai/api/v1/parsing/upload` dengan `parse_mode=parse_page_with_agent`, `model=anthropic-sonnet-4.5`, `high_res_ocr=true` (kombinasi TERUJI 2026-08-19: tabel Arab berharakat sempurna)
3. Poll `GET /parsing/job/{id}` tiap 10 dtk (timeout 15 mnt)
4. Simpan `GET /parsing/job/{id}/result/markdown` → `out/<slug>.md`
5. Tulis manifest `out/<slug>.json`: `{slug, judul, job_id, pages, chars, parsed_at, parse_mode}`
**Verifikasi:** `source ~/.config/llamacloud.env && python3 scripts/kitab-pipeline/parse.py --pdf /tmp/kitab-test.pdf --slug panduan-durusul-lughah-1 --judul "Panduan Durusul Lughah 1"` → `out/panduan-durusul-lughah-1.md` berisi `إِمَامٌ` (bukan `ما مِإ`)
**Commit:** `feat(kitab): skrip parse LlamaParse agentic`

### Task 1.3: Skrip chunking markdown
**Files:** Create `scripts/kitab-pipeline/chunk.py`
Perilaku:
1. Input: `out/<slug>.md` + manifest
2. Pecah per heading `## / #` (per pelajaran/bab); sub-pecah paragraf jika chunk > 1.800 karakter; buang halaman sampah (header berulang, URL footer)
3. Output `out/<slug>.chunks.json`: array `{text, metadata: {judul_kitab, kitab_slug, halaman, chapter, section_title, chunk_index, source_type: "llamaparse-agentic", corpus_key: "<slug>:llamaparse-v1"}}`
4. Batas aman: teks chunk 100–2.000 karakter, total ≤ 135 chunk per kitab (selaras `MAX_TEXT_CHUNKS` existing); kitab lebih besar → pecah per jilid dengan `corpus_key` berbeda
**Verifikasi:** `python3 scripts/kitab-pipeline/chunk.py out/panduan-durusul-lughah-1.md` → cetak jumlah chunk, spot-check chunk Pelajaran 2 mengandung tabel kosa-kata utuh
**Commit:** `feat(kitab): chunker markdown per bab`

### Task 1.4: Upload markdown ke R2
**Files:** Create `scripts/kitab-pipeline/upload-r2.sh`
```bash
# key R2: kitab-markdown/<slug>.md  (+ manifest .json)
npx wrangler r2 object put "santri-online-files/kitab-markdown/${SLUG}.md" --file "out/${SLUG}.md" --remote
```
CATATAN WSL: kalau `wrangler r2` bermasalah dari WSL, fallback `cmd.exe /c` sesuai skill `cloudflare-worker-wsl-deploy`.
**Verifikasi:** `npx wrangler r2 object get santri-online-files/kitab-markdown/<slug>.md --remote --pipe | head -5`
**Commit:** `feat(kitab): upload artefak markdown ke R2`

---

## FASE 2 — Endpoint Ingest (app, machine-to-machine)

### Task 2.1: Secret ingest
- `npx wrangler pages secret put KITAB_INGEST_SECRET` (nilai: generate `openssl rand -hex 32`, simpan juga di `~/.config/llamacloud.env` sebagai `KITAB_INGEST_SECRET`)
- Tambah ke `src/app.d.ts` Platform env typing bila perlu

### Task 2.2: Endpoint `POST /api/kitab/ingest`
**Files:** Create `src/routes/api/kitab/ingest/+server.ts`
Perilaku (pakai infra existing dari `$lib/server/rag`):
1. Auth: header `x-ingest-secret` === `platform.env.KITAB_INGEST_SECRET`; tolak 401 jika kosong/salah. TANPA session — tapi rate-limit `consumeApiRateLimit` scope `kitab:ingest` 60/10mnt
2. Body: `{kitabSlug, corpusKey, judul, chunks: [...]}` (max 15 chunk per request — klien yang mengulang batch)
3. Aksi `init`: `reserveKitabCorpus` dengan `indexRevision` baru + `expectedChunks`
4. Aksi `batch`: `insertDokumenBatch(platform, chunks, {indexRevision, requireReservation: true})`
5. Aksi `finalize`: `reconcileIndexingKitabRows` + update `kitab_corpora.status`
6. Gagal → `markKitabCorpusFailed`
**Verifikasi:** `npm run check` 0 errors; curl tanpa secret → 401; deploy preview → curl init+batch 1 chunk dummy → cek D1 `kitab_referensi` status
**Commit:** `feat(kitab): endpoint ingest ber-secret untuk pipeline WSL`

### Task 2.3: Skrip ingest WSL
**Files:** Create `scripts/kitab-pipeline/ingest.py`
- Baca `out/<slug>.chunks.json`, POST `init` → loop batch 15 → `finalize` ke `https://app.santrionline.com/api/kitab/ingest` dengan header secret; retry 3x per batch; log progres
**Verifikasi:** jalankan untuk kitab uji → response akhir `{status:"indexed", chunks:N}`
**Commit:** `feat(kitab): klien ingest pipeline`

---

## FASE 3 — Halaman Baca + Integrasi `/kitab`

### Task 3.1: Kolom penanda di `kitab_catalog`
**Files:** Modify `src/lib/server/kitab-catalog.ts`
- Auto-migrate kolom: `parsed_r2_key TEXT`, `parsed_at TEXT`, `rag_status TEXT` (pola PRAGMA existing di file itu)
**Commit:** `feat(kitab): kolom status parsing di katalog`

### Task 3.2: Halaman baca `/kitab/[slug]/baca`
**Files:** Create `src/routes/(app)/kitab/[slug]/baca/+page.server.ts` + `+page.svelte`
- Load: ambil `parsed_r2_key` dari katalog → `platform.env.BUCKET.get(key)` → render markdown (pakai renderer markdown yang sudah dipakai kursus/blog; sanitasi tetap jalan)
- RTL: bungkus konten dengan `dir="auto"` + font Arab yang sudah ada di app
- Tombol "Tanya Kitab Ini" → panel existing `/api/kitab/tanya` dengan filter `kitab_slug`
**Verifikasi:** `npm run check`; buka `/kitab/panduan-durusul-lughah-1/baca` → markdown tampil, harakat benar, tabel rapi
**Commit:** `feat(kitab): halaman baca markdown hasil parse`

### Task 3.3: Badge di daftar `/kitab`
**Files:** Modify `src/routes/(app)/kitab/+page.svelte`
- Item dengan `rag_status='indexed'` dapat badge "📖 Bisa Dibaca + Tanya AI" dan link ke `/baca`
**Commit:** `feat(kitab): badge kitab ter-indeks`

---

## FASE 4 — Eksekusi Massal + Verifikasi

### Task 4.1: Parse semua kitab PDF katalog (±4-13 file)
- Loop: `parse.py` → `chunk.py` → `upload-r2.sh` → `ingest.py` per kitab, MULAI dari 4 PDF `kitab-assets` (Durusul Lughah 1-4)
- Kitab sumber Google Drive: unduh manual dulu (`toDriveDownloadUrl` pattern ada di `$lib/server/pdf`), verifikasi lisensi boleh disebarkan (semua koleksi Maktabah Raudhah al-Muhibbin = copyleft non-komersial, AMAN)
- Anggaran kredit: ±29-45 kredit/kitab kecil → seluruh katalog ≪ 10K kredit gratis/bulan

### Task 4.2: Smoke test end-to-end production
1. `curl /kitab/<slug>/baca` → 302 auth (shell app) ✓; login → konten tampil
2. Tanya via `/api/kitab/tanya`: "apa arti سُكَّرٌ di pelajaran 2?" → jawaban mengutip chunk benar
3. D1: `SELECT kitab_slug, status, COUNT(*) FROM kitab_referensi GROUP BY 1,2` → semua `indexed`

### Task 4.3: Dokumentasi + catat keputusan
- Update `scripts/kitab-pipeline/README.md` (cara tambah kitab baru: 4 perintah)
- Catat ke Obsidian `Decisions/2026-08-19-kitab-rag-pipeline.md`

---

## Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| LlamaCloud mengubah harga/API | Markdown di R2 = artefak permanen; parsing tinggal diulang dengan alat lain jika perlu |
| Kredit habis (kitab besar ratusan halaman) | Mode agentic hanya untuk kitab Arab kompleks; kitab teks-Latin pakai mode basic (1 kredit/hal); antre lintas bulan |
| Secret ingest bocor | Hanya bisa menulis chunk kitab (bukan data user); rotasi via `wrangler pages secret put` |
| Duplikasi ingest ulang | Chunk ID stabil (`buildKitabChunkId`) + `corpus_key` versioned → upsert idempotent |
| Embedding limit Workers Free | Batch ≤15 sudah di-enforce `insertDokumenBatch`; ingest klien retry dengan backoff |
| Kualitas parse kitab kuning scan tua | Uji per kitab; jika gagal → naikkan `high_res_ocr` / coba `parse_page_with_lvm`; terima-tolak manual sebelum ingest |

## Open Questions (putuskan saat eksekusi)
1. Kitab dari Google Drive: parse semua atau kurasi dulu oleh Mas Yogik?
2. Akses `/kitab/[slug]/baca`: semua user login, atau perlu gate coin/langganan? (default plan: semua user login)
3. Model tanya-jawab existing `llama-3.2-3b` cukup? (upgrade ke model lebih besar = biaya Workers AI naik — evaluasi setelah pilot)
