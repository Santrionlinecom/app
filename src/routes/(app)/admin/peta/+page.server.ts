import type { PageServerLoad } from './$types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { getLembagaMapData, getLembagaTanpaKoordinat } from '$lib/server/lembaga-map';

export const load: PageServerLoad = async ({ locals }) => {
	const { db } = requireSuperAdmin(locals);
	const [mapData, lembagaTanpaKoordinat] = await Promise.all([
		getLembagaMapData(db),
		getLembagaTanpaKoordinat(db)
	]);

	return {
		...mapData,
		lembagaTanpaKoordinat
	};
};
