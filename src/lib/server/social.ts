import { json } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import { isSuperAdminRole } from '$lib/server/auth/requireSuperAdmin';

export type SocialUser = NonNullable<App.Locals['user']>;

export type SocialPost = {
	id: string;
	user_id: string;
	author_name: string;
	author_avatar: string | null;
	lembaga_id: string | null;
	content: string;
	image_url: string | null;
	visibility: 'public' | 'lembaga';
	created_at: string;
	like_count: number;
	comment_count: number;
	liked_by_me: boolean;
};

export type SocialComment = {
	id: string;
	post_id: string;
	user_id: string;
	author_name: string;
	author_avatar: string | null;
	content: string;
	created_at: string;
};

type SocialPostRow = Omit<SocialPost, 'liked_by_me'> & {
	liked_by_me: number;
};

const jsonError = (message: string, status = 400) => json({ error: message }, { status });

type SocialContextResult =
	| { ok: true; user: SocialUser; db: D1Database }
	| { ok: false; error: Response };

export const requireSocialContext = (locals: App.Locals): SocialContextResult => {
	if (!locals.user?.id) {
		return { ok: false, error: jsonError('Unauthorized', 401) };
	}
	if (!locals.db) {
		return { ok: false, error: jsonError('Layanan data tidak tersedia', 500) };
	}
	return { ok: true, user: locals.user, db: locals.db };
};

export const normalizeVisibility = (value: unknown): 'public' | 'lembaga' =>
	value === 'public' ? 'public' : 'lembaga';

export const validateContent = (value: unknown, maxLength: number) => {
	if (typeof value !== 'string') return 'Konten wajib berupa teks';
	const content = value.trim();
	if (content.length < 1) return 'Konten wajib diisi';
	if (content.length > maxLength) return `Konten maksimal ${maxLength} karakter`;
	return null;
};

const socialAccessWhere = (user: SocialUser) => {
	if (isSuperAdminRole(user.role)) {
		return { clause: 'sp.deleted_at IS NULL', params: [] as string[] };
	}

	const params: string[] = [user.id];
	const visibilityClauses = ['sp.visibility = "public"', 'sp.user_id = ?'];

	if (user.orgId) {
		visibilityClauses.push('(sp.visibility = "lembaga" AND sp.lembaga_id = ?)');
		params.push(user.orgId);
	}

	return {
		clause: `sp.deleted_at IS NULL AND (${visibilityClauses.join(' OR ')})`,
		params
	};
};

export const listSocialPosts = async (
	db: D1Database,
	user: SocialUser,
	options: { limit?: number; after?: string | null } = {}
) => {
	const limit = Math.min(Math.max(Number(options.limit ?? 20) || 20, 1), 50);
	const access = socialAccessWhere(user);
	const whereParams: string[] = [...access.params];
	let afterClause = '';

	if (options.after) {
		afterClause = ' AND sp.created_at > ?';
		whereParams.push(options.after);
	}

	const params: (string | number)[] = [user.id, ...whereParams, limit];

	const { results } = await db
		.prepare(
			`SELECT
				sp.id,
				sp.user_id,
				COALESCE(NULLIF(TRIM(u.username), ''), 'SantriOnline User') as author_name,
				u.avatar_url as author_avatar,
				sp.lembaga_id,
				sp.content,
				sp.image_url,
				sp.visibility,
				sp.created_at,
				COALESCE(likes.like_count, 0) as like_count,
				COALESCE(comments.comment_count, 0) as comment_count,
				CASE WHEN my_like.user_id IS NULL THEN 0 ELSE 1 END as liked_by_me
			 FROM social_posts sp
			 LEFT JOIN users u ON u.id = sp.user_id
			 LEFT JOIN (
				SELECT post_id, COUNT(*) as like_count
				FROM social_likes
				GROUP BY post_id
			 ) likes ON likes.post_id = sp.id
			 LEFT JOIN (
				SELECT post_id, COUNT(*) as comment_count
				FROM social_comments
				WHERE deleted_at IS NULL
				GROUP BY post_id
			 ) comments ON comments.post_id = sp.id
			 LEFT JOIN social_likes my_like
				ON my_like.post_id = sp.id AND my_like.user_id = ?
			 WHERE ${access.clause}${afterClause}
			 ORDER BY sp.created_at DESC
			 LIMIT ?`
		)
		.bind(...params)
		.all<SocialPostRow>();

	return (results ?? []).map((post) => ({
		...post,
		like_count: Number(post.like_count ?? 0),
		comment_count: Number(post.comment_count ?? 0),
		liked_by_me: Boolean(post.liked_by_me)
	}));
};

export const getVisibleSocialPost = async (db: D1Database, user: SocialUser, postId: string) => {
	const access = socialAccessWhere(user);
	const post = await db
		.prepare(`SELECT sp.id, sp.user_id FROM social_posts sp WHERE sp.id = ? AND ${access.clause}`)
		.bind(postId, ...access.params)
		.first<{ id: string; user_id: string }>();

	return post ?? null;
};

export const countPostLikes = async (db: D1Database, postId: string) => {
	const row = await db
		.prepare('SELECT COUNT(*) as total FROM social_likes WHERE post_id = ?')
		.bind(postId)
		.first<{ total: number }>();
	return Number(row?.total ?? 0);
};

export const listSocialComments = async (db: D1Database, postId: string) => {
	const { results } = await db
		.prepare(
			`SELECT
				sc.id,
				sc.post_id,
				sc.user_id,
				COALESCE(NULLIF(TRIM(u.username), ''), 'SantriOnline User') as author_name,
				u.avatar_url as author_avatar,
				sc.content,
				sc.created_at
			 FROM social_comments sc
			 LEFT JOIN users u ON u.id = sc.user_id
			 WHERE sc.post_id = ? AND sc.deleted_at IS NULL
			 ORDER BY sc.created_at ASC`
		)
		.bind(postId)
		.all<SocialComment>();

	return results ?? [];
};
