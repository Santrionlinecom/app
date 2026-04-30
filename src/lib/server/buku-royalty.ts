import type { D1Database } from '@cloudflare/workers-types';

export const AUTHOR_SHARE_BPS = 7000;
export const PLATFORM_SHARE_BPS = 3000;
export const ROYALTY_BPS_DENOMINATOR = 10_000;
export const BUKU_ROYALTY_STATUSES = ['pending', 'paid', 'reversed'] as const;

export type BukuRoyaltyStatus = (typeof BUKU_ROYALTY_STATUSES)[number];

export type BukuAuthorRoyaltyWallet = {
	authorId: string;
	totalEarnedCoin: number;
	pendingCoin: number;
	paidCoin: number;
	createdAt: string;
	updatedAt: string;
};

export type BukuRoyaltySplit = {
	grossCoin: number;
	authorCoin: number;
	platformCoin: number;
	authorShareBps: number;
	platformShareBps: number;
};

export type BukuRoyaltyLedgerItem = {
	id: string;
	authorId: string;
	bookId: string;
	chapterId: string;
	unlockId: string;
	readerId: string;
	grossCoin: number;
	authorCoin: number;
	platformCoin: number;
	authorShareBps: number;
	platformShareBps: number;
	status: BukuRoyaltyStatus;
	createdAt: string;
	bookTitle: string | null;
	chapterTitle: string | null;
	chapterNumber: number | null;
	authorEmail?: string | null;
	authorName?: string | null;
	readerEmail?: string | null;
	readerName?: string | null;
};

export type BukuRoyaltySummary = BukuAuthorRoyaltyWallet & {
	totalGrossCoin: number;
	totalAuthorCoin: number;
	totalPlatformCoin: number;
	totalLedgerCount: number;
};

const toWallet = (row: any): BukuAuthorRoyaltyWallet => ({
	authorId: row.authorId,
	totalEarnedCoin: Number(row.totalEarnedCoin ?? 0),
	pendingCoin: Number(row.pendingCoin ?? 0),
	paidCoin: Number(row.paidCoin ?? 0),
	createdAt: row.createdAt,
	updatedAt: row.updatedAt
});

const toLedgerItem = (row: any): BukuRoyaltyLedgerItem => ({
	id: row.id,
	authorId: row.authorId,
	bookId: row.bookId,
	chapterId: row.chapterId,
	unlockId: row.unlockId,
	readerId: row.readerId,
	grossCoin: Number(row.grossCoin ?? 0),
	authorCoin: Number(row.authorCoin ?? 0),
	platformCoin: Number(row.platformCoin ?? 0),
	authorShareBps: Number(row.authorShareBps ?? AUTHOR_SHARE_BPS),
	platformShareBps: Number(row.platformShareBps ?? PLATFORM_SHARE_BPS),
	status: row.status,
	createdAt: row.createdAt,
	bookTitle: row.bookTitle ?? null,
	chapterTitle: row.chapterTitle ?? null,
	chapterNumber: row.chapterNumber == null ? null : Number(row.chapterNumber),
	authorEmail: row.authorEmail ?? null,
	authorName: row.authorName ?? null,
	readerEmail: row.readerEmail ?? null,
	readerName: row.readerName ?? null
});

export const isBukuRoyaltyStatus = (status: string): status is BukuRoyaltyStatus =>
	(BUKU_ROYALTY_STATUSES as readonly string[]).includes(status);

export function calculateRoyaltySplit(grossCoin: number): BukuRoyaltySplit {
	const gross = Math.max(0, Math.trunc(Number(grossCoin)));
	const authorCoin = Math.floor((gross * AUTHOR_SHARE_BPS) / ROYALTY_BPS_DENOMINATOR);
	const platformCoin = gross - authorCoin;

	return {
		grossCoin: gross,
		authorCoin,
		platformCoin,
		authorShareBps: AUTHOR_SHARE_BPS,
		platformShareBps: PLATFORM_SHARE_BPS
	};
}

