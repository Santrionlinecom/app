import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getKategoriByOrg,
	getRekap,
	seedHafalanDefault
} from '$lib/server/db-hafalan';
import { SEED_HAFALAN_DEFAULT } from '$lib/server/seed-hafalan-default';
import { requireTpqAcademicContext } from '$lib/server/tpq-academic';

const REKAP_ROLES = new Set(['admin', 'koordinator', 'super_admin']);

export const load: PageServerLoad = async ({ locals }) => {
	const { db, institutionId, role } = await requireTpqAcademicContext(locals);
	if (!REKAP_ROLES.has(role)) {
		throw error(403, 'Akses rekap rapor hanya untuk Admin dan Koordinator.');
	}

	let kategoriRows = await getKategoriByOrg(db, institutionId);
	if (kategoriRows.length === 0) {
		await seedHafalanDefault(db, institutionId, SEED_HAFALAN_DEFAULT);
		kategoriRows = await getKategoriByOrg(db, institutionId);
	}

	const rekap = await getRekap(db, institutionId);
	const totalKategori = new Set(kategoriRows.map((row) => row.kategoriId)).size;
	const totalItem = kategoriRows.filter((row) => row.itemId).length;

	return {
		rekap,
		totalKategori,
		totalItem
	};
};
