import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	ensureBukuAccessSchema,
	getBukuChapterAccess
} from '$lib/server/domains/buku/access';
import {
	ensureBukuLibrarySchema,
	getAdjacentPublishedBukuChapters,
	getPublishedBukuBookBySlug,
	getPublishedBukuChapterByNumber,
	isValidBukuSlug,
	parseBukuChapterParam
} from '$lib/server/domains/buku/library';
import {
	getBookReadingProgress,
	listUserBookmarks,
	saveReadingProgress
} from '$lib/server/domains/buku/progress';
import { ensureBukuWalletSchema, getCoinBalance } from '$lib/server/domains/buku/wallet';
import { checkCoinBalance, deductCoins } from '$lib/server/domains/buku/coin-operations';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	if (!isValidBukuSlug(params.slug)) {
		throw error(404, 'Buku tidak ditemukan');
	}

	const chapterNumber = parseBukuChapterParam(params.chapter);
	if (!chapterNumber) {
		throw error(404, 'Bab tidak ditemukan');
	}

	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		throw error(500, 'Layanan data tidak tersedia');
	}

	await ensureBukuLibrarySchema(db);
	await ensureBukuAccessSchema(db);
	await ensureBukuWalletSchema(db);

	const book = await getPublishedBukuBookBySlug(db, params.slug);
	if (!book) {
		throw error(404, 'Buku tidak ditemukan');
	}

	const chapter = await getPublishedBukuChapterByNumber(db, book.id, chapterNumber);
	if (!chapter) {
		throw error(404, 'Bab tidak ditemukan');
	}

	const access = await getBukuChapterAccess(db, {
		userId: locals.user?.id ?? null,
		chapterId: chapter.id,
		chapterNumber: chapter.chapterNumber,
		freeChapterLimit: book.freeChapterLimit
	});
	const walletBalance = locals.user && access === 'locked' ? await getCoinBalance(db, locals.user.id) : null;
	const navigation = await getAdjacentPublishedBukuChapters(db, book.id, chapter.chapterNumber);
	let readingProgress = null;
	let bookBookmark = null;
	let chapterBookmark = null;

	if (locals.user) {
		const bookmarks = await listUserBookmarks(db, locals.user.id);
		bookBookmark = bookmarks.find((bookmark) => bookmark.bookId === book.id && !bookmark.chapterId) ?? null;
		chapterBookmark =
			bookmarks.find((bookmark) => bookmark.bookId === book.id && bookmark.chapterId === chapter.id) ?? null;

		if (access === 'free' || access === 'unlocked') {
			readingProgress =
				(await saveReadingProgress(db, locals.user.id, book.id, chapter.id, chapter.chapterNumber, 0)) ??
				(await getBookReadingProgress(db, locals.user.id, book.id));
		}
	}

	return {
		book,
		chapter: {
			...chapter,
			content: access === 'free' || access === 'unlocked' ? chapter.content : ''
		},
		access,
		isLoggedIn: Boolean(locals.user),
		walletBalance,
		readingProgress,
		bookBookmark,
		chapterBookmark,
		...navigation
	};
};

export const actions: Actions = {
	unlock: async ({ params, locals, platform, url }) => {
		if (!locals.user) {
			throw redirect(302, '/auth');
		}

		if (!isValidBukuSlug(params.slug)) {
			return fail(404, { error: 'Buku tidak ditemukan.' });
		}

		const chapterNumber = parseBukuChapterParam(params.chapter);
		if (!chapterNumber) {
			return fail(404, { error: 'Bab tidak ditemukan.' });
		}

		const db = locals.db ?? platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Layanan data tidak tersedia.' });
		}

		await ensureBukuLibrarySchema(db);
		await ensureBukuAccessSchema(db);
		await ensureBukuWalletSchema(db);

		const book = await getPublishedBukuBookBySlug(db, params.slug);
		if (!book) {
			return fail(404, { error: 'Buku tidak ditemukan.' });
		}

		const chapter = await getPublishedBukuChapterByNumber(db, book.id, chapterNumber);
		if (!chapter) {
			return fail(404, { error: 'Bab tidak ditemukan.' });
		}

		const access = await getBukuChapterAccess(db, {
			userId: locals.user.id,
			chapterId: chapter.id,
			chapterNumber: chapter.chapterNumber,
			freeChapterLimit: book.freeChapterLimit
		});
		if (access === 'free' || access === 'unlocked') {
			throw redirect(303, url.pathname);
		}

		// Check coin balance
		const balanceCheck = await checkCoinBalance(db, locals.user.id, book.pricePerChapter);
		if (!balanceCheck.hasEnough) {
			return fail(400, {
				type: 'insufficient_coin',
				error: 'Saldo coin tidak cukup.',
				currentBalance: balanceCheck.currentBalance,
				requiredAmount: balanceCheck.required,
				shortfall: balanceCheck.shortfall,
				productName: `${book.title} - Bab ${chapter.chapterNumber}`
			});
		}

		// Deduct coins
		const deductResult = await deductCoins(
			db,
			locals.user.id,
			book.pricePerChapter,
			`Unlock ${book.title} - Bab ${chapter.chapterNumber}: ${chapter.title}`,
			'buku_chapter',
			chapter.id
		);

		if (!deductResult.success) {
			return fail(400, {
				type: 'deduct_failed',
				error: deductResult.error || 'Gagal memproses pembayaran coin.'
			});
		}

		// Create unlock record
		const unlockId = crypto.randomUUID();
		const now = new Date().toISOString();

		await db
			.prepare(
				`INSERT INTO buku_unlocks (
					id, user_id, book_id, chapter_id, coin_spent, created_at
				) VALUES (?, ?, ?, ?, ?, ?)`
			)
			.bind(unlockId, locals.user.id, book.id, chapter.id, book.pricePerChapter, now)
			.run();

		console.info('buku_chapter_unlock_success', {
			unlock_id: unlockId,
			user_id: locals.user.id,
			book_id: book.id,
			chapter_id: chapter.id,
			coin_spent: book.pricePerChapter,
			new_balance: deductResult.newBalance
		});

		throw redirect(303, url.pathname);
	}
};