import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getTabiutBySlug, tabiutTabiinFigures } from '$lib/data/tabiut-tabiin';

export const load: PageLoad = ({ params }) => {
	const figure = getTabiutBySlug(params.slug);
	if (!figure) throw error(404, 'Tokoh tabi’ut tabi’in tidak ditemukan');
	return { figure, list: tabiutTabiinFigures };
};
