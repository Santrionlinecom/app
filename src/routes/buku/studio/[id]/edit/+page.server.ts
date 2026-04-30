import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	ensureBukuLibrarySchema,
	getAuthorBukuBookById,
	listAuthorBukuChapters,
	parseBukuBookForm,
	submitAuthorBukuBookForReview,
	updateAuthorBukuBook
} from '$lib/server/buku-library';

export const load: PageServerLoad = async ({ locals, platform, params, url }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database tidak tersedia');
	}

	await ensureBukuLibrarySchema(db);
	const book = await getAuthorBukuBookById(db, locals.user.id, params.id);
	if (!book) {
		throw error(404, 'Buku tidak ditemukan');
	}

	const chapters = await listAuthorBukuChapters(db, book.id);

	return {
		book,
		chapters,
		saved: url.searchParams.get('saved') === '1',
		reviewSubmitted: url.searchParams.get('saved') === 'review'
	};
};

export const actions: Actions = {
	default: async ({ request, locals, platform, params }) => {
		if (!locals.user) {
			throw redirect(302, '/auth');
		}

		const db = locals.db ?? platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database tidak tersedia.' });
		}

		await ensureBukuLibrarySchema(db);
		const book = await getAuthorBukuBookById(db, locals.user.id, params.id);
		if (!book) {
			return fail(404, { error: 'Buku tidak ditemukan.' });
		}
		if (book.status !== 'draft' && book.status !== 'rejected') {
			return fail(400, {
				error: 'Buku hanya bisa diedit saat draft atau ditolak.'
			});
		}

		const formData = await request.formData();
		const parsed = parseBukuBookForm(formData, book.status);
		if (!parsed.ok) {
			return fail(400, { error: parsed.error, values: parsed.values });
		}

		try {
			const updated = await updateAuthorBukuBook(db, locals.user.id, params.id, parsed.values);
			if (!updated) {
				return fail(404, { error: 'Buku tidak ditemukan.', values: parsed.values });
			}
		} catch (err: any) {
			const message = String(err?.message || err || '');
			if (message.includes('UNIQUE')) {
				return fail(400, { error: 'Slug buku sudah digunakan.', values: parsed.values });
			}
			return fail(500, { error: 'Gagal memperbarui buku.', values: parsed.values });
		}

		throw redirect(303, `/buku/studio/${params.id}/edit?saved=1`);
	},

	submitReview: async ({ locals, platform, params }) => {
		if (!locals.user) {
			throw redirect(302, '/auth');
		}

		const db = locals.db ?? platform?.env?.DB;
		if (!db) {
			return fail(500, { reviewError: 'Database tidak tersedia.' });
		}

		await ensureBukuLibrarySchema(db);
		const book = await getAuthorBukuBookById(db, locals.user.id, params.id);
		if (!book) {
			return fail(404, { reviewError: 'Buku tidak ditemukan.' });
		}
		if (book.status !== 'draft' && book.status !== 'rejected') {
			return fail(400, { reviewError: 'Hanya buku draft atau ditolak yang bisa diajukan review.' });
		}

		const submitted = await submitAuthorBukuBookForReview(db, locals.user.id, params.id);
		if (!submitted) {
			return fail(400, { reviewError: 'Buku gagal diajukan review.' });
		}

		throw redirect(303, `/buku/studio/${params.id}/edit?saved=review`);
	}
};
