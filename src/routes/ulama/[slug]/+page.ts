import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { ulama } from '$lib/data/ulama';

export const load: PageLoad = ({ params }) => {
	const scholar = ulama.find((u) => u.slug === params.slug);

	if (!scholar) {
		throw error(404, 'Ulama tidak ditemukan');
	}

	return { scholar };
};
