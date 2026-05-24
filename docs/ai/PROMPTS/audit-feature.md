# Audit Feature Prompt

Audit satu fitur SantriOnline tanpa langsung mengubah kode.

Tugas:

1. Baca `git status --short`.
2. Identifikasi route, komponen, server load/action, endpoint API, dan tabel yang terkait.
3. Periksa apakah akses sudah auth, role-aware, dan org-scoped.
4. Periksa apakah ada alias lama atau navigasi ganda.
5. Periksa apakah dokumentasi masih sinkron.
6. Laporkan temuan sebelum mengedit.

Output:

- Scope fitur
- File terkait
- Route/API terkait
- Data/table terkait
- Risiko auth/RBAC/org-scope
- Risiko UX/navigasi
- Rekomendasi perubahan kecil
