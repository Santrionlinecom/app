import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSosmedContext, jsonError } from '$lib/server/sosmed/context';
import { getPost } from '$lib/server/sosmed/posts';
import { isReactionEmoji, toggleReaction } from '$lib/server/sosmed/reactions';
import { requirePermission } from '$lib/rbac/helpers';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const ctx = requireSosmedContext(locals);
	if (!ctx.ok) return ctx.error;
	requirePermission(locals, 'social.react');

	let body: { emoji?: unknown };
	try {
		body = await request.json();
	} catch {
		return jsonError('Body JSON tidak valid.', 400);
	}

	if (!isReactionEmoji(body.emoji)) return jsonError('Reaksi tidak valid.', 400);

	const post = await getPost(ctx.db, {
		postId: params.id,
		lembagaId: ctx.lembagaId,
		userId: ctx.user.id
	});
	if (!post) return jsonError('Post tidak ditemukan.', 404);

	const result = await toggleReaction(ctx.db, {
		postId: params.id,
		lembagaId: ctx.lembagaId,
		userId: ctx.user.id,
		emoji: body.emoji
	});

	return json(result);
};
