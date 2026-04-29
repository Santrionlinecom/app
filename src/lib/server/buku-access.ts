import type { D1Database } from '@cloudflare/workers-types';
import { ensureBukuWalletSchema, ensureCoinWallet } from '$lib/server/buku-wallet';

export type BukuChapterAccess = 'free' | 'unlocked' | 'locked';

export type BukuUnlock = {
	id: string;
	userId: string;
	bookId: string;
	chapterId: string;
	coinSpent: number;
	createdAt: string;
};

export type UnlockBukuChapterResult =
	| { status: 'unlocked'; balanceAfter: number }
	| { status: 'already_unlocked'; balanceAfter: number }
	| { status: 'insufficient_coin'; balance: number; required: number };

export const isFreeBukuChapter = (chapterNumber: number, freeChapterLimit: number) =>
	Number(chapterNumber) > 0 && Number(chapterNumber) <= Number(freeChapterLimit);

export const getBukuChapterBaseAccess = (
	chapterNumber: number,
	freeChapterLimit: number
): BukuChapterAccess => (isFreeBukuChapter(chapterNumber, freeChapterLimit) ? 'free' : 'locked');

const isUniqueConstraintError = (err: unknown) => {
	const message = String((err as any)?.message || err || '').toLowerCase();
	return message.includes('unique') || message.includes('constraint');
};

export async function hasBukuChapterUnlock(db: D1Database, userId: string, chapterId: string) {
	const row = await db
		.prepare('SELECT id FROM buku_unlocks WHERE user_id = ? AND chapter_id = ? LIMIT 1')
		.bind(userId, chapterId)
		.first<{ id: string }>();
	return Boolean(row);
}

export async function getBukuChapterAccess(
	db: D1Database,
	params: {
		userId?: string | null;
		chapterId: string;
		chapterNumber: number;
		freeChapterLimit: number;
	}
): Promise<BukuChapterAccess> {
	const baseAccess = getBukuChapterBaseAccess(params.chapterNumber, params.freeChapterLimit);
	if (baseAccess === 'free') return 'free';
	if (!params.userId) return 'locked';
	return (await hasBukuChapterUnlock(db, params.userId, params.chapterId)) ? 'unlocked' : 'locked';
}

export async function unlockBukuChapter(
	db: D1Database,
	params: {
		userId: string;
		bookId: string;
		chapterId: string;
		coinPrice: number;
		description?: string;
	}
): Promise<UnlockBukuChapterResult> {
	const coinPrice = Math.max(0, Math.trunc(Number(params.coinPrice)));
	await ensureBukuAccessSchema(db);
	await ensureBukuWalletSchema(db);

	const wallet = await ensureCoinWallet(db, params.userId);
	if (await hasBukuChapterUnlock(db, params.userId, params.chapterId)) {
		return { status: 'already_unlocked', balanceAfter: wallet.balance };
	}
	if (wallet.balance < coinPrice) {
		return { status: 'insufficient_coin', balance: wallet.balance, required: coinPrice };
	}

	const unlockId = crypto.randomUUID();
	const transactionId = crypto.randomUUID();

	try {
		const results = await db.batch([
			db
				.prepare(
					`INSERT INTO buku_unlocks (id, user_id, book_id, chapter_id, coin_spent)
					SELECT ?, ?, ?, ?, ?
					WHERE EXISTS (
						SELECT 1 FROM coin_wallets WHERE user_id = ? AND balance >= ?
					)`
				)
				.bind(
					unlockId,
					params.userId,
					params.bookId,
					params.chapterId,
					coinPrice,
					params.userId,
					coinPrice
				),
			db
				.prepare(
					`UPDATE coin_wallets
					SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP
					WHERE user_id = ?
						AND EXISTS (SELECT 1 FROM buku_unlocks WHERE id = ?)`
				)
				.bind(coinPrice, params.userId, unlockId),
			db
				.prepare(
					`INSERT INTO coin_transactions (
						id, user_id, type, amount, balance_after, description, reference_type, reference_id
					)
					SELECT ?, ?, 'unlock_chapter', ?, balance, ?, 'buku_chapter', ?
					FROM coin_wallets
					WHERE user_id = ? AND EXISTS (SELECT 1 FROM buku_unlocks WHERE id = ?)`
				)
				.bind(
					transactionId,
					params.userId,
					-coinPrice,
					params.description ?? 'Unlock bab buku',
					params.chapterId,
					params.userId,
					unlockId
				)
		]);

		const unlockCreated = Number(results[0]?.meta?.changes ?? 0) > 0;
		const walletUpdated = Number(results[1]?.meta?.changes ?? 0) > 0;
		if (!unlockCreated || !walletUpdated) {
			const latestWallet = await ensureCoinWallet(db, params.userId);
			if (await hasBukuChapterUnlock(db, params.userId, params.chapterId)) {
				return { status: 'already_unlocked', balanceAfter: latestWallet.balance };
			}
			return { status: 'insufficient_coin', balance: latestWallet.balance, required: coinPrice };
		}

		const latestWallet = await ensureCoinWallet(db, params.userId);
		return { status: 'unlocked', balanceAfter: latestWallet.balance };
	} catch (err) {
		if (isUniqueConstraintError(err) && (await hasBukuChapterUnlock(db, params.userId, params.chapterId))) {
			const latestWallet = await ensureCoinWallet(db, params.userId);
			return { status: 'already_unlocked', balanceAfter: latestWallet.balance };
		}
		throw err;
	}
}

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
