import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getKategoriByOrg,
	getPencapaianBySantri,
	seedHafalanDefault
} from '$lib/server/db-hafalan';
import { SEED_HAFALAN_DEFAULT } from '$lib/server/seed-hafalan-default';
import { requireTpqAcademicContext } from '$lib/server/tpq-academic';

const STUDENT_ROLES = new Set(['santri', 'alumni']);

const loadKategori = async (db: NonNullable<App.Locals['db']>, orgId: string) => {
	let rows = await getKategoriByOrg(db, orgId);
	if (rows.length === 0) {
		await seedHafalanDefault(db, orgId, SEED_HAFALAN_DEFAULT);
		rows = await getKategoriByOrg(db, orgId);
	}
	return rows;
};

export const load: PageServerLoad = async ({ locals }) => {
	const { db, user, institutionId, role } = await requireTpqAcademicContext(locals);
	if (!STUDENT_ROLES.has(role)) {
		throw redirect(
			302,
			role === 'admin' || role === 'koordinator' || role === 'super_admin'
				? '/tpq/rapor-rekap'
				: '/tpq/hafalan-rapor'
		);
	}

	const rows = await loadKategori(db, institutionId);
	const pencapaian = await getPencapaianBySantri(db, user.id);

	return {
		rows,
		pencapaian,
		santri: {
			id: user.id,
			nama: user.username ?? user.email
		}
	};
};
