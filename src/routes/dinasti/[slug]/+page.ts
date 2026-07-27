import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getDynastyBySlug, islamicDynasties } from '$lib/data/dinasti';

export const load: PageLoad = ({ params }) => {
	const dynasty = getDynastyBySlug(params.slug);
	if (!dynasty) throw error(404, 'Dinasti tidak ditemukan');
	const ordered = [...islamicDynasties].sort((a, b) => a.startYearCE - b.startYearCE);
	const idx = ordered.findIndex((d) => d.slug === dynasty.slug);
	return {
		dynasty,
		prev: idx > 0 ? ordered[idx - 1] : null,
		next: idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null
	};
};
