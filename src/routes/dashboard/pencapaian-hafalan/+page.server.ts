import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFlaggedHafalan } from '$lib/server/progress';
import { ensureMurojaTable } from '$lib/server/calendar';
import { ensureHafalanTable } from '$lib/server/hafalan';
import { getOrgScope } from '$lib/server/organizations';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	const role = locals.user.role as any;
	const db = locals.db!;
	const { orgId, isSystemAdmin } = getOrgScope(locals.user);

	try {
		await ensureHafalanTable(db);
		await ensureMurojaTable(db);

		// Data setoran resmi
		const flagged = await getFlaggedHafalan(db, {
			currentUserId: locals.user.id,
			role: role === 'alumni' ? 'santri' : role,
			orgId: isSystemAdmin ? null : orgId
		});

		// Data hafalan resmi (approved)
		const { results: hafalanResmi } = await db.prepare(`
			SELECT surah_number, COUNT(*) as total_ayat, 
			       SUM(CASE WHEN quality_status = 'lancar' THEN 1 ELSE 0 END) as lancar,
			       SUM(CASE WHEN quality_status = 'kurang_lancar' THEN 1 ELSE 0 END) as kurang_lancar,
			       SUM(CASE WHEN quality_status = 'belum_lancar' THEN 1 ELSE 0 END) as belum_lancar
			FROM hafalan_progress
			WHERE user_id = ? AND status = 'disetujui'
			GROUP BY surah_number
			ORDER BY surah_number
		`).bind(locals.user.id).all();

		// Data muroja'ah mandiri
		const { results: murojaStats } = await db.prepare(`
			SELECT 
				COUNT(*) as total_muroja,
				SUM(CASE WHEN quality = 'lancar' THEN 1 ELSE 0 END) as lancar,
				SUM(CASE WHEN quality = 'kurang_lancar' THEN 1 ELSE 0 END) as kurang_lancar,
				SUM(CASE WHEN quality = 'belum_lancar' THEN 1 ELSE 0 END) as belum_lancar
			FROM muroja_tracking
			WHERE user_id = ?
		`).bind(locals.user.id).all();

		// Muroja'ah per surah
		const { results: murojaPerSurah } = await db.prepare(`
			SELECT surah_number, COUNT(*) as total_muroja,
			       MAX(muroja_date) as last_muroja
			FROM muroja_tracking
			WHERE user_id = ?
			GROUP BY surah_number
			ORDER BY surah_number
		`).bind(locals.user.id).all();

		return {
			role,
			flagged,
			hafalanResmi: hafalanResmi || [],
			murojaStats: murojaStats?.[0] || { total_muroja: 0, lancar: 0, kurang_lancar: 0, belum_lancar: 0 },
			murojaPerSurah: murojaPerSurah || []
		};
	} catch (err) {
		console.error('Error loading pencapaian hafalan:', err);
		throw error(500, 'Gagal memuat data pencapaian hafalan');
	}
};
