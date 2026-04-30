import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ensureBukuLibrarySchema, listAuthorBukuBooks } from '$lib/server/buku-library';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database tidak tersedia');
	}

	await ensureBukuLibrarySchema(db);
	const books = await listAuthorBukuBooks(db, locals.user.id);

	return {
		books,
		stats: {
			totalBooks: books.length,
			draftBooks: books.filter((book) => book.status === 'draft').length,
			publishedBooks: books.filter((book) => book.status === 'published').length,
			totalChapters: books.reduce((total, book) => total + book.totalChapterCount, 0)
		}
	};
};
