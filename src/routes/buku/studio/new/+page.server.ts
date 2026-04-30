import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	createBukuBook,
	ensureBukuLibrarySchema,
	parseBukuBookForm
} from '$lib/server/buku-library';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		throw error(500, 'Database tidak tersedia');
	}

	await ensureBukuLibrarySchema(db);
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, platform }) => {
		if (!locals.user) {
			throw redirect(302, '/auth');
		}

		const db = locals.db ?? platform?.env?.DB;
		if (!db) {
			return fail(500, { error: 'Database tidak tersedia.' });
		}

		await ensureBukuLibrarySchema(db);
		const formData = await request.formData();
		const parsed = parseBukuBookForm(formData, 'draft');
		if (!parsed.ok) {
			return fail(400, { error: parsed.error, values: parsed.values });
		}

		try {
			const book = await createBukuBook(db, locals.user.id, parsed.values);
			throw redirect(303, `/buku/studio/${book.id}/edit`);
		} catch (err: any) {
			if (err?.status === 303) throw err;
			return fail(500, {
				error: 'Gagal membuat buku.',
				values: parsed.values
			});
		}
	}
};
