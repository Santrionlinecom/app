import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/santri');
	const data = res.ok ? await res.json() : { santri: [] };

	return {
		santri: Array.isArray(data.santri) ? data.santri : []
	};
};
