# Quick Start: Refactoring SantriOnline Structure

**Tujuan:** Panduan cepat untuk memulai refactoring struktur project SantriOnline

---

## 🚀 Langkah Cepat (Quick Wins)

### 1. Fix Migration Numbering (15 menit)

```bash
# Analyze current state
node scripts/fix-migration-numbering.mjs analyze

# Dry run (lihat perubahan tanpa apply)
node scripts/fix-migration-numbering.mjs dry-run

# Apply changes (pastikan sudah commit dulu!)
git add -A
git commit -m "chore: backup before migration renumbering"
node scripts/fix-migration-numbering.mjs fix

# Verify
node scripts/fix-migration-numbering.mjs verify
```

**Hasil:**
- ✅ Migration files terurut: 0001, 0002, 0003, dst
- ✅ Tidak ada duplikasi numbering
- ✅ Format konsisten
- ✅ Backup tersimpan di `migrations-backup/`

---

### 2. Cleanup Component Naming (30 menit)

```bash
# Rename folder UI/ menjadi ui/ (jika ada duplikasi)
cd src/lib/components
mv UI ui-temp
rm -rf UI
mv ui-temp ui

# Pindahkan loose components ke folder
mkdir -p ui/badge ui/button ui/progress-ring
mv Badge.svelte ui/badge/
mv Button.svelte ui/button/
mv ProgressRing.svelte ui/progress-ring/

# Update imports di seluruh project
# Gunakan find & replace di IDE:
# From: from '$lib/components/Badge.svelte'
# To:   from '$lib/components/ui/badge/Badge.svelte'
```

---

### 3. Create Path Aliases (10 menit)

Edit `svelte.config.js`:

```javascript
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $lib: 'src/lib',
      $components: 'src/lib/components',
      $ui: 'src/lib/components/ui',
      $features: 'src/lib/components/features',
      $server: 'src/lib/server',
      $domains: 'src/lib/server/domains',
      $services: 'src/lib/server/services',
      $utils: 'src/lib/utils',
      $types: 'src/lib/types',
      $stores: 'src/lib/stores'
    }
  }
};

export default config;
```

**Benefit:** Import lebih clean dan mudah refactor

```typescript
// Before
import { getUser } from '../../../lib/server/users';

// After
import { getUser } from '$domains/auth/users';
```

---

## 📋 Checklist Implementasi Bertahap

### Week 1: Foundation & Critical Fixes

- [ ] **Day 1-2: Migration Files**
  - [ ] Backup semua migration files
  - [ ] Run fix-migration-numbering script
  - [ ] Test migrations di local
  - [ ] Update migration tracker di D1
  - [ ] Commit changes

- [ ] **Day 3-4: Path Aliases**
  - [ ] Setup path aliases di svelte.config.js
  - [ ] Setup path aliases di tsconfig.json
  - [ ] Test build
  - [ ] Commit changes

- [ ] **Day 5: Component Cleanup**
  - [ ] Audit duplicate folders (UI/ vs ui/)
  - [ ] Rename/merge folders
  - [ ] Move loose components to folders
  - [ ] Update imports
  - [ ] Test all pages
  - [ ] Commit changes

### Week 2: Server Library Refactor (Phase 1)

- [ ] **Day 1: Create Structure**
  ```bash
  mkdir -p src/lib/server/{core,domains,services,middleware,utils}
  mkdir -p src/lib/server/domains/{auth,tpq,digital-store,buku,kitab,quran,cms,organization,shortlink,admin}
  ```

- [ ] **Day 2-3: Move Core Files**
  - [ ] Move lucia.ts → core/
  - [ ] Move cloudflare.ts → core/
  - [ ] Move logger.ts → core/
  - [ ] Update imports
  - [ ] Test auth flow
  - [ ] Commit changes

- [ ] **Day 4-5: Move Auth Domain**
  - [ ] Move auth/ folder → domains/auth/
  - [ ] Move password.ts → domains/auth/
  - [ ] Move turnstile.ts → domains/auth/
  - [ ] Update imports
  - [ ] Test login/register
  - [ ] Commit changes

