import type { D1Database } from '@cloudflare/workers-types';
import type { Comment } from '$lib/types/sosmed';

export const validateCommentContent = (value: unknown) => {
	if (typeof value !== 'string') return 'Komentar wajib berupa teks.';
	const content = value.trim();
	if (!content) return 'Komentar wajib diisi.';
	if (content.length > 200) return 'Komentar maksimal 200 karakter.';
	return null;
};

export const listComments = async (db: D1Database, params: { postId: string; lembagaId: string }) => {
	const { results } = await db
		.prepare(
			`SELECT id, post_id, user_id, user_name, user_avatar_url, content, created_at
			 FROM post_comments
			 WHERE post_id = ? AND lembaga_id = ?
			 ORDER BY created_at ASC`
		)
		.bind(params.postId, params.lembagaId)
		.all<Comment>();

	return (results ?? []).map((comment) => ({
		...comment,
		created_at: Number(comment.created_at ?? 0)
	}));
};

export const createComment = async (
	db: D1Database,
	params: {
		postId: string;
		lembagaId: string;
		userId: string;
		userName: string;
		userAvatarUrl: string | null;
		content: string;
	}
) => {
	const id = crypto.randomUUID();
	const createdAt = Math.floor(Date.now() / 1000);

	await db
		.prepare(
			`INSERT INTO post_comments (id, post_id, lembaga_id, user_id, user_name, user_avatar_url, content, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(id, params.postId, params.lembagaId, params.userId, params.userName, params.userAvatarUrl, params.content.trim(), createdAt)
		.run();

	const row = await db
		.prepare('SELECT COUNT(*) AS total FROM post_comments WHERE post_id = ? AND lembaga_id = ?')
		.bind(params.postId, params.lembagaId)
		.first<{ total: number }>();
	const commentCount = Number(row?.total ?? 0);
	await db
		.prepare('UPDATE posts SET comment_count = ? WHERE id = ? AND lembaga_id = ?')
		.bind(commentCount, params.postId, params.lembagaId)
		.run();

	return {
		comment: {
			id,
			post_id: params.postId,
			user_id: params.userId,
			user_name: params.userName,
			user_avatar_url: params.userAvatarUrl,
			content: params.content.trim(),
			created_at: createdAt
		} satisfies Comment,
		comment_count: commentCount
	};
};
