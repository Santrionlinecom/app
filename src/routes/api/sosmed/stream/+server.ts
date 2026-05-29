import type { RequestHandler } from './$types';
import { requireSosmedContext } from '$lib/server/sosmed/context';
import { listPosts } from '$lib/server/sosmed/posts';
import { writeSse } from '$lib/server/sosmed/sse';
import { requirePermission } from '$lib/rbac/helpers';

export const GET: RequestHandler = async ({ locals, request, url }) => {
	const ctx = requireSosmedContext(locals);
	if (!ctx.ok) return ctx.error;
	requirePermission(locals, 'social.post');

	const encoder = new TextEncoder();
	const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
	const writer = writable.getWriter();
	let closed = false;
	let lastPostTimestamp = Number(url.searchParams.get('after') ?? 0) || Math.floor(Date.now() / 1000);
	let lastActivityTimestamp = lastPostTimestamp;
	let lastHiddenTimestamp = lastPostTimestamp;
	const sentCommentIds = new Set<string>();
	const sentReactionKeys = new Set<string>();

	const safeWrite = async (event: Parameters<typeof writeSse>[2], data: unknown) => {
		if (closed) return;
		try {
			await writeSse(writer, encoder, event, data);
		} catch {
			closed = true;
		}
	};

	const interval = setInterval(() => {
		void (async () => {
			if (closed) return;
			try {
				const result = await listPosts(ctx.db, {
					lembagaId: ctx.lembagaId,
					userId: ctx.user.id,
					limit: 10
				});
				const newPosts = result.posts
					.filter((post) => post.created_at > lastPostTimestamp)
					.sort((a, b) => a.created_at - b.created_at);

				for (const post of newPosts) {
					lastPostTimestamp = Math.max(lastPostTimestamp, post.created_at);
					lastActivityTimestamp = Math.max(lastActivityTimestamp, post.created_at);
					await safeWrite('new_post', { post });
				}

				const { results: comments } = await ctx.db
					.prepare(
						`SELECT id, post_id, user_id, user_name, user_avatar_url, content, created_at
						 FROM post_comments
						 WHERE lembaga_id = ? AND created_at > ?
						 ORDER BY created_at ASC
						 LIMIT 20`
					)
					.bind(ctx.lembagaId, lastActivityTimestamp)
					.all<{
						id: string;
						post_id: string;
						user_id: string;
						user_name: string;
						user_avatar_url: string | null;
						content: string;
						created_at: number;
					}>();

				for (const comment of comments ?? []) {
					if (sentCommentIds.has(comment.id)) continue;
					sentCommentIds.add(comment.id);
					lastActivityTimestamp = Math.max(lastActivityTimestamp, Number(comment.created_at ?? 0));
					await safeWrite('new_comment', { post_id: comment.post_id, comment });
				}

				const { results: reactions } = await ctx.db
					.prepare(
						`SELECT pr.post_id, pr.user_id, pr.created_at, p.reaction_count
						 FROM post_reactions pr
						 JOIN posts p ON p.id = pr.post_id AND p.lembaga_id = pr.lembaga_id
						 WHERE pr.lembaga_id = ? AND pr.created_at > ? AND p.is_hidden = 0
						 ORDER BY pr.created_at ASC
						 LIMIT 20`
					)
					.bind(ctx.lembagaId, lastActivityTimestamp)
					.all<{ post_id: string; user_id: string; created_at: number; reaction_count: number }>();

				for (const reaction of reactions ?? []) {
					const key = `${reaction.post_id}:${reaction.user_id}:${reaction.created_at}`;
					if (sentReactionKeys.has(key)) continue;
					sentReactionKeys.add(key);
					lastActivityTimestamp = Math.max(lastActivityTimestamp, Number(reaction.created_at ?? 0));
					await safeWrite('new_reaction', {
						post_id: reaction.post_id,
						reaction_count: Number(reaction.reaction_count ?? 0)
					});
				}

				const { results: hiddenPosts } = await ctx.db
					.prepare(
						`SELECT id, hidden_at
						 FROM posts
						 WHERE lembaga_id = ? AND is_hidden = 1 AND hidden_at IS NOT NULL AND hidden_at > ?
						 ORDER BY hidden_at ASC
						 LIMIT 20`
					)
					.bind(ctx.lembagaId, lastHiddenTimestamp)
					.all<{ id: string; hidden_at: number }>();

				for (const post of hiddenPosts ?? []) {
					lastHiddenTimestamp = Math.max(lastHiddenTimestamp, Number(post.hidden_at ?? 0));
					await safeWrite('post_hidden', { post_id: post.id });
				}

				await safeWrite('ping', {});
			} catch {
				await safeWrite('ping', {});
			}
		})();
	}, 5000);

	void safeWrite('ping', {});

	const cleanup = () => {
		closed = true;
		clearInterval(interval);
		try {
			void writer.close();
		} catch {
			// Stream may already be closed by the runtime.
		}
	};

	request.signal.addEventListener('abort', cleanup, { once: true });

	return new Response(readable, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
