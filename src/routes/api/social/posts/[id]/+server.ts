import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getVisibleSocialPost, requireSocialContext } from '$lib/server/social';

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const context = requireSocialContext(locals);
	if (!context.ok) return context.error;

	const post = await getVisibleSocialPost(context.db, context.user, params.id);
	if (!post) return json({ error: 'Postingan tidak ditemukan' }, { status: 404 });
	if (post.user_id !== context.user.id) {
		return json({ error: 'Tidak boleh menghapus postingan orang lain' }, { status: 403 });
	}

	await context.db
		.prepare('UPDATE social_posts SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?')
		.bind(new Date().toISOString(), new Date().toISOString(), params.id, context.user.id)
		.run();

	return json({ success: true });
};
