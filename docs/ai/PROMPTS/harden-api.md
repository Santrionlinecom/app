# Harden API Prompt

Audit dan harden endpoint API SantriOnline.

Tugas:

1. Baca `git status --short`.
2. Pilih endpoint yang diminta, lalu baca handler dan helper server terkait.
3. Pastikan endpoint memiliki auth check.
4. Pastikan role boundary eksplisit.
5. Pastikan query dan mutasi data org-scoped.
6. Tambahkan rate limit untuk endpoint mahal, sensitif, atau rawan abuse.
7. Tambahkan audit log untuk aksi penting tanpa menyimpan data sensitif mentah.
8. Jangan mengubah schema kecuali perlu dan migration disediakan.
9. Jalankan `npm run check` dan `npm run build`.

Output:

- Endpoint yang diaudit
- Perubahan hardening
- Boundary role/org-scope
- Rate limit/audit log
- Hasil check/build
- Risiko tersisa
