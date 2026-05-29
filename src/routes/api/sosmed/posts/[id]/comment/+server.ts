import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { displayUserName, jsonError, requireSosmedContext, userAvatarUrl } from '$lib/server/sosmed/context';
import { createComment, listComments, validateCommentContent } from '$lib/server/sosmed/comments';
import { getPost } from '$lib/server/sosmed/posts';
import { requirePermission } from '$lib/rbac/helpers';

export const GET: RequestHandler = async ({ locals, params }) => {
	const ctx = requireSosmedContext(locals);
	if (!ctx.ok) return ctx.error;
	requirePermission(locals, 'social.comment');

	const post = await getPost(ctx.db, {
		postId: params.id,
		lembagaId: ctx.lembagaId,
		userId: ctx.user.id
	});
	if (!post) return jsonError('Post tidak ditemukan.', 404);

	const comments = await listComments(ctx.db, { postId: params.id, lembagaId: ctx.lembagaId });
	return json({ comments });
};

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const ctx = requireSosmedContext(locals);
	if (!ctx.ok) return ctx.error;
	requirePermission(locals, 'social.comment');

	let body: { content?: unknown };
	try {
		body = await request.json();
	} catch {
		return jsonError('Body JSON tidak valid.', 400);
	}

	const contentError = validateCommentContent(body.content);
	if (contentError) return jsonError(contentError, 400);

	const post = await getPost(ctx.db, {
		postId: params.id,
		lembagaId: ctx.lembagaId,
		userId: ctx.user.id
	});
	if (!post) return jsonError('Post tidak ditemukan.', 404);

	const result = await createComment(ctx.db, {
		postId: params.id,
		lembagaId: ctx.lembagaId,
		userId: ctx.user.id,
		userName: displayUserName(ctx.user),
		userAvatarUrl: userAvatarUrl(ctx.user),
		content: String(body.content).trim()
	});

	return json(result, { status: 201 });
};
