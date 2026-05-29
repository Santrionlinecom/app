import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSosmedContext, displayUserName, jsonError, normalizeSosmedRole, userAvatarUrl } from '$lib/server/sosmed/context';
import { assertMediaUrlAllowed, createPost, listPosts, validatePostContent } from '$lib/server/sosmed/posts';
import { getPublicMediaBaseUrl } from '$lib/server/sosmed/upload';
import { requirePermission } from '$lib/rbac/helpers';

export const GET: RequestHandler = async ({ locals, url }) => {
	const ctx = requireSosmedContext(locals);
	if (!ctx.ok) return ctx.error;
	requirePermission(locals, 'social.post');

	const result = await listPosts(ctx.db, {
		lembagaId: ctx.lembagaId,
		userId: ctx.user.id,
		cursor: url.searchParams.get('cursor'),
		limit: Number(url.searchParams.get('limit') ?? 20)
	});

	return json(result);
};

export const POST: RequestHandler = async ({ locals, request, platform }) => {
	const ctx = requireSosmedContext(locals);
	if (!ctx.ok) return ctx.error;
	requirePermission(locals, 'social.post');

	let body: { content?: unknown; media_url?: unknown };
	try {
		body = await request.json();
	} catch {
		return jsonError('Body JSON tidak valid.', 400);
	}

	const contentError = validatePostContent(body.content);
	if (contentError) return jsonError(contentError, 400);

	const mediaUrl = typeof body.media_url === 'string' && body.media_url.trim() ? body.media_url.trim() : null;
	const mediaError = assertMediaUrlAllowed(mediaUrl, getPublicMediaBaseUrl(platform?.env));
	if (mediaError) return jsonError(mediaError, 400);

	const post = await createPost(ctx.db, {
		lembagaId: ctx.lembagaId,
		userId: ctx.user.id,
		userName: displayUserName(ctx.user),
		userRole: normalizeSosmedRole(ctx.user.role),
		userAvatarUrl: userAvatarUrl(ctx.user),
		content: String(body.content).trim(),
		mediaUrl
	});

	return json({ post }, { status: 201 });
};
