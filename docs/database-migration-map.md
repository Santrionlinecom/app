# Database Migration Map - SantriOnline

## ⚠️ CRITICAL: Migration Immutability Rule

**JANGAN PERNAH rename, edit, atau hapus migration yang sudah ada.**

Alasan:
- Migration kemungkinan sudah applied di remote/production
- Cloudflare D1 tracking migration berdasarkan filename
- Mengubah migration lama akan menyebabkan inconsistency antara local dan remote
- Risk: data corruption, schema mismatch, deployment failure

---

## 📊 Current Migration Status

### Total Migrations: 47 files

### Known Numbering Issues

#### 1. Duplicate 0005
- `0005_org_media.sql`
- `0005_shortlink_categories.sql`

#### 2. Duplicate 0030
- `0030_kitab_references.sql`
- `0030_short_links.sql`

#### 3. Duplicate 0038
- `0038_payment_orders.sql`
- `0038_santri_learn.sql`

#### 4. Old Format (001-003)
- `001_cms_posts.sql`
- `002_add_seo_fields.sql`
- `003_media_library.sql`

**Catatan:** Format lama menggunakan 3 digit, format baru menggunakan 4 digit dengan prefix 0.

---

## 📋 Complete Migration List (Chronological Order)

### Legacy Format (001-003)
1. `001_cms_posts.sql` - CMS posts table
2. `002_add_seo_fields.sql` - SEO fields addition
3. `003_media_library.sql` - Media library setup

### Modern Format (0004-0046)
4. `0004_update_schema_baru.sql` - Schema update
5. `0005_org_media.sql` - Organization media
6. `0005_shortlink_categories.sql` - ⚠️ DUPLICATE NUMBER
7. `0006_add_indexes.sql` - Database indexes
8. `0007_create_traffic_sources.sql` - Traffic sources
9. `0008_activity_logs.sql` - Activity logging
10. `0009_system_logs.sql` - System logging
11. `0010_santri_ustadz.sql` - Santri & Ustadz tables
12. `0011_jadwal_tarawih.sql` - Tarawih schedule
13. `0012_org_assets.sql` - Organization assets
14. `0013_jadwal_imam_khotib.sql` - Imam & Khotib schedule
15. `0014_tpq_only_cleanup.sql` - TPQ cleanup
16. `0015_licenses.sql` - License system
17. `0016_tpq_academic_workflow.sql` - TPQ academic flow
18. `0017_streamer_license_service.sql` - Streamer license
19. `0018_normalize_super_admin_role.sql` - Super admin normalization
20. `0019_streamer_license_plaintext_key.sql` - License key plaintext
21. `0020_digital_commerce.sql` - Digital commerce
22. `0021_kitab_library.sql` - Kitab library
23. `0022_digital_manual_checkout.sql` - Manual checkout
24. `0023_buku_novel_coin.sql` - Book, novel, coin system
25. `0024_buku_author_royalties.sql` - Author royalties
26. `0025_buku_reading_progress.sql` - Reading progress
27. `0026_rapor_hafalan_kategori.sql` - Rapor hafalan categories
28. `0027_ai_generations.sql` - AI generation logs
29. `0028_drm_books.sql` - DRM for books
30. `0029_news_auto_columns.sql` - News auto columns
31. `0030_kitab_references.sql` - Kitab references
32. `0030_short_links.sql` - ⚠️ DUPLICATE NUMBER
33. `0031_normalize_superadmin_role_alias.sql` - Superadmin alias
34. `0032_shortlink_category_columns.sql` - Shortlink category columns
35. `0033_quran_asbab.sql` - Quran Asbabun Nuzul
36. `0034_quran_tafsir.sql` - Quran Tafsir
37. `0035_quran_user_features.sql` - Quran user features
38. `0036_remove_shortlink_tags.sql` - Remove shortlink tags
39. `0037_multi_lembaga.sql` - Multi-lembaga support
40. `0038_payment_orders.sql` - Payment orders
41. `0038_santri_learn.sql` - ⚠️ DUPLICATE NUMBER
42. `0039_santri_learn_seed.sql` - Santri learn seed data
43. `0040_social_media.sql` - Social media integration
44. `0041_user_avatar_url.sql` - User avatar URL
45. `0042_sosmed.sql` - Social media tables
46. `0043_rbac_memberships.sql` - RBAC memberships
47. `0044_user_public_handle.sql` - User public handle
48. `0045_add_lembaga_coordinates.sql` - Lembaga coordinates
49. `0046_digital_product_licenses.sql` - Digital product licenses

---

## 🎯 Recommendations

### For New Migrations

**Next safe migration number: 0047**

Gunakan format: `0047_descriptive_name.sql`

### Migration Naming Convention
```
[4-digit-number]_[descriptive_snake_case_name].sql

Examples:
✅ 0047_add_notification_system.sql
✅ 0048_create_payment_gateway_logs.sql
✅ 0049_add_user_preferences.sql

❌ 47_notification.sql (missing leading zeros)
❌ 0047-notification-system.sql (use underscore, not dash)
❌ 0047_NotificationSystem.sql (use snake_case, not PascalCase)
```

### Handling Duplicate Numbers

