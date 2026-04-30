import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	ensureBukuLibrarySchema,
	getPublishedBukuBookBySlug,
	isValidBukuSlug,
	listPublishedBukuChapters
} from '$lib/server/buku-library';
import { getBookReadingProgress, listUserBookmarks } from '$lib/server/buku-progress';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	if (!isValidBukuSlug(params.slug)) {
		throw error(404, 'Buku tidak ditemukan');
	}

	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database tidak tersedia');
	}

	await ensureBukuLibrarySchema(db);

	const book = await getPublishedBukuBookBySlug(db, params.slug);
	if (!book) {
		throw error(404, 'Buku tidak ditemukan');
	}

	const chapters = await listPublishedBukuChapters(db, book.id);
	const readingProgress = locals.user ? await getBookReadingProgress(db, locals.user.id, book.id) : null;
	const bookmarks = locals.user ? await listUserBookmarks(db, locals.user.id) : [];
	const bookBookmark = bookmarks.find((bookmark) => bookmark.bookId === book.id && !bookmark.chapterId) ?? null;

	return {
		book,
		chapters,
		isLoggedIn: Boolean(locals.user),
		readingProgress,
		bookBookmark
	};
};