export async function ensureBukuRoyaltySchema(db: D1Database) {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS buku_author_wallets (
				author_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
				total_earned_coin INTEGER NOT NULL DEFAULT 0,
				pending_coin INTEGER NOT NULL DEFAULT 0,
				paid_coin INTEGER NOT NULL DEFAULT 0,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)`
		)
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS buku_author_royalty_ledger (
				id TEXT PRIMARY KEY,
				author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				book_id TEXT NOT NULL REFERENCES buku_books(id) ON DELETE CASCADE,
				chapter_id TEXT NOT NULL REFERENCES buku_chapters(id) ON DELETE CASCADE,
				unlock_id TEXT NOT NULL UNIQUE REFERENCES buku_unlocks(id) ON DELETE CASCADE,
				reader_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				gross_coin INTEGER NOT NULL,
				author_coin INTEGER NOT NULL,
				platform_coin INTEGER NOT NULL,
				author_share_bps INTEGER NOT NULL DEFAULT 7000,
				platform_share_bps INTEGER NOT NULL DEFAULT 3000,
				status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'reversed')),
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			)`
		)
		.run();

	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_author ON buku_author_royalty_ledger(author_id)')
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_book ON buku_author_royalty_ledger(book_id)')
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_chapter ON buku_author_royalty_ledger(chapter_id)')
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_reader ON buku_author_royalty_ledger(reader_id)')
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_status ON buku_author_royalty_ledger(status)')
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_buku_author_royalty_created ON buku_author_royalty_ledger(created_at)')
		.run();
}

export async function ensureAuthorRoyaltyWallet(db: D1Database, authorId: string) {
	await ensureBukuRoyaltySchema(db);
	await db.prepare('INSERT OR IGNORE INTO buku_author_wallets (author_id) VALUES (?)').bind(authorId).run();

	const row = await db
		.prepare(
			`SELECT
				author_id as authorId,
				total_earned_coin as totalEarnedCoin,
				pending_coin as pendingCoin,
				paid_coin as paidCoin,
				created_at as createdAt,
				updated_at as updatedAt
			FROM buku_author_wallets
			WHERE author_id = ?
			LIMIT 1`
		)
		.bind(authorId)
		.first<any>();

	if (!row) {
		throw new Error('Gagal membuat wallet royalti penulis.');
	}

	return toWallet(row);
}

