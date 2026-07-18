import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	ensureBukuLibrarySchema,
	getAuthorBukuBookById,
	getAuthorBukuChapterById,
	parseBukuChapterForm,
	updateBukuChapter
} from '$lib/server/domains/buku/library';
import { canManagePublishedBookChapters } from '$lib/server/domains/buku/moderation-policy';
import { getRequestIp, logActivity } from '$lib/server/logger';

export const load: PageServerLoad = async ({ locals, platform, params, url }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		throw error(500, 'Layanan data tidak tersedia');
	}

	await ensureBukuLibrarySchema(db);
	const book = await getAuthorBukuBookById(db, locals.user.id, params.id);
	if (!book) {
		throw error(404, 'Buku tidak ditemukan');
	}

	const chapter = await getAuthorBukuChapterById(db, book.id, params.chapterId);
	if (!chapter) {
		throw error(404, 'Bab tidak ditemukan');
	}

	return {
		book,
		chapter,
		saved: url.searchParams.get('saved') === '1',
		canEdit: canManagePublishedBookChapters(book.status)
	};
};

export const actions: Actions = {
	default: async ({ request, locals, platform, params }) => {
		if (!locals.user) {
			throw redirect(302, '/auth');
		}

		const db = locals.db ?? platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Layanan data tidak tersedia.' });
		}

		await ensureBukuLibrarySchema(db);
		const book = await getAuthorBukuBookById(db, locals.user.id, params.id);
		if (!book) {
			return fail(404, { error: 'Buku tidak ditemukan.' });
		}
		if (!canManagePublishedBookChapters(book.status)) {
			return fail(400, { error: 'Bab tidak bisa diedit saat buku menunggu review atau diarsipkan.' });
		}

		const chapter = await getAuthorBukuChapterById(db, book.id, params.chapterId);
		if (!chapter) {
			return fail(404, { error: 'Bab tidak ditemukan.' });
		}

		const formData = await request.formData();
		const parsed = parseBukuChapterForm(formData);
		if (!parsed.ok) {
			return fail(400, { error: parsed.error, values: parsed.values });
		}

		try {
			const updated = await updateBukuChapter(db, book.id, chapter.id, parsed.values);
			if (!updated) {
				return fail(404, { error: 'Bab tidak ditemukan.', values: parsed.values });
			}
			if (chapter.status !== parsed.values.status) {
				logActivity(db, parsed.values.status === 'published' ? 'BUKU_CHAPTER_PUBLISHED' : 'BUKU_CHAPTER_UNPUBLISHED', {
					userId: locals.user.id,
					userEmail: locals.user.email ?? null,
					ipAddress: getRequestIp(request),
					metadata: {
						bookId: book.id,
						bookTitle: book.title,
						chapterId: chapter.id,
						chapterNumber: parsed.values.chapterNumber,
						chapterTitle: parsed.values.title
					},
					waitUntil: platform?.context?.waitUntil
				});
			}
		} catch (err: any) {
			const message = String(err?.message || err || '');
			if (message.includes('UNIQUE')) {
				return fail(400, {
					error: 'Nomor bab sudah digunakan untuk buku ini.',
					values: parsed.values
				});
			}
			return fail(500, { error: 'Gagal memperbarui bab.', values: parsed.values });
		}

		throw redirect(303, `/buku/studio/${book.id}/chapters/${chapter.id}/edit?saved=1`);
	}
};
