import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type Role = 'admin' | 'ustadz' | 'ustadzah' | 'santri';

const canSeeAll = (role: Role) => role === 'admin' || role === 'ustadz' || role === 'ustadzah';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (!locals.db) throw error(500, 'DB not available');

	const reqRole = locals.user.role as Role;
	const defaultUserId = locals.user.id;

	const targetUserId = url.searchParams.get('userId');
	const daysParam = url.searchParams.get('days');
	const days = daysParam ? Math.max(1, Math.min(60, Number(daysParam))) : 30;

	const userId = canSeeAll(reqRole) && targetUserId ? targetUserId : defaultUserId;

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
