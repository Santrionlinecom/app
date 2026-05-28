import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	countPostLikes,
	getVisibleSocialPost,
	requireSocialContext
} from '$lib/server/social';

export const POST: RequestHandler = async ({ locals, params }) => {
	const context = requireSocialContext(locals);
	if (!context.ok) return context.error;

	const post = await getVisibleSocialPost(context.db, context.user, params.id);
	if (!post) return json({ error: 'Postingan tidak ditemukan' }, { status: 404 });

	const existing = await context.db
		.prepare('SELECT id FROM social_likes WHERE post_id = ? AND user_id = ?')
		.bind(params.id, context.user.id)
		.first<{ id: string }>();

	let liked = false;
	if (existing) {
		await context.db
			.prepare('DELETE FROM social_likes WHERE post_id = ? AND user_id = ?')
			.bind(params.id, context.user.id)
			.run();
	} else {
		liked = true;
		await context.db
			.prepare('INSERT INTO social_likes (id, post_id, user_id, created_at) VALUES (?, ?, ?, ?)')
			.bind(crypto.randomUUID(), params.id, context.user.id, new Date().toISOString())
			.run();
	}

	return json({ liked, like_count: await countPostLikes(context.db, params.id) });
};
