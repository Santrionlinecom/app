import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ensureBukuLibrarySchema, listPublishedBukuBooks } from '$lib/server/buku-library';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database tidak tersedia');
	}

	await ensureBukuLibrarySchema(db);

	const books = await listPublishedBukuBooks(db);

	return {
		books,
		stats: {
			totalBooks: books.length,
			totalPublishedChapters: books.reduce((total, book) => total + book.publishedChapterCount, 0)
		}
	};
};
