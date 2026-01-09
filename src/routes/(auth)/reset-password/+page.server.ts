import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email');

		if (typeof email !== 'string' || !email.trim()) {
			return fail(400, { message: 'Email wajib diisi.' });
		}

		// Placeholder: kirim email reset password di sini
		return {
			success: true,
			message: 'Jika email terdaftar, tautan reset telah dikirim ke inbox Anda.'
		};
	}
};
