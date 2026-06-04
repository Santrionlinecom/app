-- Migration: Simplify role system with role_level and secondary_roles
-- This migration implements the role simplification strategy:
-- 1. Add role_level for hierarchy (0=member, 1=staff, 2=manager, 3=admin)
-- 2. Add secondary_roles for multi-role support
-- 3. Add role_expires_at for temporary assignments
-- 4. Migrate existing roles to simplified structure

-- Step 1: Add new columns to organization_memberships
ALTER TABLE organization_memberships ADD COLUMN role_level INTEGER NOT NULL DEFAULT 0;
ALTER TABLE organization_memberships ADD COLUMN secondary_roles TEXT; -- JSON array
ALTER TABLE organization_memberships ADD COLUMN role_expires_at INTEGER;

-- Step 2: Create role display names table for UI
CREATE TABLE IF NOT EXISTS role_display_names (
  role TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  org_types TEXT NOT NULL, -- JSON array of applicable org types
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

-- Step 3: Seed role display names
INSERT INTO role_display_names (role, display_name, description, org_types) VALUES
-- Platform roles
('SUPER_ADMIN', 'Super Admin', 'Administrator platform dengan akses penuh', '["all"]'),
('support', 'Support', 'Tim support platform', '["all"]'),
('auditor', 'Auditor', 'Audit dan monitoring sistem', '["all"]'),

-- Universal org roles
('admin', 'Administrator', 'Administrator organisasi dengan akses penuh', '["tpq","pondok","rumah-tahfidz","masjid","musholla"]'),
('kepala', 'Kepala/Pimpinan', 'Kepala organisasi (Kepala TPQ, Pengasuh, Ketua Takmir)', '["tpq","pondok","rumah-tahfidz","masjid","musholla"]'),
('pengajar', 'Pengajar', 'Ustadz/Ustadzah pengajar', '["tpq","pondok","rumah-tahfidz","masjid","musholla"]'),
('pembimbing', 'Pembimbing', 'Pembimbing/Musyrif/Koordinator/Wali Kelas', '["tpq","pondok","rumah-tahfidz"]'),
('operator', 'Operator', 'Operator data dan administrasi', '["tpq","pondok","rumah-tahfidz","masjid","musholla"]'),
('bendahara', 'Bendahara', 'Pengelola keuangan', '["tpq","pondok","rumah-tahfidz","masjid","musholla"]'),
('sekretaris', 'Sekretaris', 'Administrasi dan dokumentasi', '["tpq","pondok","rumah-tahfidz","masjid","musholla"]'),
('humas', 'Humas', 'Public relations dan media sosial', '["tpq","pondok","rumah-tahfidz","masjid","musholla"]'),
('kurikulum', 'Kurikulum', 'Pengembangan program pembelajaran', '["tpq","pondok","rumah-tahfidz"]'),
('pembina', 'Pembina', 'Pembinaan karakter dan kedisiplinan', '["tpq","pondok","rumah-tahfidz"]'),
('santri', 'Santri', 'Siswa/Santri', '["tpq","pondok","rumah-tahfidz"]'),
('wali', 'Wali Santri', 'Orang tua/Wali santri', '["tpq","pondok","rumah-tahfidz"]'),
('alumni', 'Alumni', 'Alumni', '["pondok","rumah-tahfidz"]'),
('jamaah', 'Jamaah', 'Jamaah masjid/musholla', '["masjid","musholla"]'),

-- Special roles (masjid/musholla only)
('takmir', 'Takmir', 'Anggota takmir masjid/musholla', '["masjid","musholla"]'),
('imam', 'Imam', 'Imam sholat', '["masjid","musholla"]'),
('khotib', 'Khotib', 'Khotib Jumat', '["masjid","musholla"]'),
('muadzin', 'Muadzin', 'Muadzin', '["masjid","musholla"]');

-- Step 4: Create role migration mapping table
CREATE TABLE IF NOT EXISTS role_migration_map (
  old_role TEXT PRIMARY KEY,
  new_role TEXT NOT NULL,
  role_level INTEGER NOT NULL,
  notes TEXT
);

-- Step 5: Seed role migration mapping
INSERT INTO role_migration_map (old_role, new_role, role_level, notes) VALUES
-- TPQ migrations
('kepala_tpq', 'kepala', 3, 'Merged into generic kepala role'),
('koordinator', 'pembimbing', 2, 'Merged into pembimbing role'),
('wali_kelas', 'pembimbing', 2, 'Merged into pembimbing role'),
('ustadz', 'pengajar', 1, 'Merged ustadz/ustadzah into pengajar'),
('ustadzah', 'pengajar', 1, 'Merged ustadz/ustadzah into pengajar'),

-- Pondok migrations
('pengasuh', 'kepala', 3, 'Merged into generic kepala role'),
('musyrif', 'pembimbing', 2, 'Merged into pembimbing role'),

-- Rumah Tahfidz migrations
('kepala_tahfidz', 'kepala', 3, 'Merged into generic kepala role'),

-- Masjid/Musholla migrations
('ketua_takmir', 'kepala', 3, 'Merged into generic kepala role');

-- Step 6: Migrate existing organization_memberships roles
UPDATE organization_memberships
SET 
  role = (SELECT new_role FROM role_migration_map WHERE old_role = organization_memberships.role),
  role_level = (SELECT role_level FROM role_migration_map WHERE old_role = organization_memberships.role)
WHERE role IN (SELECT old_role FROM role_migration_map);

-- Step 7: Set role_level for roles that don't need migration
UPDATE organization_memberships
SET role_level = CASE
  WHEN role = 'admin' THEN 3
  WHEN role IN ('kepala', 'bendahara') THEN 3
  WHEN role IN ('pembimbing', 'operator', 'sekretaris', 'humas', 'kurikulum', 'pembina') THEN 2
  WHEN role IN ('pengajar', 'takmir', 'imam', 'khotib', 'muadzin') THEN 1
  WHEN role IN ('santri', 'wali', 'alumni', 'jamaah') THEN 0
  ELSE 0
END
WHERE role_level = 0;

-- Step 8: Create index for new columns
CREATE INDEX IF NOT EXISTS idx_memberships_role_level ON organization_memberships(org_id, role_level DESC);
CREATE INDEX IF NOT EXISTS idx_memberships_expires ON organization_memberships(role_expires_at) WHERE role_expires_at IS NOT NULL;

-- Step 9: Create role delegation table for temporary permissions
CREATE TABLE IF NOT EXISTS role_delegations (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  delegated_permissions TEXT NOT NULL, -- JSON array
  valid_from INTEGER NOT NULL,
  valid_until INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  CHECK (valid_from < valid_until)
);

CREATE INDEX IF NOT EXISTS idx_role_delegations_to_user ON role_delegations(to_user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_role_delegations_org ON role_delegations(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_role_delegations_validity ON role_delegations(valid_from, valid_until);

-- Step 10: Create permission usage logs for audit
CREATE TABLE IF NOT EXISTS permission_usage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
);

CREATE INDEX IF NOT EXISTS idx_permission_logs_user ON permission_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permission_logs_org ON permission_usage_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permission_logs_permission ON permission_usage_logs(permission, created_at DESC);

-- Step 11: Update user_role_history to track new role system
ALTER TABLE user_role_history ADD COLUMN old_role_level INTEGER;
ALTER TABLE user_role_history ADD COLUMN new_role_level INTEGER;
ALTER TABLE user_role_history ADD COLUMN org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_user_role_history_org ON user_role_history(org_id, changed_at DESC);
