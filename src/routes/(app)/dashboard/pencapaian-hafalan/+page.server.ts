import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFlaggedHafalan } from '$lib/server/progress';
import { getOrgScope, getOrganizationById } from '$lib/server/organizations';
import { assertFeature, assertLoggedIn, assertOrgMember } from '$lib/server/auth/rbac';

export const load: PageServerLoad = async ({ locals }) => {
	const user = assertLoggedIn({ locals });

	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	const orgId = assertOrgMember(user);
	const org = await getOrganizationById(locals.db, orgId);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}
	assertFeature(org.type, user.role, 'hafalan');

	const role = user.role as any;
	const db = locals.db!;
	const { isSystemAdmin } = getOrgScope(user);

	try {
		// Data setoran resmi
		const flagged = await getFlaggedHafalan(db, {
			currentUserId: user.id,
			role: role === 'alumni' ? 'santri' : role,
			orgId: isSystemAdmin ? null : orgId
		});

		// Data hafalan resmi (approved)
		const { results: hafalanResmi } = await db
			.prepare(
				`
			SELECT surah_number, COUNT(*) as total_ayat,
			       SUM(CASE WHEN quality_status IN ('hijau','lancar') THEN 1 ELSE 0 END) as lancar,
			       SUM(CASE WHEN quality_status IN ('kuning','kurang_lancar') THEN 1 ELSE 0 END) as kurang_lancar,
			       SUM(CASE WHEN quality_status IN ('merah','belum_lancar') THEN 1 ELSE 0 END) as belum_lancar
			FROM hafalan_progress
			WHERE user_id = ? AND status = 'disetujui'
			GROUP BY surah_number
			ORDER BY surah_number
		`
			)
			.bind(user.id)
			.all();

		// Data muroja'ah mandiri
		const { results: murojaStats } = await db.prepare(`
			SELECT 
				COUNT(*) as total_muroja,
				SUM(CASE WHEN quality = 'lancar' THEN 1 ELSE 0 END) as lancar,
				SUM(CASE WHEN quality = 'kurang_lancar' THEN 1 ELSE 0 END) as kurang_lancar,
				SUM(CASE WHEN quality = 'belum_lancar' THEN 1 ELSE 0 END) as belum_lancar
			FROM muroja_tracking
			WHERE user_id = ?
		`).bind(user.id).all();

		// Muroja'ah per surah
		const { results: murojaPerSurah } = await db.prepare(`
			SELECT surah_number, COUNT(*) as total_muroja,
			       MAX(muroja_date) as last_muroja
			FROM muroja_tracking
			WHERE user_id = ?
			GROUP BY surah_number
			ORDER BY surah_number
		`).bind(user.id).all();

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
