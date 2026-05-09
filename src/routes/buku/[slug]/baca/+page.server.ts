import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireD1 } from '$lib/server/cloudflare';
import { ensureBukuAccessSchema } from '$lib/server/buku-access';
import {
	ensureBukuLibrarySchema,
	getPublishedBukuBookBySlug,
	isValidBukuSlug,
	listPublishedBukuChapters
} from '$lib/server/buku-library';
import { ensureBukuWalletSchema, getCoinBalance } from '$lib/server/buku-wallet';
import { ensureDrmSchema, getDrmAccess, getDrmProgress } from '$lib/server/drm';

export const load: PageServerLoad = async ({ params, url, locals, platform }) => {
	if (!isValidBukuSlug(params.slug)) {
		throw error(404, 'Buku tidak ditemukan.');
	}

	const db = requireD1({ locals, platform });
	await ensureBukuLibrarySchema(db);
	await ensureBukuAccessSchema(db);
	await ensureBukuWalletSchema(db);
	await ensureDrmSchema(db);

	const book = await getPublishedBukuBookBySlug(db, params.slug);
	if (!book) {
		throw error(404, 'Buku tidak ditemukan.');
	}

	const chapters = await listPublishedBukuChapters(db, book.id);
	const selected = url.searchParams.get('chapter')?.trim() || '';
	const chapter =
		(selected
			? chapters.find((item) => String(item.chapterNumber) === selected || item.id === selected)
			: chapters[0]) ?? null;

	const user = locals.user
		? {
				id: locals.user.id,
				name: locals.user.username || locals.user.email || 'Pembaca',
				coinBalance: await getCoinBalance(db, locals.user.id)
			}
		: null;

	const access = user
		? await getDrmAccess(db, {
				userId: user.id,
				bookId: book.id,
				chapterId: chapter?.id ?? null
			})
		: { hasAccess: false, source: null };

	const progress = user
		? await getDrmProgress(db, {
				userId: user.id,
				bookId: book.id,
				chapterId: chapter?.id ?? null
			})
		: null;

	return {
		book,
		chapters,
		chapter,
		user,
		hasAccess: access.hasAccess,
		accessSource: access.source,
		progress,
		coinCost: chapter ? book.pricePerChapter : 0
	};
};
