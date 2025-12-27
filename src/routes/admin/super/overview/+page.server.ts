import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const memberRoles = ['santri', 'jamaah'];

const countTable = async (db: App.Locals['db'], table: string) => {
	try {
		const row = await db!.prepare(`SELECT COUNT(*) as total FROM ${table}`).first<{ total: number | null }>();
		return Number(row?.total ?? 0);
	} catch {
		return 0;
	}
};

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'SUPER_ADMIN') {
		throw error(403, 'Tidak memiliki akses');
	}
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	const db = locals.db!;

	const totalInstitutions = await countTable(db, 'organizations');
	const totalUsers = await countTable(db, 'users');
	const totalTransactions =
		(await countTable(db, 'transactions')) +
		(await countTable(db, 'transaksi_zakat')) +
		(await countTable(db, 'data_qurban')) +
		(await countTable(db, 'kas_masjid'));

	const { results: topRows } = await db
		.prepare(
			`SELECT o.id, o.name, o.type, o.slug,
				SUM(CASE WHEN u.role IN (${memberRoles.map(() => '?').join(',')}) THEN 1 ELSE 0 END) as totalMembers
			 FROM organizations o
			 LEFT JOIN users u ON u.org_id = o.id
			 GROUP BY o.id
			 ORDER BY totalMembers DESC
			 LIMIT 10`
		)
		.bind(...memberRoles)
		.all<{
			id: string;
			name: string;
			type: string;
			slug: string;
			totalMembers: number | null;
		}>();

	const { results: orgRows } = await db
		.prepare(
			`SELECT o.id, o.name, o.type, o.slug, o.status, o.created_at as createdAt,
				SUM(CASE WHEN u.role IN (${memberRoles.map(() => '?').join(',')}) THEN 1 ELSE 0 END) as totalMembers,
				SUM(CASE WHEN u.role = 'admin' THEN 1 ELSE 0 END) as adminCount
			 FROM organizations o
			 LEFT JOIN users u ON u.org_id = o.id
			 GROUP BY o.id
			 ORDER BY o.created_at DESC
			 LIMIT 50`
		)
		.bind(...memberRoles)
		.all<{
			id: string;
			name: string;
			type: string;
			slug: string;
			status: string;
			createdAt: number;
			totalMembers: number | null;
			adminCount: number | null;
		}>();

	const searchQuery = (url.searchParams.get('q') ?? '').trim();
	let searchResults: Array<{
		id: string;
		username: string | null;
		email: string;
		role: string;
		orgId: string | null;
		orgName: string | null;
		orgType: string | null;
		orgSlug: string | null;
	}> = [];
	if (searchQuery.length >= 2) {
		const likeValue = `%${searchQuery}%`;
		const { results } = await db
			.prepare(
				`SELECT u.id, u.username, u.email, u.role, u.org_id as orgId,
					o.name as orgName, o.type as orgType, o.slug as orgSlug
				 FROM users u
				 LEFT JOIN organizations o ON o.id = u.org_id
				 WHERE u.email LIKE ? OR u.username LIKE ?
				 ORDER BY u.created_at DESC
				 LIMIT 50`
			)
			.bind(likeValue, likeValue)
			.all<{
				id: string;
				username: string | null;
				email: string;
				role: string;
				orgId: string | null;
				orgName: string | null;
				orgType: string | null;
				orgSlug: string | null;
			}>();
		searchResults = results ?? [];
	}

	const { results: trafficRows } = await db
		.prepare(
			`SELECT o.id, o.name, o.type, o.slug,
				COALESCE(tc.clicks, 0) as clicks,
				COALESCE(ts.signups, 0) as signups
			 FROM organizations o
			 LEFT JOIN (
				SELECT organization_id, SUM(total_clicks) as clicks
				FROM traffic_sources
				GROUP BY organization_id
			 ) tc ON tc.organization_id = o.id
			 LEFT JOIN (
				SELECT org_id, COUNT(*) as signups
				FROM users
				WHERE role IN (${memberRoles.map(() => '?').join(',')})
				GROUP BY org_id
			 ) ts ON ts.org_id = o.id
			 ORDER BY clicks DESC
			 LIMIT 10`
		)
		.bind(...memberRoles)
		.all<{
			id: string;
			name: string;
			type: string;
			slug: string;
			clicks: number | null;
			signups: number | null;
		}>();

	return {
		stats: {
			totalInstitutions,
			totalUsers,
			totalTransactions
		},
		topInstitutions: topRows ?? [],
		institutions: orgRows ?? [],
		searchQuery,
		searchResults,
		trafficSources: trafficRows ?? []
	};
};
