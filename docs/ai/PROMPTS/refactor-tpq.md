# Refactor TPQ Prompt

Rapikan TPQ akademik sebagai core product tanpa menambah fitur besar.

Konteks:

- Jalur canonical adalah `/tpq/akademik/setoran`, `/tpq/akademik/review`, dan `/tpq/akademik/riwayat`.
- Dashboard `/dashboard` harus menjadi satu pintu TPQ.
- Alias lama hanya boleh redirect role-aware atau hilang dari navigasi utama.

Tugas:

1. Audit route TPQ dan alias lama.
2. Pastikan navigasi utama memakai route canonical.
3. Pastikan query setoran, review, riwayat, rapor, sertifikat, dan agenda tetap org-scoped.
4. Jangan mengubah schema database kecuali benar-benar perlu.
5. Sinkronkan README, CHANGES, dan roadmap bila route/navigasi berubah.
6. Jalankan `npm run check`.
7. Jalankan `npm run build`.

Output:

- File diubah
- Alias yang dikunci/redirect
- Dampak ke UX TPQ
- Hasil check/build
- Risiko tersisa
- Saran commit message
