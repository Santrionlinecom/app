import { ensureCmsSchema, getPublishedPosts } from '$lib/server/cms';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, url }) => {
	const page = Number(url.searchParams.get('page') ?? '1');
	const limit = Number(url.searchParams.get('limit') ?? '10');
	const db = platform?.env.DB;
	if (!db) {
		return {
			items: [],
			page,
			limit,
			totalCount: 0
		};
	}

	await ensureCmsSchema(db);
	const result = await getPublishedPosts(db, { page, limit });
	return {
		items: result.posts,
		page: result.page,
		limit: result.limit,
		totalCount: result.totalCount
	};
};
