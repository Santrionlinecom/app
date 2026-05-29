import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { requireSosmedContext, displayUserName, userAvatarUrl } from '$lib/server/sosmed/context';
import { listPosts } from '$lib/server/sosmed/posts';
import { getOrganizationById } from '$lib/server/organizations';

export const load: PageServerLoad = async ({ locals }) => {
	const ctx = requireSosmedContext(locals);
	if (!ctx.ok) throw error(ctx.error.status, 'Akun harus terhubung ke lembaga untuk membuka beranda.');

	const [feed, org] = await Promise.all([
		listPosts(ctx.db, {
			lembagaId: ctx.lembagaId,
			userId: ctx.user.id,
			limit: 20
		}),
		getOrganizationById(ctx.db, ctx.lembagaId)
	]);

	return {
		posts: feed.posts,
		next_cursor: feed.next_cursor,
		org,
		currentUser: {
			id: ctx.user.id,
			name: displayUserName(ctx.user),
			avatarUrl: userAvatarUrl(ctx.user)
		}
	};
};
