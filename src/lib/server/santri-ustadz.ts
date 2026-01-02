import type { D1Database } from '@cloudflare/workers-types';

export type SantriUstadzAssignment = {
	santriId: string;
	ustadzId: string;
	orgId: string;
	assignedAt: number;
};

export type OrgTeacher = {
	id: string;
	username: string | null;
	email: string | null;
	role: string;
	gender: string | null;
};

export const ensureSantriUstadzSchema = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS santri_ustadz (
				santri_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
				ustadz_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
				assigned_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
			)`
		)
		.run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_santri_ustadz_ustadz ON santri_ustadz(ustadz_id)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_santri_ustadz_org ON santri_ustadz(org_id)').run();
};

export const listOrgTeachers = async (db: D1Database, orgId: string): Promise<OrgTeacher[]> => {
	const { results } = await db
		.prepare(
			`SELECT id, username, email, role, gender
			 FROM users
			 WHERE org_id = ?
			   AND (org_status IS NULL OR org_status = 'active')
			   AND role IN ('ustadz', 'ustadzah', 'admin')
			 ORDER BY role, COALESCE(username, email)`
		)
		.bind(orgId)
		.all<OrgTeacher>();

	return (results ?? []) as OrgTeacher[];
};

export const getSantriTeacherId = async (db: D1Database, santriId: string) => {
	const row = await db
		.prepare('SELECT ustadz_id as ustadzId FROM santri_ustadz WHERE santri_id = ?')
		.bind(santriId)
		.first<{ ustadzId: string }>();
	return row?.ustadzId ?? null;
};

export const assignSantriTeacher = async (
	db: D1Database,
	params: { santriId: string; ustadzId: string; orgId: string }
): Promise<SantriUstadzAssignment> => {
	const assignedAt = Date.now();
	await db
		.prepare(
			`INSERT INTO santri_ustadz (santri_id, ustadz_id, org_id, assigned_at)
			 VALUES (?, ?, ?, ?)
			 ON CONFLICT(santri_id)
			 DO UPDATE SET ustadz_id = excluded.ustadz_id,
			               org_id = excluded.org_id,
			               assigned_at = excluded.assigned_at`
		)
		.bind(params.santriId, params.ustadzId, params.orgId, assignedAt)
		.run();

	return {
		santriId: params.santriId,
		ustadzId: params.ustadzId,
		orgId: params.orgId,
		assignedAt
	};
};

export const isTeacherForSantri = async (
	db: D1Database,
	params: { santriId: string; ustadzId: string }
) => {
	const row = await db
		.prepare('SELECT 1 FROM santri_ustadz WHERE santri_id = ? AND ustadz_id = ? LIMIT 1')
		.bind(params.santriId, params.ustadzId)
		.first<{ '1': number }>();
	return !!row;
};

export const hasAssignedSantri = async (db: D1Database, ustadzId: string) => {
	const row = await db
		.prepare('SELECT 1 FROM santri_ustadz WHERE ustadz_id = ? LIMIT 1')
		.bind(ustadzId)
		.first<{ '1': number }>();
	return !!row;
};
