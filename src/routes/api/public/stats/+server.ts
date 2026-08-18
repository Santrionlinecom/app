import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type CountRow = {
	total: number | null;
};

const cacheHeaders = {
	'Cache-Control': 'public, max-age=3600'
};

const getTotal = (result: unknown) => {
	const row = (result as { results?: CountRow[] })?.results?.[0];
	return Number(row?.total ?? 0);
};

export const GET: RequestHandler = async ({ platform }) => {
	const db = platform?.env?.DB;

	if (!db) {
		return json(
			{
				institutionCount: 0,
				studentCount: 0,
				updatedAt: new Date().toISOString(),
				unavailable: true
			},
			{ headers: cacheHeaders }
		);
	}

	try {
		const [institutions, students] = await db.batch([
			db.prepare(
				`SELECT COUNT(1) AS total
				 FROM organizations
				 WHERE LOWER(COALESCE(status, 'pending')) <> 'rejected'`
			),
			db.prepare(
				`SELECT COUNT(1) AS total
				 FROM users
				 WHERE LOWER(TRIM(COALESCE(role, ''))) IN ('santri', 'alumni', 'jamaah', 'murid')
				   AND LOWER(TRIM(COALESCE(org_status, 'active'))) = 'active'`
			)
		]);

		return json(
			{
				institutionCount: getTotal(institutions),
				studentCount: getTotal(students),
				updatedAt: new Date().toISOString()
			},
			{ headers: cacheHeaders }
		);
	} catch (err) {
		console.warn('Gagal memuat statistik publik:', err);
		return json(
			{
				institutionCount: 0,
				studentCount: 0,
				updatedAt: new Date().toISOString(),
				unavailable: true
			},
			{ headers: cacheHeaders }
		);
	}
};
