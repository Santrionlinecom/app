import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	ensureBukuAccessSchema,
	getBukuChapterAccess,
	unlockBukuChapter
} from '$lib/server/buku-access';
import {
	ensureBukuLibrarySchema,
	getAdjacentPublishedBukuChapters,
	getPublishedBukuBookBySlug,
	getPublishedBukuChapterByNumber,
	isValidBukuSlug,
	parseBukuChapterParam
} from '$lib/server/buku-library';
import { ensureBukuWalletSchema, getCoinBalance } from '$lib/server/buku-wallet';

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
		throw error(500, 'Database tidak tersedia');
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

	return {
		book,
		chapter: {
			...chapter,
			content: access === 'free' || access === 'unlocked' ? chapter.content : ''
		},
		access,
		isLoggedIn: Boolean(locals.user),
		walletBalance,
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
			return fail(500, { error: 'Database tidak tersedia.' });
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

		const unlock = await unlockBukuChapter(db, {
			userId: locals.user.id,
			bookId: book.id,
			chapterId: chapter.id,
			coinPrice: book.pricePerChapter,
			description: `Unlock ${book.title} - Bab ${chapter.chapterNumber}: ${chapter.title}`
		});

		if (unlock.status === 'insufficient_coin') {
			return fail(400, {
				error: 'Coin belum cukup. Silakan topup coin terlebih dahulu.',
				balance: unlock.balance,
				required: unlock.required
			});
		}

		throw redirect(303, url.pathname);
	}
};
