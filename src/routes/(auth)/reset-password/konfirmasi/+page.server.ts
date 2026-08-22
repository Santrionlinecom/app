// src/routes/(auth)/reset-password/konfirmasi/+page.server.ts
// Menukar token reset dengan password baru.
//
// Token dibawa di query string. Itu praktis untuk tautan email, tetapi
// membuatnya rentan bocor lewat header Referer saat halaman memuat sumber
// dari domain lain. Karena itu halaman ini memasang Referrer-Policy: no-referrer.
//
// Token juga TIDAK diteruskan ke klien lewat `data` — halaman hanya diberi
// tahu apakah tokennya sah. Nilainya dikirim ulang lewat field tersembunyi
// dari query yang sama, sehingga tidak pernah tersimpan di state halaman.

import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { Scrypt } from '$lib/server/password';
import { getRequestIp } from '$lib/server/logger';
import { TURNSTILE_FAILURE_MESSAGE, verifyTurnstileFormData } from '$lib/server/turnstile';
import {
	pakaiTokenReset,
	hashToken,
	PESAN_TOKEN_TIDAK_SAH
} from '$lib/server/auth/reset-password';
import { kirimEmailPasswordBerubah } from '$lib/server/notifications/reset-password-email';

export const load: PageServerLoad = async ({ url, locals, platform, setHeaders }) => {
	// Cegah token bocor lewat header Referer ke pihak ketiga.
	setHeaders({
		'Referrer-Policy': 'no-referrer',
		'Cache-Control': 'no-store, max-age=0'
	});

	const token = url.searchParams.get('token')?.trim() ?? '';
	if (!token) return { tokenSah: false };

	const db = locals.db ?? platform?.env?.DB;
	if (!db) return { tokenSah: false };

	// Hanya memeriksa, tidak mengubah apa pun. Tujuannya agar pengguna yang
	// membuka tautan kedaluwarsa langsung tahu, bukan setelah mengetik
	// password baru dua kali.
	const baris = await db
		.prepare(
			`SELECT expires_at, dipakai_at FROM password_reset_tokens WHERE token_hash = ? LIMIT 1`
		)
		.bind(await hashToken(token))
		.first<{ expires_at: number; dipakai_at: number | null }>();

	const sah = Boolean(baris) && !baris!.dipakai_at && Number(baris!.expires_at) > Date.now();
	return { tokenSah: sah };
};

export const actions: Actions = {
	default: async ({ request, locals, platform }) => {
		const formData = await request.formData();
		const ip = getRequestIp(request) ?? undefined;

		const turnstile = await verifyTurnstileFormData(formData, ip);
		if (!turnstile.success) {
			return fail(400, { message: TURNSTILE_FAILURE_MESSAGE });
		}

		const token = formData.get('token');
		const password = formData.get('password');
		const konfirmasi = formData.get('konfirmasi');

		if (typeof token !== 'string' || !token.trim()) {
			return fail(400, { message: PESAN_TOKEN_TIDAK_SAH });
		}
		if (typeof password !== 'string' || typeof konfirmasi !== 'string') {
			return fail(400, { message: 'Password wajib diisi.' });
		}
		if (password !== konfirmasi) {
			return fail(400, { message: 'Konfirmasi password tidak sama.' });
		}

		const db = locals.db ?? platform?.env?.DB;
		if (!db) return fail(500, { message: 'Layanan data sedang tidak tersedia.' });

		const hasil = await pakaiTokenReset(db, {
			token,
			passwordBaru: password,
			hashPassword: (kata) => new Scrypt().hash(kata)
		});

		if (!hasil.ok) {
			return fail(400, { message: hasil.pesan });
		}

		// Beri tahu pemilik akun bahwa passwordnya berubah — supaya kalau
		// bukan dia pelakunya, dia tahu dan bisa segera bertindak.
		await kirimEmailPasswordBerubah({
			fetchFn: fetch,
			env: platform?.env ?? {},
			email: hasil.email,
			nama: hasil.nama
		});

		return {
			success: true,
			message: 'Password berhasil diganti. Silakan masuk dengan password baru Anda.'
		};
	}
};
