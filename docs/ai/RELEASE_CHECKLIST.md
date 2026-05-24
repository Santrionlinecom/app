# Release Checklist

## Sebelum Coding

- Baca `git status --short`.
- Catat file yang sudah dirty sebelum perubahan.
- Jangan sentuh `wrangler.toml`, `.save`, `.bak`, atau backup kecuali diminta.
- Pahami route, auth boundary, dan scope data yang akan disentuh.

## Setelah Coding

- Jalankan `npm run check`.
- Jalankan `npm run build`.
- Review `git diff --stat`.
- Review file yang terhapus atau ditambah.
- Pastikan tidak ada perubahan schema tanpa migration.
- Pastikan tidak ada endpoint sensitif tanpa auth, role, org scope, dan rate limit bila perlu.

## Sebelum Commit

- Jangan gunakan `git add .`.
- Stage file spesifik sesuai task.
- Jangan stage `wrangler.toml` bila tidak diminta.
- Jangan stage file `.save`, `.bak`, atau backup.
- Gunakan commit message yang menjelaskan dampak utama.

## Output Akhir

- Ringkasan file diubah.
- Dampak fitur.
- Risiko tersisa.
- Hasil check/build.
- Saran commit message.
