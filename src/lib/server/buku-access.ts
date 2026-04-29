import type { D1Database } from '@cloudflare/workers-types';

export type BukuChapterAccess = 'free' | 'unlocked' | 'locked';

export type BukuUnlock = {
	id: string;
	userId: string;
	bookId: string;
	chapterId: string;
	coinSpent: number;
	createdAt: string;
};

export const isFreeBukuChapter = (chapterNumber: number, freeChapterLimit: number) =>
	Number(chapterNumber) > 0 && Number(chapterNumber) <= Number(freeChapterLimit);

export const getBukuChapterBaseAccess = (
	chapterNumber: number,
	freeChapterLimit: number
): BukuChapterAccess => (isFreeBukuChapter(chapterNumber, freeChapterLimit) ? 'free' : 'locked');

export async function ensureBukuAccessSchema(db: D1Database) {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS buku_unlocks (
				id TEXT PRIMARY KEY,
				user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				book_id TEXT NOT NULL REFERENCES buku_books(id) ON DELETE CASCADE,
				chapter_id TEXT NOT NULL REFERENCES buku_chapters(id) ON DELETE CASCADE,
				coin_spent INTEGER NOT NULL,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(user_id, chapter_id)
			)`
		)
		.run();

	await db.prepare('CREATE INDEX IF NOT EXISTS idx_buku_unlocks_user ON buku_unlocks(user_id)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_buku_unlocks_chapter ON buku_unlocks(chapter_id)').run();
}