**DO NOT rename existing migrations.**

Instead:
1. Document which migration was applied first (check remote D1)
2. For future reference, note the actual execution order
3. Continue with next available number (0047+)

### Future Baseline Strategy

Untuk environment baru (staging/production baru):
1. Buat `baseline_schema.sql` yang berisi consolidated schema
2. Gunakan baseline untuk fresh install
3. Tetap maintain incremental migrations untuk existing environments
4. Baseline hanya untuk dokumentasi dan fresh setup

---

## 🛡️ Safe Migration Rules

### 1. Schema vs Seed Separation
```sql
-- ✅ GOOD: Schema migration
-- 0047_create_notifications_table.sql
CREATE TABLE notifications (...);

-- ✅ GOOD: Seed migration (separate file)
-- 0048_seed_notification_types.sql
INSERT INTO notification_types (...);
```

### 2. No Destructive Operations Without Backup
```sql
-- ❌ DANGEROUS: Direct DROP
DROP TABLE old_table;

-- ✅ SAFE: Rename first, then schedule cleanup
ALTER TABLE old_table RENAME TO old_table_backup_20260603;
-- Schedule manual cleanup after verification
```

### 3. Index Creation
```sql
-- ✅ GOOD: Separate migration for indexes
-- 0047_add_performance_indexes.sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_santri_org_id ON santri(organization_id);
```

### 4. Column Addition (Safe Pattern)
```sql
-- ✅ SAFE: Add column with default
ALTER TABLE users ADD COLUMN phone TEXT DEFAULT '';

-- ⚠️ RISKY: Add NOT NULL without default
-- ALTER TABLE users ADD COLUMN phone TEXT NOT NULL;
```

### 5. Column Removal (Safe Pattern)
```sql
-- Step 1: Make column nullable (if NOT NULL)
-- 0047_prepare_column_removal.sql
-- (Update application code to stop using column)

-- Step 2: Remove column (after verification)
-- 0048_remove_deprecated_column.sql
ALTER TABLE users DROP COLUMN deprecated_field;
```

---

## 🚀 Migration Workflow

### Local Development
```bash
# 1. Create new migration
touch migrations/0047_feature_name.sql

# 2. Write migration SQL
# (edit file)

# 3. Test locally
npm run db:migrate:local
# or
wrangler d1 migrations apply DB_NAME --local

# 4. Verify schema
npm run db:check
```

### Remote Deployment
```bash
# 1. Test migration locally first (MANDATORY)
wrangler d1 migrations apply DB_NAME --local

# 2. Verify application works with new schema
npm run dev

# 3. Run tests (if available)
npm test

# 4. Apply to remote (AFTER local verification)
wrangler d1 migrations apply DB_NAME --remote

# 5. Verify remote application
# (check production/staging)

# 6. Monitor for errors
# (check logs, Sentry, etc.)
```

### Rollback Strategy
```bash
# D1 does not support automatic rollback
# Manual rollback required:

# 1. Create reverse migration
touch migrations/0048_rollback_feature_name.sql

# 2. Write reverse SQL
# (DROP TABLE, ALTER TABLE, etc.)

# 3. Apply rollback migration
wrangler d1 migrations apply DB_NAME --remote
```

---

## 📝 Migration Checklist

Before creating a new migration:
- [ ] Check last migration number (currently 0046)
- [ ] Use next sequential number (0047)
- [ ] Use descriptive snake_case name
- [ ] Separate schema and seed if needed
- [ ] Avoid destructive operations
- [ ] Test locally first
- [ ] Verify application compatibility
- [ ] Document breaking changes (if any)

Before applying to remote:
- [ ] Local migration successful
- [ ] Application tested with new schema
- [ ] No breaking changes (or documented)
- [ ] Rollback plan prepared
- [ ] Team notified (if breaking)
- [ ] Backup verified (if destructive)

---

## 🔍 Troubleshooting

### Migration Already Applied Error
```
Error: Migration 0047_xxx.sql already applied
```
**Solution:** Migration sudah applied, skip atau buat migration baru dengan nomor berikutnya.

### Schema Mismatch Error
```
Error: Table already exists
```
**Solution:** Check remote schema, mungkin migration sudah applied manual atau via different path.

### Duplicate Number Conflict
**Solution:** Jangan rename! Gunakan nomor berikutnya yang available.

---

## 📚 References

- [Cloudflare D1 Migrations Docs](https://developers.cloudflare.com/d1/platform/migrations/)
- [SantriOnline AGENTS.md](../AGENTS.md) - Project rules
- [Database Schema](../schema.sql) - Current schema reference

---

## 🔄 Maintenance Notes

**Last Updated:** 2026-06-03

**Current State:**
- Total migrations: 47 files
- Duplicate numbers: 3 instances (0005, 0030, 0038)
- Next safe number: 0047
- Format: 4-digit with leading zeros

**Action Items:**
- [ ] Document which duplicate migrations were applied first (check remote)
- [ ] Create baseline schema for future fresh installs
- [ ] Audit applied migrations on production
- [ ] Setup migration testing in CI/CD

---

**Remember:** Migration files are immutable once applied. Always move forward, never backward.
