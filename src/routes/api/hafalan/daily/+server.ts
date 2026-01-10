import { json, error } from '@sveltejs/kit';
import { assertFeature, assertLoggedIn, assertOrgMember, isSystemAdmin, type OrgRole } from '$lib/server/auth/rbac';
import { getOrganizationById } from '$lib/server/organizations';
import type { RequestHandler } from './$types';

type Role = Extract<OrgRole, 'admin' | 'ustadz' | 'ustadzah' | 'santri'>;

const canSeeAll = (role: Role) => role === 'admin' || role === 'ustadz' || role === 'ustadzah';

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) throw error(500, 'DB not available');

	const orgId = assertOrgMember(user);
	const org = await getOrganizationById(locals.db, orgId);
	if (!org) throw error(404, 'Lembaga tidak ditemukan');
	assertFeature(org.type, user.role, 'hafalan');

	const reqRole = user.role as Role;
	const defaultUserId = user.id;

	const targetUserId = url.searchParams.get('userId');
	const daysParam = url.searchParams.get('days');
	const days = daysParam ? Math.max(1, Math.min(60, Number(daysParam))) : 30;

	const userId = canSeeAll(reqRole) && targetUserId ? targetUserId : defaultUserId;
	if (targetUserId && !isSystemAdmin(user.role)) {
		const target = await locals.db!
			.prepare('SELECT org_id as orgId FROM users WHERE id = ?')
			.bind(targetUserId)
			.first<{ orgId: string | null }>();
		if (target?.orgId && target.orgId !== orgId) {
			throw error(403, 'Tidak boleh mengakses data lembaga lain');
		}
	}

	// Ambil agregat per tanggal approve
	const { results } =
		(await locals.db!
			.prepare(
				`SELECT DATE(tanggal_approve) as tanggal,
				        COUNT(*) as totalAyat,
				        SUM(CASE WHEN quality_status = 'hijau' THEN 1 ELSE 0 END) as hijau,
				        SUM(CASE WHEN quality_status = 'kuning' THEN 1 ELSE 0 END) as kuning,
				        SUM(CASE WHEN quality_status = 'merah' THEN 1 ELSE 0 END) as merah
				   FROM hafalan_progress
				  WHERE user_id = ?
				    AND status = 'disetujui'
				    AND tanggal_approve IS NOT NULL
				    AND DATE(tanggal_approve) >= DATE('now','localtime', ?)
				  GROUP BY DATE(tanggal_approve)`
			)
			.bind(userId, `-${days} days`)
			.all<{
				tanggal: string;
				totalAyat: number | null;
				hijau: number | null;
				kuning: number | null;
				merah: number | null;
			}>()) ?? { results: [] };

	const rows = (results ?? []) as {
		tanggal: string;
		totalAyat: number | null;
		hijau: number | null;
		kuning: number | null;
		merah: number | null;
	}[];

	return json({
		userId,
		points: rows.map((row) => ({
			date: row.tanggal,
			total: Number(row.totalAyat) || 0,
			hijau: Number(row.hijau) || 0,
			kuning: Number(row.kuning) || 0,
			merah: Number(row.merah) || 0
		}))
	});
};
