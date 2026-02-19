-- Migration: enforce TPQ-only data on D1
PRAGMA foreign_keys = ON;

-- Clean dependent data for non-TPQ organizations
DELETE FROM org_media
WHERE organization_id IN (
	SELECT id FROM organizations WHERE lower(trim(coalesce(type, ''))) <> 'tpq'
);
DELETE FROM org_assets
WHERE organization_id IN (
	SELECT id FROM organizations WHERE lower(trim(coalesce(type, ''))) <> 'tpq'
);
DELETE FROM traffic_sources
WHERE organization_id IN (
	SELECT id FROM organizations WHERE lower(trim(coalesce(type, ''))) <> 'tpq'
);
DELETE FROM kas_masjid
WHERE organization_id IN (
	SELECT id FROM organizations WHERE lower(trim(coalesce(type, ''))) <> 'tpq'
);
DELETE FROM jadwal_tarawih
WHERE organization_id IN (
	SELECT id FROM organizations WHERE lower(trim(coalesce(type, ''))) <> 'tpq'
);
DELETE FROM jadwal_imam
WHERE organization_id IN (
	SELECT id FROM organizations WHERE lower(trim(coalesce(type, ''))) <> 'tpq'
);
DELETE FROM jadwal_khotib_jumat
WHERE organization_id IN (
	SELECT id FROM organizations WHERE lower(trim(coalesce(type, ''))) <> 'tpq'
);

DELETE FROM transaksi_zakat
WHERE program_id IN (
	SELECT id
	FROM program_amal
	WHERE organization_id IN (
		SELECT id FROM organizations WHERE lower(trim(coalesce(type, ''))) <> 'tpq'
	)
);

DELETE FROM data_qurban
WHERE program_id IN (
	SELECT id
	FROM program_amal
	WHERE organization_id IN (
		SELECT id FROM organizations WHERE lower(trim(coalesce(type, ''))) <> 'tpq'
	)
);

DELETE FROM program_amal
WHERE organization_id IN (
	SELECT id FROM organizations WHERE lower(trim(coalesce(type, ''))) <> 'tpq'
);
DELETE FROM santri_ustadz
WHERE org_id IN (
	SELECT id FROM organizations WHERE lower(trim(coalesce(type, ''))) <> 'tpq'
);

-- Detach users from removed organizations and normalize roles
UPDATE users
SET role = CASE
		WHEN role = 'SUPER_ADMIN' THEN role
		WHEN role IN ('ustadz', 'ustadzah') THEN role
		ELSE 'santri'
	END,
	org_id = NULL,
	org_status = 'active'
WHERE org_id IN (
	SELECT id FROM organizations WHERE lower(trim(coalesce(type, ''))) <> 'tpq'
);

UPDATE users
SET role = 'santri',
	org_id = NULL,
	org_status = 'active'
WHERE role IN ('jamaah', 'tamir', 'bendahara');

-- Remove organizations outside TPQ scope
DELETE FROM organizations
WHERE lower(trim(coalesce(type, ''))) <> 'tpq';

-- Enforce TPQ-only organization type
CREATE TRIGGER IF NOT EXISTS trg_tpq_only_org_insert
BEFORE INSERT ON organizations
FOR EACH ROW
WHEN lower(trim(coalesce(NEW.type, ''))) <> 'tpq'
BEGIN
	SELECT RAISE(ABORT, 'TPQ_ONLY: organization.type must be tpq');
END;

CREATE TRIGGER IF NOT EXISTS trg_tpq_only_org_update
BEFORE UPDATE OF type ON organizations
FOR EACH ROW
WHEN lower(trim(coalesce(NEW.type, ''))) <> 'tpq'
BEGIN
	SELECT RAISE(ABORT, 'TPQ_ONLY: organization.type must be tpq');
END;

-- Block legacy community roles
CREATE TRIGGER IF NOT EXISTS trg_tpq_only_user_role_insert
BEFORE INSERT ON users
FOR EACH ROW
WHEN lower(trim(coalesce(NEW.role, ''))) IN ('jamaah', 'tamir', 'bendahara')
BEGIN
	SELECT RAISE(ABORT, 'TPQ_ONLY: community roles are disabled');
END;

CREATE TRIGGER IF NOT EXISTS trg_tpq_only_user_role_update
BEFORE UPDATE OF role ON users
FOR EACH ROW
WHEN lower(trim(coalesce(NEW.role, ''))) IN ('jamaah', 'tamir', 'bendahara')
BEGIN
	SELECT RAISE(ABORT, 'TPQ_ONLY: community roles are disabled');
END;
