import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { nabiList } from '$lib/data/nabi';

export const load: PageLoad = ({ params }) => {
	const record = nabiList.find((n) => n.slug === params.slug);
	if (!record) throw error(404, 'Nabi tidak ditemukan');
	return { nabi: record, list: nabiList };
};
