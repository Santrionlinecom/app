import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	ensureBukuLibrarySchema,
	getPublishedBukuBookBySlug,
	isValidBukuSlug,
	listPublishedBukuChapters
} from '$lib/server/buku-library';

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

	return {
		book,
		chapters
	};
};
