import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const resolveRangeMs = (range: string) => {
	switch (range) {
		case '1h':
			return 60 * 60 * 1000;
		case '6h':
			return 6 * 60 * 60 * 1000;
		case '24h':
			return 24 * 60 * 60 * 1000;
		case '7d':
			return 7 * 24 * 60 * 60 * 1000;
		case '30d':
			return 30 * 24 * 60 * 60 * 1000;
		default:
			return 24 * 60 * 60 * 1000;
	}
};

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'SUPER_ADMIN') {
		throw error(403, 'Tidak memiliki akses');
	}
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	const db = locals.db;
	const roleFilter = (url.searchParams.get('role') || 'all').trim();
	const actionFilter = (url.searchParams.get('action') || 'all').trim();
	const rangeFilter = (url.searchParams.get('range') || '24h').trim();

	const since = Date.now() - resolveRangeMs(rangeFilter);
	const conditions: string[] = ['sl.created_at >= ?'];
	const params: Array<string | number> = [since];

	if (actionFilter && actionFilter !== 'all') {
		if (actionFilter === 'CLICK') {
			conditions.push("sl.action LIKE 'CLICK_%'");
		} else {
			conditions.push('sl.action = ?');
			params.push(actionFilter);
		}
	}

	if (roleFilter && roleFilter !== 'all') {
		if (roleFilter === 'guest') {
			conditions.push('u.id IS NULL');
		} else {
			conditions.push('u.role = ?');
			params.push(roleFilter);
		}
	}

	const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

	const { results } = await db
		.prepare(
			`SELECT sl.id,
				sl.user_id as userId,
				sl.user_email as userEmail,
				sl.action,
				sl.metadata,
				sl.ip_address as ipAddress,
				sl.created_at as createdAt,
				u.username,
				u.email,
				u.role
			 FROM system_logs sl
			 LEFT JOIN users u ON u.id = sl.user_id
			 ${whereClause}
			 ORDER BY sl.created_at DESC
			 LIMIT 20`
		)
		.bind(...params)
		.all<{
			id: string;
			userId: string | null;
			userEmail: string | null;
			action: string;
			metadata: string | null;
			ipAddress: string | null;
			createdAt: number;
			username: string | null;
			email: string | null;
			role: string | null;
		}>();

	return json({
		recentActivities: results ?? [],
		filters: {
			role: roleFilter,
			action: actionFilter,
			range: rangeFilter
		}
	});
};
