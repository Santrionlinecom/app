import type { D1Database } from '@cloudflare/workers-types';

export type OrgAsset = {
	id: string;
	organizationId: string;
	name: string;
	category: string | null;
	quantity: number;
	condition: string | null;
	location: string | null;
	notes: string | null;
	acquiredAt: string | null;
	createdBy: string | null;
	createdAt: number;
};

const isMissingTableError = (err: unknown) =>
	`${(err as Error)?.message ?? err}`.toLowerCase().includes('no such table');

export const ensureOrgAssetsTable = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS org_assets (
				id TEXT PRIMARY KEY,
				organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
				name TEXT NOT NULL,
				category TEXT,
				quantity INTEGER NOT NULL DEFAULT 1,
				condition TEXT,
				location TEXT,
				notes TEXT,
				acquired_at TEXT,
				created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
				created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
			)`
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_org_assets_org ON org_assets(organization_id, created_at DESC)'
		)
		.run();
};

export const listOrgAssets = async (db: D1Database, orgId: string): Promise<OrgAsset[]> => {
	try {
		const { results } = await db
			.prepare(
				`SELECT id,
					organization_id as organizationId,
					name,
					category,
					quantity,
					condition,
					location,
					notes,
					acquired_at as acquiredAt,
					created_by as createdBy,
					created_at as createdAt
				 FROM org_assets
				 WHERE organization_id = ?
				 ORDER BY created_at DESC`
			)
			.bind(orgId)
			.all<OrgAsset>();

		return (results ?? []) as OrgAsset[];
	} catch (err) {
		if (isMissingTableError(err)) return [];
		throw err;
	}
};
