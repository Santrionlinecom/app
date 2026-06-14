import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	createBukuFolder,
	deleteBukuFolder,
	ensureBukuLibrarySchema,
	listAuthorBukuBooks,
	listAuthorBukuFolders,
	parseBukuFolderForm
} from '$lib/server/domains/buku/library';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		throw error(500, 'Layanan data tidak tersedia');
	}

	await ensureBukuLibrarySchema(db);
	const books = await listAuthorBukuBooks(db, locals.user.id);
	const folders = await listAuthorBukuFolders(db, locals.user.id);

	return {
		books,
		folders,
		stats: {
			totalBooks: books.length,
			totalFolders: folders.length,
			draftBooks: books.filter((book) => book.status === 'draft').length,
			publishedBooks: books.filter((book) => book.status === 'published').length,
			totalChapters: books.reduce((total, book) => total + book.totalChapterCount, 0)
		}
	};
};

export const actions: Actions = {
	createFolder: async ({ request, locals, platform }) => {
		if (!locals.user) {
			throw redirect(302, '/auth');
		}

		const db = locals.db ?? platform?.env?.DB;
		if (!db) {
			return fail(500, { folderError: 'Layanan data tidak tersedia.' });
		}

		await ensureBukuLibrarySchema(db);
		const formData = await request.formData();
		const parsed = parseBukuFolderForm(formData);
		if (!parsed.ok) {
			return fail(400, { folderError: parsed.error, folderValues: parsed.values });
		}

		try {
			await createBukuFolder(db, locals.user.id, parsed.values);
		} catch (err: any) {
			const message = String(err?.message || err || '');
			if (message.includes('UNIQUE')) {
				return fail(400, { folderError: 'Nama folder sudah ada.', folderValues: parsed.values });
			}
			return fail(500, { folderError: 'Gagal membuat folder.', folderValues: parsed.values });
		}

		throw redirect(303, '/buku/studio?folder=saved');
	},

	deleteFolder: async ({ request, locals, platform }) => {
		if (!locals.user) {
			throw redirect(302, '/auth');
		}

		const db = locals.db ?? platform?.env?.DB;
		if (!db) {
			return fail(500, { folderError: 'Layanan data tidak tersedia.' });
		}

		await ensureBukuLibrarySchema(db);
		const formData = await request.formData();
		const folderId = typeof formData.get('folderId') === 'string' ? String(formData.get('folderId')) : '';
		if (!folderId) {
			return fail(400, { folderError: 'Folder tidak valid.' });
		}

		const deleted = await deleteBukuFolder(db, locals.user.id, folderId);
		if (!deleted) {
			return fail(404, { folderError: 'Folder tidak ditemukan.' });
		}

		throw redirect(303, '/buku/studio?folder=deleted');
	}
};
