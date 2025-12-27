import type { D1Database } from '@cloudflare/workers-types';

export type OrgMediaItem = {
	id: string;
	organizationId: string;
	url: string;
	createdBy: string | null;
	createdAt: number;
};

export const ensureOrgMediaSchema = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS org_media (
				id TEXT PRIMARY KEY,
				organization_id TEXT NOT NULL,
				url TEXT NOT NULL,
				created_by TEXT,
				created_at INTEGER NOT NULL
			)`
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_org_media_org ON org_media(organization_id, created_at DESC)'
		)
		.run();
};

export const listOrgMedia = async (db: D1Database, orgId: string): Promise<OrgMediaItem[]> => {
	const { results } = await db
		.prepare(
			`SELECT id, organization_id as organizationId, url, created_by as createdBy, created_at as createdAt
			 FROM org_media
			 WHERE organization_id = ?
			 ORDER BY created_at DESC`
		)
		.bind(orgId)
		.all<OrgMediaItem>();

	return (results ?? []) as OrgMediaItem[];
};

export const addOrgMedia = async (
	db: D1Database,
	params: { orgId: string; url: string; createdBy?: string | null }
): Promise<OrgMediaItem> => {
	const id = crypto.randomUUID();
	const createdAt = Date.now();
	const createdBy = params.createdBy ?? null;
	await db
		.prepare(
			'INSERT INTO org_media (id, organization_id, url, created_by, created_at) VALUES (?, ?, ?, ?, ?)'
		)
		.bind(id, params.orgId, params.url, createdBy, createdAt)
		.run();

	return {
		id,
		organizationId: params.orgId,
		url: params.url,
		createdBy,
		createdAt
	};
};

export const deleteOrgMedia = async (
	db: D1Database,
	params: { orgId: string; id: string }
): Promise<boolean> => {
	const result = await db
		.prepare('DELETE FROM org_media WHERE id = ? AND organization_id = ?')
		.bind(params.id, params.orgId)
		.run();
	return (result?.meta?.changes ?? 0) > 0;
};
