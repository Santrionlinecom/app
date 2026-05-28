import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getVisibleSocialPost,
	listSocialComments,
	requireSocialContext,
	validateContent
} from '$lib/server/social';

export const GET: RequestHandler = async ({ locals, params }) => {
	const context = requireSocialContext(locals);
	if (!context.ok) return context.error;

	const post = await getVisibleSocialPost(context.db, context.user, params.id);
	if (!post) return json({ error: 'Postingan tidak ditemukan' }, { status: 404 });

	return json({ comments: await listSocialComments(context.db, params.id) });
};

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const context = requireSocialContext(locals);
	if (!context.ok) return context.error;

	const post = await getVisibleSocialPost(context.db, context.user, params.id);
	if (!post) return json({ error: 'Postingan tidak ditemukan' }, { status: 404 });

	const body = await request.json().catch(() => ({}));
	const contentError = validateContent((body as { content?: unknown }).content, 500);
	if (contentError) return json({ error: contentError }, { status: 400 });

	const id = crypto.randomUUID();
	const content = String((body as { content: string }).content).trim();
	const createdAt = new Date().toISOString();

	await context.db
		.prepare(
			`INSERT INTO social_comments (id, post_id, user_id, content, created_at)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.bind(id, params.id, context.user.id, content, createdAt)
		.run();

	return json({
		comment: {
			id,
			post_id: params.id,
			user_id: context.user.id,
			author_name: context.user.username || 'SantriOnline User',
			author_avatar: null,
			content,
			created_at: createdAt
		}
	});
};
