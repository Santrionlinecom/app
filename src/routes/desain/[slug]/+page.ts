import { error } from '@sveltejs/kit';
import { getDesignTemplate } from '$lib/data/desain';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const template = getDesignTemplate(params.slug);
	if (!template) throw error(404, 'Template desain tidak ditemukan');
	return { template };
};
