import type { D1Database } from '@cloudflare/workers-types';
import type { Post, ReactionEmoji, UserRole } from '$lib/types/sosmed';

type PostRow = Omit<Post, 'user_reaction' | 'is_hidden' | 'media_type'> & {
	user_reaction: ReactionEmoji | null;
	is_hidden: number;
	media_type: 'image' | null;
};

const mapPost = (row: PostRow): Post => ({
	...row,
	reaction_count: Number(row.reaction_count ?? 0),
	comment_count: Number(row.comment_count ?? 0),
	is_hidden: Boolean(row.is_hidden),
	created_at: Number(row.created_at ?? 0),
	user_reaction: row.user_reaction ?? null,
	media_type: row.media_type ?? null
});

export const validatePostContent = (value: unknown) => {
	if (typeof value !== 'string') return 'Konten wajib berupa teks.';
	const content = value.trim();
	if (!content) return 'Konten wajib diisi.';
	if (content.length > 500) return 'Status maksimal 500 karakter.';
	return null;
};

export const assertMediaUrlAllowed = (mediaUrl: string | null | undefined, publicBaseUrl: string | null) => {
	if (!mediaUrl) return null;
	if (!publicBaseUrl) return 'Konfigurasi URL media belum tersedia.';
	const normalizedBase = publicBaseUrl.replace(/\/+$/, '');
	if (!mediaUrl.startsWith(`${normalizedBase}/sosmed/`)) {
		return 'URL foto tidak valid.';
	}
	return null;
};

export const listPosts = async (
	db: D1Database,
	params: { lembagaId: string; userId: string; cursor?: string | null; limit?: number }
) => {
	const limit = Math.min(Math.max(Number(params.limit ?? 20) || 20, 1), 50);
	const bindValues: (string | number)[] = [params.userId, params.lembagaId];
	let cursorClause = '';

	if (params.cursor) {
		cursorClause = ' AND p.created_at < ?';
		bindValues.push(Number(params.cursor));
	}

	bindValues.push(limit + 1);

	const { results } = await db
		.prepare(
			`SELECT
				p.id,
				p.lembaga_id,
				p.user_id,
				p.user_name,
				p.user_role,
				p.user_avatar_url,
				p.content,
				p.media_url,
				p.media_type,
				p.reaction_count,
				p.comment_count,
				my_reaction.emoji AS user_reaction,
				p.is_hidden,
				p.created_at
			 FROM posts p
			 LEFT JOIN post_reactions my_reaction
				ON my_reaction.post_id = p.id AND my_reaction.user_id = ?
			 WHERE p.lembaga_id = ? AND p.is_hidden = 0${cursorClause}
			 ORDER BY p.created_at DESC
			 LIMIT ?`
		)
		.bind(...bindValues)
		.all<PostRow>();

	const rows = results ?? [];
	const pageRows = rows.slice(0, limit);
	const nextCursor = rows.length > limit ? String(pageRows[pageRows.length - 1]?.created_at ?? '') : null;

	return {
		posts: pageRows.map(mapPost),
		next_cursor: nextCursor,
		total: pageRows.length
	};
};

export const getPost = async (
	db: D1Database,
	params: { postId: string; lembagaId: string; userId: string; includeHidden?: boolean }
) => {
	const hiddenClause = params.includeHidden ? '' : ' AND p.is_hidden = 0';
	const row = await db
		.prepare(
			`SELECT
				p.id,
				p.lembaga_id,
				p.user_id,
				p.user_name,
				p.user_role,
				p.user_avatar_url,
				p.content,
				p.media_url,
				p.media_type,
				p.reaction_count,
				p.comment_count,
				my_reaction.emoji AS user_reaction,
				p.is_hidden,
				p.created_at
			 FROM posts p
			 LEFT JOIN post_reactions my_reaction
				ON my_reaction.post_id = p.id AND my_reaction.user_id = ?
			 WHERE p.id = ? AND p.lembaga_id = ?${hiddenClause}`
		)
		.bind(params.userId, params.postId, params.lembagaId)
		.first<PostRow>();

	return row ? mapPost(row) : null;
};

export const createPost = async (
	db: D1Database,
	params: {
		lembagaId: string;
		userId: string;
		userName: string;
		userRole: UserRole;
		userAvatarUrl: string | null;
		content: string;
		mediaUrl?: string | null;
	}
) => {
	const id = crypto.randomUUID();
	const createdAt = Math.floor(Date.now() / 1000);
	const mediaUrl = params.mediaUrl?.trim() || null;

	await db
		.prepare(
			`INSERT INTO posts (
				id, lembaga_id, user_id, user_name, user_role, user_avatar_url,
				content, media_url, media_type, created_at
			 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			id,
			params.lembagaId,
			params.userId,
			params.userName,
			params.userRole,
			params.userAvatarUrl,
			params.content.trim(),
			mediaUrl,
			mediaUrl ? 'image' : null,
			createdAt
		)
		.run();

	const post = await getPost(db, { postId: id, lembagaId: params.lembagaId, userId: params.userId });
	if (!post) throw new Error('Post gagal dibuat.');
	return post;
};

export const hidePost = async (
	db: D1Database,
	params: { postId: string; lembagaId: string; userId: string; isAdmin: boolean }
) => {
	const post = await db
		.prepare('SELECT id, user_id FROM posts WHERE id = ? AND lembaga_id = ? AND is_hidden = 0')
		.bind(params.postId, params.lembagaId)
		.first<{ id: string; user_id: string }>();

	if (!post) return { found: false, allowed: false };
	if (!params.isAdmin && post.user_id !== params.userId) return { found: true, allowed: false };

	await db
		.prepare('UPDATE posts SET is_hidden = 1, hidden_at = unixepoch() WHERE id = ? AND lembaga_id = ?')
		.bind(params.postId, params.lembagaId)
		.run();
	return { found: true, allowed: true };
};

export const countPostsSince = async (db: D1Database, params: { lembagaId: string; after: number }) => {
	const row = await db
		.prepare('SELECT COUNT(*) AS total FROM posts WHERE lembaga_id = ? AND is_hidden = 0 AND created_at > ?')
		.bind(params.lembagaId, params.after)
		.first<{ total: number }>();
	return Number(row?.total ?? 0);
};
