import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
	const page = Number(url.searchParams.get('page') ?? '1');
	const limit = Number(url.searchParams.get('limit') ?? '10');
	const res = await fetch(`/api/santri?page=${page}&limit=${limit}`);
	const data = res.ok ? await res.json() : { santri: [] };

	return {
		santri: Array.isArray(data.santri) ? data.santri : [],
		scope: data.scope ?? null,
		pagination: data.pagination ?? { page, limit, totalCount: Array.isArray(data.santri) ? data.santri.length : 0 },
		stats: data.stats ?? null
	};
};
