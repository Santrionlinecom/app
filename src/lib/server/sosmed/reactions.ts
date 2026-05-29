import type { D1Database } from '@cloudflare/workers-types';
import type { ReactionEmoji } from '$lib/types/sosmed';

export const REACTION_EMOJIS: ReactionEmoji[] = ['like', 'love', 'mashallah'];

export const isReactionEmoji = (value: unknown): value is ReactionEmoji =>
	typeof value === 'string' && REACTION_EMOJIS.includes(value as ReactionEmoji);

const countReactions = async (db: D1Database, postId: string) => {
	const row = await db
		.prepare('SELECT COUNT(*) AS total FROM post_reactions WHERE post_id = ?')
		.bind(postId)
		.first<{ total: number }>();
	return Number(row?.total ?? 0);
};

export const toggleReaction = async (
	db: D1Database,
	params: { postId: string; lembagaId: string; userId: string; emoji: ReactionEmoji }
) => {
	const existing = await db
		.prepare('SELECT emoji FROM post_reactions WHERE post_id = ? AND user_id = ? AND lembaga_id = ?')
		.bind(params.postId, params.userId, params.lembagaId)
		.first<{ emoji: ReactionEmoji }>();

	let reacted = true;
	let emoji: ReactionEmoji | null = params.emoji;

	if (existing?.emoji === params.emoji) {
		await db
			.prepare('DELETE FROM post_reactions WHERE post_id = ? AND user_id = ? AND lembaga_id = ?')
			.bind(params.postId, params.userId, params.lembagaId)
			.run();
		reacted = false;
		emoji = null;
	} else if (existing) {
		await db
			.prepare('UPDATE post_reactions SET emoji = ?, created_at = unixepoch() WHERE post_id = ? AND user_id = ? AND lembaga_id = ?')
			.bind(params.emoji, params.postId, params.userId, params.lembagaId)
			.run();
	} else {
		await db
			.prepare('INSERT INTO post_reactions (id, post_id, user_id, lembaga_id, emoji) VALUES (?, ?, ?, ?, ?)')
			.bind(crypto.randomUUID(), params.postId, params.userId, params.lembagaId, params.emoji)
			.run();
	}

	const reactionCount = await countReactions(db, params.postId);
	await db
		.prepare('UPDATE posts SET reaction_count = ? WHERE id = ? AND lembaga_id = ?')
		.bind(reactionCount, params.postId, params.lembagaId)
		.run();

	return { reacted, emoji, reaction_count: reactionCount };
};
