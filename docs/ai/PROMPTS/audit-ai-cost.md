# Audit AI Cost Prompt

Audit endpoint atau fitur AI agar biaya, keamanan, dan kualitas jawaban terkendali.

Tugas:

1. Baca `git status --short`.
2. Identifikasi semua call ke model AI, embedding, TTS, image generation, atau Vectorize.
3. Periksa auth, role boundary, dan org scope.
4. Periksa rate limit per user/IP/org.
5. Periksa batas panjang input dan sanitasi.
6. Periksa cache, quota, dan audit log biaya.
7. Untuk RAG, periksa citation/source id dan kualitas chunking.
8. Jangan menambah endpoint AI baru kecuali diminta.
9. Jalankan `npm run check` dan `npm run build` bila ada perubahan.

Output:

- Endpoint/fitur AI terkait
- Risiko biaya
- Risiko keamanan/data
- Guardrail yang sudah ada
- Guardrail yang perlu ditambah
- Rekomendasi prioritas
