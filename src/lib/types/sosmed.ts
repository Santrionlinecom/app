export type UserRole = 'santri' | 'wali' | 'ustadz' | 'admin';
export type ReactionEmoji = 'like' | 'love' | 'mashallah';
export type ReportReason = 'spam' | 'tidak_sopan' | 'hoaks' | 'lainnya';

export interface Post {
	id: string;
	lembaga_id: string;
	user_id: string;
	user_name: string;
	user_role: UserRole;
	user_avatar_url: string | null;
	content: string;
	media_url: string | null;
	media_type: 'image' | null;
	reaction_count: number;
	comment_count: number;
	user_reaction: ReactionEmoji | null;
	is_hidden: boolean;
	created_at: number;
}

export interface Comment {
	id: string;
	post_id: string;
	user_id: string;
	user_name: string;
	user_avatar_url: string | null;
	content: string;
	created_at: number;
}

export interface Reaction {
	post_id: string;
	emoji: ReactionEmoji;
	count: number;
}

export type SSEEvent =
	| { type: 'new_post'; data: { post: Post } }
	| { type: 'new_comment'; data: { post_id: string; comment: Comment } }
	| { type: 'new_reaction'; data: { post_id: string; reaction_count: number } }
	| { type: 'post_hidden'; data: { post_id: string } }
	| { type: 'ping'; data: Record<string, never> };
