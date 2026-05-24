# Prepare Commit Prompt

Audit perubahan repo saat ini.

Tugas:

1. Baca `git status --short`.
2. Jangan gunakan `git add .`.
3. Pisahkan file yang relevan dengan task saat ini.
4. Jangan stage `wrangler.toml` kecuali diminta.
5. Jangan stage file `.save`, `.bak`, atau backup.
6. Jalankan `npm run check`.
7. Jalankan `npm run build`.
8. Berikan command `git add` spesifik.
9. Berikan commit message conventional commit.

Output:

- File yang boleh di-stage
- File yang jangan disentuh
- Risiko
- Command git add
- Commit message
