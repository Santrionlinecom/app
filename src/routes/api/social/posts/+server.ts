import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	listSocialPosts,
	normalizeVisibility,
	requireSocialContext,
	validateContent
} from '$lib/server/social';

export const GET: RequestHandler = async ({ locals, url }) => {
	const context = requireSocialContext(locals);
	if (!context.ok) return context.error;

	const posts = await listSocialPosts(context.db, context.user, {
		limit: Number(url.searchParams.get('limit') ?? 20)
	});

	return json({ posts });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const context = requireSocialContext(locals);
	if (!context.ok) return context.error;

	const body = await request.json().catch(() => ({}));
	const contentError = validateContent((body as { content?: unknown }).content, 1000);
	if (contentError) return json({ error: contentError }, { status: 400 });

	const content = String((body as { content: string }).content).trim();
	const visibility = normalizeVisibility((body as { visibility?: unknown }).visibility);
	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	await context.db
		.prepare(
			`INSERT INTO social_posts
				(id, user_id, lembaga_id, content, visibility, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(id, context.user.id, context.user.orgId ?? null, content, visibility, now, now)
		.run();

	const [post] = await listSocialPosts(context.db, context.user, { limit: 1, after: null });

	return json({ post: post?.id === id ? post : {
		id,
		user_id: context.user.id,
		author_name: context.user.username || 'SantriOnline User',
		author_avatar: context.user.avatarUrl ?? null,
		lembaga_id: context.user.orgId ?? null,
		content,
		image_url: null,
		visibility,
		created_at: now,
		like_count: 0,
		comment_count: 0,
		liked_by_me: false
	} });
};
