import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireD1 } from '$lib/server/cloudflare';
import { ensureBukuAccessSchema, unlockBukuChapter } from '$lib/server/buku-access';
import { ensureBukuLibrarySchema } from '$lib/server/buku-library';
import { ensureBukuWalletSchema, getCoinBalance } from '$lib/server/buku-wallet';
import {
	ensureDrmSchema,
	getDrmAccess,
	getDrmChapter,
	getDrmProgress,
	mirrorDrmAccess,
	normalizeChapterId
} from '$lib/server/drm';

export const GET: RequestHandler = async ({ url, platform, locals }) => {
	if (!locals.user?.id) {
		throw error(401, 'Silakan masuk untuk melanjutkan.');
	}

	const bookId = url.searchParams.get('book')?.trim();
	const chapterId = normalizeChapterId(url.searchParams.get('chapter'));
	if (!bookId) throw error(400, 'Parameter bacaan tidak valid.');

	const db = requireD1({ locals, platform });
	await ensureBukuLibrarySchema(db);
	await ensureBukuAccessSchema(db);
	await ensureDrmSchema(db);

	const access = await getDrmAccess(db, { userId: locals.user.id, bookId, chapterId });
	const progress = await getDrmProgress(db, { userId: locals.user.id, bookId, chapterId });

	return json({
		hasAccess: access.hasAccess,
		source: access.source,
		progress,
		book: access.book,
		chapter: access.chapter
	});
};

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	if (!locals.user?.id) {
		throw error(401, 'Silakan masuk untuk melanjutkan.');
	}

	const { bookId, chapterId } = await request.json();
	const normalizedBookId = String(bookId || '').trim();
	const normalizedChapterId = normalizeChapterId(chapterId);
	if (!normalizedBookId || !normalizedChapterId) {
		throw error(400, 'Parameter bacaan tidak valid.');
	}

	const db = requireD1({ locals, platform });
	await ensureBukuLibrarySchema(db);
	await ensureBukuAccessSchema(db);
	await ensureBukuWalletSchema(db);
	await ensureDrmSchema(db);

	const userId = locals.user.id;
	const before = await getDrmAccess(db, {
		userId,
		bookId: normalizedBookId,
		chapterId: normalizedChapterId
	});

	if (before.hasAccess) {
		return json({
			success: true,
			message: 'Akses sudah tersedia.',
			balance: await getCoinBalance(db, userId)
		});
	}

	const book = before.book ?? (await getDrmAccess(db, { userId, bookId: normalizedBookId })).book;
	const chapter = before.chapter ?? (await getDrmChapter(db, normalizedBookId, normalizedChapterId));
	if (!book || !chapter) {
		throw error(404, 'Bacaan tidak ditemukan.');
	}

	const coinPrice = Math.max(0, Number(chapter.coinPrice ?? book.pricePerChapter ?? 0));
	const result = await unlockBukuChapter(db, {
		userId,
		bookId: normalizedBookId,
		chapterId: normalizedChapterId,
		coinPrice,
		description: `Buka akses ${book.title} - ${chapter.title}`
	});

	if (result.status === 'insufficient_coin') {
		throw error(400, `Saldo koin tidak cukup. Dibutuhkan ${result.required} koin.`);
	}

	await mirrorDrmAccess(db, {
		userId,
		bookId: normalizedBookId,
		chapterId: normalizedChapterId,
		accessType: 'coin',
		coinSpent: coinPrice
	});

	return json({
		success: true,
		message: result.status === 'already_unlocked' ? 'Akses sudah tersedia.' : 'Akses berhasil dibuka.',
		balance: result.balanceAfter
	});
};
