import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const surah = Number(params.surah);
	const ayah = Number(params.ayah);

	if (!Number.isInteger(surah) || surah < 1 || surah > 114 || !Number.isInteger(ayah) || ayah < 1) {
		throw redirect(302, '/kitab/quran');
	}

	throw redirect(302, `/kitab/quran?surah=${surah}&ayah=${ayah}`);
};
