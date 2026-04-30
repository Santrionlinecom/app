import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import {
	ensureBukuLibrarySchema,
	getAdminBukuBookById,
	listAuthorBukuChapters,
	updateAdminBukuBookStatus
} from '$lib/server/buku-library';

const readAdminNote = async (request: Request) => {
	const formData = await request.formData();
	return typeof formData.get('adminNote') === 'string' ? String(formData.get('adminNote')).trim() : '';
};

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const { db } = requireSuperAdmin(locals);
	await ensureBukuLibrarySchema(db);

	const book = await getAdminBukuBookById(db, params.id);
	if (!book) {
		throw error(404, 'Buku tidak ditemukan');
	}

	const chapters = await listAuthorBukuChapters(db, book.id);

	return {
		book,
		chapters,
		saved: url.searchParams.get('saved') ?? null
	};
};

export const actions: Actions = {
	approve: async ({ locals, params }) => {
		const { db } = requireSuperAdmin(locals);
		await ensureBukuLibrarySchema(db);

		const updated = await updateAdminBukuBookStatus(db, {
			id: params.id,
			fromStatuses: ['pending'],
			toStatus: 'published',
			adminNote: null
		});
		if (!updated) {
			return fail(400, { error: 'Hanya buku pending yang bisa di-approve.' });
		}

		throw redirect(303, `/admin/super/buku/${params.id}?saved=approved`);
	},

	reject: async ({ request, locals, params }) => {
		const { db } = requireSuperAdmin(locals);
		await ensureBukuLibrarySchema(db);
		const adminNote = await readAdminNote(request);
		if (adminNote.length < 3) {
			return fail(400, { error: 'Catatan penolakan wajib diisi minimal 3 karakter.' });
		}
		if (adminNote.length > 2000) {
			return fail(400, { error: 'Catatan penolakan maksimal 2000 karakter.' });
		}

		const updated = await updateAdminBukuBookStatus(db, {
			id: params.id,
			fromStatuses: ['pending'],
			toStatus: 'rejected',
			adminNote
		});
		if (!updated) {
			return fail(400, { error: 'Hanya buku pending yang bisa ditolak.' });
		}

		throw redirect(303, `/admin/super/buku/${params.id}?saved=rejected`);
	},

	archive: async ({ request, locals, params }) => {
		const { db } = requireSuperAdmin(locals);
		await ensureBukuLibrarySchema(db);
		const adminNote = (await readAdminNote(request)) || 'Diarsipkan oleh admin.';

		const updated = await updateAdminBukuBookStatus(db, {
			id: params.id,
			fromStatuses: ['published'],
			toStatus: 'archived',
			adminNote
		});
		if (!updated) {
			return fail(400, { error: 'Hanya buku published yang bisa diarsipkan.' });
		}

		throw redirect(303, `/admin/super/buku/${params.id}?saved=archived`);
	}
};
