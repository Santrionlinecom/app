import { getPublishedPosts } from '$lib/server/cms';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, url }) => {
	const page = Number(url.searchParams.get('page') ?? '1');
	const limit = Number(url.searchParams.get('limit') ?? '10');
	const result = await getPublishedPosts(platform!.env.DB, { page, limit });
	return {
		items: result.posts,
		page: result.page,
		limit: result.limit,
		totalCount: result.totalCount
	};
};