export async function recordChapterUnlockRoyalty(
	db: D1Database,
	params: {
		unlockId: string;
		readerId: string;
		bookId: string;
		chapterId: string;
		grossCoin: number;
	}
) {
	await ensureBukuRoyaltySchema(db);
	const split = calculateRoyaltySplit(params.grossCoin);
	if (split.grossCoin <= 0) {
		return { status: 'skipped' as const, reason: 'zero_gross' as const };
	}

	const book = await db
		.prepare('SELECT author_id as authorId FROM buku_books WHERE id = ? LIMIT 1')
		.bind(params.bookId)
		.first<{ authorId: string }>();
	if (!book) {
		return { status: 'skipped' as const, reason: 'book_not_found' as const };
	}
	if (book.authorId === params.readerId) {
		return { status: 'skipped' as const, reason: 'author_self_unlock' as const };
	}

	await ensureAuthorRoyaltyWallet(db, book.authorId);
	const ledgerId = crypto.randomUUID();
	const results = await db.batch([
		db
			.prepare(
				`INSERT OR IGNORE INTO buku_author_royalty_ledger (
					id,
					author_id,
					book_id,
					chapter_id,
					unlock_id,
					reader_id,
					gross_coin,
					author_coin,
					platform_coin,
					author_share_bps,
					platform_share_bps,
					status
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
			)
			.bind(
				ledgerId,
				book.authorId,
				params.bookId,
				params.chapterId,
				params.unlockId,
				params.readerId,
				split.grossCoin,
				split.authorCoin,
				split.platformCoin,
				split.authorShareBps,
				split.platformShareBps
			),
		db
			.prepare(
				`UPDATE buku_author_wallets
				SET total_earned_coin = total_earned_coin + ?,
					pending_coin = pending_coin + ?,
					updated_at = CURRENT_TIMESTAMP
				WHERE author_id = ?
					AND EXISTS (
						SELECT 1 FROM buku_author_royalty_ledger WHERE id = ?
					)`
			)
			.bind(split.authorCoin, split.authorCoin, book.authorId, ledgerId)
	]);

	const inserted = Number(results[0]?.meta?.changes ?? 0) > 0;
	return {
		status: inserted ? ('recorded' as const) : ('already_recorded' as const),
		authorId: book.authorId,
		...split
	};
}

export async function listAuthorRoyaltySummary(
	db: D1Database,
	authorId: string
): Promise<BukuRoyaltySummary> {
	const wallet = await ensureAuthorRoyaltyWallet(db, authorId);
	const totals = await db
		.prepare(
			`SELECT
				COALESCE(SUM(gross_coin), 0) as totalGrossCoin,
				COALESCE(SUM(author_coin), 0) as totalAuthorCoin,
				COALESCE(SUM(platform_coin), 0) as totalPlatformCoin,
				COUNT(1) as totalLedgerCount
			FROM buku_author_royalty_ledger
			WHERE author_id = ?`
		)
		.bind(authorId)
		.first<any>();

	return {
		...wallet,
		totalGrossCoin: Number(totals?.totalGrossCoin ?? 0),
		totalAuthorCoin: Number(totals?.totalAuthorCoin ?? 0),
		totalPlatformCoin: Number(totals?.totalPlatformCoin ?? 0),
		totalLedgerCount: Number(totals?.totalLedgerCount ?? 0)
	};
}

const LEDGER_SELECT = `
	l.id,
	l.author_id as authorId,
	l.book_id as bookId,
	l.chapter_id as chapterId,
	l.unlock_id as unlockId,
	l.reader_id as readerId,
	l.gross_coin as grossCoin,
	l.author_coin as authorCoin,
	l.platform_coin as platformCoin,
	l.author_share_bps as authorShareBps,
	l.platform_share_bps as platformShareBps,
	l.status,
	l.created_at as createdAt,
	b.title as bookTitle,
	c.title as chapterTitle,
	c.chapter_number as chapterNumber,
	author.email as authorEmail,
	author.username as authorName,
	reader.email as readerEmail,
	reader.username as readerName
`;

export async function listAuthorRoyaltyLedger(db: D1Database, authorId: string, limit = 100) {
	await ensureBukuRoyaltySchema(db);
	const { results } = await db
		.prepare(
			`SELECT ${LEDGER_SELECT}
			FROM buku_author_royalty_ledger l
			LEFT JOIN buku_books b ON b.id = l.book_id
			LEFT JOIN buku_chapters c ON c.id = l.chapter_id
			LEFT JOIN users author ON author.id = l.author_id
			LEFT JOIN users reader ON reader.id = l.reader_id
			WHERE l.author_id = ?
			ORDER BY l.created_at DESC
			LIMIT ?`
		)
		.bind(authorId, Math.min(Math.max(Math.trunc(limit), 1), 500))
		.all<any>();

	return (results ?? []).map(toLedgerItem);
}

export async function listAdminRoyaltyLedger(
	db: D1Database,
	params: { status?: BukuRoyaltyStatus | null; limit?: number } = {}
) {
	await ensureBukuRoyaltySchema(db);
	const limit = Math.min(Math.max(Math.trunc(params.limit ?? 200), 1), 500);
	const where = params.status ? 'WHERE l.status = ?' : '';
	const statement = db.prepare(
		`SELECT ${LEDGER_SELECT}
		FROM buku_author_royalty_ledger l
		LEFT JOIN buku_books b ON b.id = l.book_id
		LEFT JOIN buku_chapters c ON c.id = l.chapter_id
		LEFT JOIN users author ON author.id = l.author_id
		LEFT JOIN users reader ON reader.id = l.reader_id
		${where}
		ORDER BY l.created_at DESC
		LIMIT ?`
	);

	const { results } = params.status
		? await statement.bind(params.status, limit).all<any>()
		: await statement.bind(limit).all<any>();

	return (results ?? []).map(toLedgerItem);
}

export async function getAdminRoyaltySummary(db: D1Database, status?: BukuRoyaltyStatus | null) {
	await ensureBukuRoyaltySchema(db);
	const where = status ? 'WHERE status = ?' : '';
	const statement = db.prepare(
		`SELECT
			COALESCE(SUM(gross_coin), 0) as totalGrossCoin,
			COALESCE(SUM(author_coin), 0) as totalAuthorCoin,
			COALESCE(SUM(platform_coin), 0) as totalPlatformCoin,
			COUNT(1) as totalLedgerCount
		FROM buku_author_royalty_ledger
		${where}`
	);
	const row = status ? await statement.bind(status).first<any>() : await statement.first<any>();

	return {
		totalGrossCoin: Number(row?.totalGrossCoin ?? 0),
		totalAuthorCoin: Number(row?.totalAuthorCoin ?? 0),
		totalPlatformCoin: Number(row?.totalPlatformCoin ?? 0),
		totalLedgerCount: Number(row?.totalLedgerCount ?? 0)
	};
}
