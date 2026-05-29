import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ReportReason } from '$lib/types/sosmed';
import { jsonError, requireSosmedContext } from '$lib/server/sosmed/context';
import { getPost } from '$lib/server/sosmed/posts';
import { requirePermission } from '$lib/rbac/helpers';

const REPORT_REASONS: ReportReason[] = ['spam', 'tidak_sopan', 'hoaks', 'lainnya'];
const isReason = (value: unknown): value is ReportReason =>
	typeof value === 'string' && REPORT_REASONS.includes(value as ReportReason);

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const ctx = requireSosmedContext(locals);
	if (!ctx.ok) return ctx.error;
	requirePermission(locals, 'social.post');

	let body: { reason?: unknown };
	try {
		body = await request.json();
	} catch {
		return jsonError('Body JSON tidak valid.', 400);
	}

	if (!isReason(body.reason)) return jsonError('Alasan laporan tidak valid.', 400);

	const post = await getPost(ctx.db, {
		postId: params.id,
		lembagaId: ctx.lembagaId,
		userId: ctx.user.id,
		includeHidden: true
	});
	if (!post) return jsonError('Post tidak ditemukan.', 404);

	await ctx.db
		.prepare(
			`INSERT OR IGNORE INTO post_reports (id, post_id, reporter_user_id, lembaga_id, reason, created_at)
			 VALUES (?, ?, ?, ?, ?, unixepoch())`
		)
		.bind(crypto.randomUUID(), params.id, ctx.user.id, ctx.lembagaId, body.reason)
		.run();

	await ctx.db.prepare('UPDATE posts SET is_reported = 1 WHERE id = ? AND lembaga_id = ?').bind(params.id, ctx.lembagaId).run();

	return json({ success: true });
};