### Week 3: Server Library Refactor (Phase 2)

- [ ] **Day 1-2: Move TPQ Domain**
  - [ ] Create domains/tpq/ structure
  - [ ] Move tpq-academic.ts → domains/tpq/academic.ts
  - [ ] Move hafalan.ts → domains/tpq/hafalan.ts
  - [ ] Move santri-ustadz.ts → domains/tpq/
  - [ ] Update imports
  - [ ] Test TPQ features
  - [ ] Commit changes

- [ ] **Day 3-4: Move Digital Store Domain**
  - [ ] Create domains/digital-store/ structure
  - [ ] Move digital-commerce.ts → domains/digital-store/
  - [ ] Move payments/ → services/payment-gateway/
  - [ ] Move licenses/ → domains/digital-store/
  - [ ] Update imports
  - [ ] Test checkout flow
  - [ ] Commit changes

- [ ] **Day 5: Move Buku Domain**
  - [ ] Create domains/buku/ structure
  - [ ] Move buku-*.ts files
  - [ ] Update imports
  - [ ] Test buku features
  - [ ] Commit changes

### Week 4: Remaining Domains

- [ ] **Day 1: Kitab Domain**
- [ ] **Day 2: Quran Domain**
- [ ] **Day 3: CMS Domain**
- [ ] **Day 4: Organization Domain**
- [ ] **Day 5: Shortlink & Admin Domains**

### Week 5-6: Components Refactor

- [ ] Create features/ structure
- [ ] Move domain-specific components
- [ ] Update imports
- [ ] Test all pages

### Week 7-8: Routes Refactor

- [ ] Plan route grouping
- [ ] Create new route structure
- [ ] Move routes incrementally
- [ ] Update navigation
- [ ] Test all routes

---

## 🛠️ Helper Commands

### Find & Replace Imports

```bash
# Find all imports from old path
grep -r "from '\$lib/server/users'" src/

# Replace with new path (use IDE for safety)
# VS Code: Cmd+Shift+H (Mac) or Ctrl+Shift+H (Windows)
```

### Check for Broken Imports

```bash
# TypeScript check
npm run check

# Build check
npm run build
```

### Test After Changes

```bash
# Run dev server
npm run dev

# Test specific feature
# - Login/Register
# - TPQ Dashboard
# - Digital Store
# - Buku Reader
```

---

## ⚠️ Safety Rules

1. **Always commit before major changes**
   ```bash
   git add -A
   git commit -m "chore: backup before [change description]"
   ```

2. **Test after each domain migration**
   - Run `npm run check`
   - Test affected features manually
   - Check console for errors

3. **Keep backup of old structure**
   - Don't delete old files immediately
   - Keep them for 1-2 weeks
   - Mark with `.old` extension

4. **Update one domain at a time**
   - Don't mix multiple domains in one commit
   - Easier to rollback if needed

5. **Document breaking changes**
   - Update CHANGES.md
   - Notify team members

---

## 🎯 Success Indicators

After each phase, check:

- [ ] ✅ TypeScript compilation passes (`npm run check`)
- [ ] ✅ Build succeeds (`npm run build`)
- [ ] ✅ Dev server runs without errors
- [ ] ✅ All tests pass (if any)
- [ ] ✅ Manual testing of affected features works
- [ ] ✅ No console errors in browser
- [ ] ✅ Changes committed with clear message

---

## 🆘 Rollback Plan

If something breaks:

```bash
# Rollback last commit
git reset --hard HEAD~1

# Or restore specific files
git checkout HEAD~1 -- src/lib/server/users.ts

# Or restore from backup
cp migrations-backup/* migrations/
```

---

## 📞 Need Help?

- Check: [STRUKTUR_PROFESIONAL_REKOMENDASI.md](./STRUKTUR_PROFESIONAL_REKOMENDASI.md)
- Check: [AGENTS.md](../AGENTS.md)
- Ask: Team lead or senior developer

---

**Remember:** Slow and steady wins the race. Better to do it right than to do it fast! 🐢✨
