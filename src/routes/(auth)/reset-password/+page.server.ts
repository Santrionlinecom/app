// src/routes/(auth)/reset-password/+page.server.ts
// Permintaan tautan reset password.
//
// Dua hal yang membuat halaman ini aman:
//
// 1. Turnstile. Endpoint reset adalah sasaran empuk untuk membanjiri inbox
//    orang lain — cukup kirim email korban berulang kali. Verifikasi bot
//    menutup jalur itu.
//
// 2. Jawaban netral. Email terdaftar maupun tidak dijawab persis sama, dan
//    KEDUANYA berhasil (bukan fail). Kalau berbeda — beda pesan, beda status,
//    bahkan beda waktu tanggap — halaman ini berubah jadi alat memetakan
//    siapa saja yang punya akun di SantriOnline.

import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getRequestIp } from '$lib/server/logger';
import { TURNSTILE_FAILURE_MESSAGE, verifyTurnstileFormData } from '$lib/server/turnstile';
import { mintaResetPassword, PESAN_NETRAL } from '$lib/server/auth/reset-password';
import { kirimEmailResetPassword } from '$lib/server/notifications/reset-password-email';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, platform }) => {
		const formData = await request.formData();
		const ip = getRequestIp(request) ?? undefined;

		const turnstile = await verifyTurnstileFormData(formData, ip);
		if (!turnstile.success) {
			return fail(400, { message: TURNSTILE_FAILURE_MESSAGE });
		}

		const email = formData.get('email');
		if (typeof email !== 'string' || !email.trim()) {
			return fail(400, { message: 'Email wajib diisi.' });
		}

		const db = locals.db ?? platform?.env?.DB;
		if (!db) {
			return fail(500, { message: 'Layanan data sedang tidak tersedia.' });
		}

		const hasil = await mintaResetPassword(db, { email, ip });

		// Pengiriman email hanya terjadi bila akunnya memang ada, tetapi
		// pengguna tidak bisa membedakannya dari jawaban yang diterima.
		if (hasil.kirim && hasil.token && hasil.email) {
			await kirimEmailResetPassword({
				fetchFn: fetch,
				env: platform?.env ?? {},
				email: hasil.email,
				nama: hasil.nama,
				token: hasil.token
			});
		}

		return { success: true, message: PESAN_NETRAL };
	}
};
