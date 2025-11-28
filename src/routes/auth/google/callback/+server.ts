import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogleOAuthClient, initializeLucia } from '$lib/server/lucia';
import { generateId } from 'lucia';

type GoogleProfile = {
	sub: string;
	email: string;
	name: string;
};

export const GET: RequestHandler = async ({ url, cookies, fetch, platform }) => {
	const db = platform?.env.DB;
	if (!db) throw error(500, 'Database Error');
	
	const lucia = initializeLucia(db);
	const google = getGoogleOAuthClient(url.origin);
	if (!google) throw error(503, 'Google OAuth belum dikonfigurasi.');

	const oauthError = url.searchParams.get('error');
	if (oauthError) throw error(400, 'Google membatalkan proses login. Silakan coba lagi.');

	const code = url.searchParams.get('code');
	const codeVerifier = cookies.get('google_oauth_code_verifier');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('google_oauth_state');

	if (!code || !codeVerifier || !state || !storedState || state !== storedState) {
		// Bersihkan cookie supaya percobaan berikutnya bersih
		cookies.delete('google_oauth_code_verifier', { path: '/' });
		cookies.delete('google_oauth_state', { path: '/' });
		throw error(400, 'Gagal verifikasi Google. Silakan coba lagi.');
	}

	try {
		// 1. Ambil Data dari Google
		const tokens = await google.validateAuthorizationCode(code, codeVerifier);
		const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			headers: { Authorization: `Bearer ${tokens.accessToken}` }
		});
		const googleUser = (await profileResponse.json()) as GoogleProfile;

		// 2. Cek: Apakah akun Google ini sudah terdaftar?
		const existingAccount = await db.prepare('SELECT user_id FROM google_accounts WHERE google_id = ?')
			.bind(googleUser.sub).first<{ user_id: string }>();

		let userId = existingAccount?.user_id;

		if (!userId) {
			// 3. LOGIKA PINTAR: Cek apakah Email ini sudah ada di tabel Users (daftar manual)?
			const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?')
				.bind(googleUser.email).first<{ id: string }>();

			if (existingUser) {
				// KASUS A: User sudah pernah daftar manual. Kita sambungkan akun Google-nya ke akun lama.
				userId = existingUser.id;
			} else {
				// KASUS B: User benar-benar baru. Kita buatkan akun baru.
				userId = generateId(15);
				await db.prepare('INSERT INTO users (id, username, email, role, created_at) VALUES (?, ?, ?, ?, ?)')
					.bind(userId, googleUser.name, googleUser.email, 'santri', Date.now()).run();
			}

			// Simpan data Google Account agar besok loginnya makin cepat
			await db.prepare('INSERT INTO google_accounts (id, user_id, google_id, email) VALUES (?, ?, ?, ?)')
				.bind(generateId(15), userId, googleUser.sub, googleUser.email).run();
		}

		// 4. Buat Session Login
		const session = await lucia.createSession(userId!, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, { path: '/', ...sessionCookie.attributes });
		cookies.delete('google_oauth_code_verifier', { path: '/' });
		cookies.delete('google_oauth_state', { path: '/' });

	} catch (e) {
		console.error(e);
		throw error(500, 'Gagal Login Google');
	}

	throw redirect(302, '/dashboard');
};
