import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSosmedContext, jsonError } from '$lib/server/sosmed/context';
import { getPost, hidePost } from '$lib/server/sosmed/posts';
import { requireAnyPermission, requirePermission, requireSameOrg } from '$lib/rbac/helpers';

export const GET: RequestHandler = async ({ locals, params }) => {
	const ctx = requireSosmedContext(locals);
	if (!ctx.ok) return ctx.error;
	requirePermission(locals, 'social.post');

	const post = await getPost(ctx.db, {
		postId: params.id,
		lembagaId: ctx.lembagaId,
		userId: ctx.user.id
	});
	if (!post) return jsonError('Post tidak ditemukan.', 404);

	return json({ post });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const ctx = requireSosmedContext(locals);
	if (!ctx.ok) return ctx.error;
	requireAnyPermission(locals, ['social.delete.own', 'social.delete.any']);

	const post = await getPost(ctx.db, {
		postId: params.id,
		lembagaId: ctx.lembagaId,
		userId: ctx.user.id,
		includeHidden: true
	});
	if (!post) return jsonError('Post tidak ditemukan.', 404);
	requireSameOrg(locals, post.lembaga_id);

	const isOwn = post.user_id === ctx.user.id;
	const canDeleteAny = locals.can('social.delete.any');
	if (!isOwn && !canDeleteAny) {
		requirePermission(locals, 'social.delete.any');
	}

	const result = await hidePost(ctx.db, {
		postId: params.id,
		lembagaId: ctx.lembagaId,
		userId: ctx.user.id,
		isAdmin: canDeleteAny
	});

	if (!result.found) return jsonError('Post tidak ditemukan.', 404);
	if (!result.allowed) return jsonError('Anda tidak boleh menghapus post ini.', 403);

	return json({ success: true });
};
