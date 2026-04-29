import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getBukuChapterBaseAccess } from '$lib/server/buku-access';
import {
	ensureBukuLibrarySchema,
	getAdjacentPublishedBukuChapters,
	getPublishedBukuBookBySlug,
	getPublishedBukuChapterByNumber,
	isValidBukuSlug,
	parseBukuChapterParam
} from '$lib/server/buku-library';

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

	const book = await getPublishedBukuBookBySlug(db, params.slug);
	if (!book) {
		throw error(404, 'Buku tidak ditemukan');
	}

	const chapter = await getPublishedBukuChapterByNumber(db, book.id, chapterNumber);
	if (!chapter) {
		throw error(404, 'Bab tidak ditemukan');
	}

	const access = getBukuChapterBaseAccess(chapter.chapterNumber, book.freeChapterLimit);
	const navigation = await getAdjacentPublishedBukuChapters(db, book.id, chapter.chapterNumber);

	return {
		book,
		chapter: {
			...chapter,
			content: access === 'free' ? chapter.content : ''
		},
		access,
		...navigation
	};
};
