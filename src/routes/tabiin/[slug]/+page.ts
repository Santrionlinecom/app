import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getTabiinBySlug, tabiinFigures } from '$lib/data/tabiin';

export const load: PageLoad = ({ params }) => {
	const figure = getTabiinBySlug(params.slug);
	if (!figure) throw error(404, 'Tokoh tabi’in tidak ditemukan');
	return { figure, list: tabiinFigures };
};
