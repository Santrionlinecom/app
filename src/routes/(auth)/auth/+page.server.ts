import { fail, redirect } from '@sveltejs/kit';
import { initializeLucia } from '$lib/server/lucia';
import { Scrypt } from '$lib/server/password'; // HANYA IMPORT SCRYPT (JANGAN ARGON2)
import { logActivity } from '$lib/server/activity-logs';
import { getRequestIp, logActivity as logSystemActivity } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

// Jika user sudah login, lempar ke dashboard
export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		const target = locals.user.role === 'SUPER_ADMIN' ? '/admin/super/overview' : '/dashboard';
		throw redirect(302, target);
	}
	return {};
};

export const actions: Actions = {
		default: async ({ request, platform, locals, cookies }) => {
			const formData = await request.formData();
			const email = formData.get('email');
			const password = formData.get('password');

		// 1. Validasi Input
		if (typeof email !== 'string' || typeof password !== 'string') {
			return fail(400, { message: 'Email dan Password wajib diisi.' });
		}

		// Ambil DB dari locals (lebih aman) atau platform
		const db = locals.db ?? platform?.env.DB;
		if (!db) return fail(500, { message: 'Database error: D1 tidak terhubung.' });

			let user: { id: string; password_hash: unknown; role: string | null } | null = null;
			try {
				// 2. Cari user di database
				user = await db
					.prepare('SELECT id, password_hash, role FROM users WHERE email = ?')
					.bind(email)
					.first<{ id: string; password_hash: unknown; role: string | null }>();

				if (!user) {
					return fail(400, { message: 'Email atau Password salah.' });
				}

			// 3. Cek Password Hash
			const passwordHash =
				typeof user.password_hash === 'string' ? user.password_hash : null;

			if (!passwordHash) {
				return fail(400, { 
					message: 'Akun ini terdaftar via Google. Silakan login menggunakan tombol Google.' 
				});
			}

			// 4. Verifikasi Password (HANYA PAKAI SCRYPT)
            // Scrypt murni JavaScript, jadi aman buat Cloudflare
			const validPassword = await new Scrypt().verify(passwordHash, password);
			
			if (!validPassword) {
				return fail(400, { message: 'Email atau Password salah.' });
			}

				// 5. Login Berhasil -> Buat Session
				const lucia = initializeLucia(db);
				const session = await lucia.createSession(user.id, {});
				const sessionCookie = lucia.createSessionCookie(session.id);
				
				cookies.set(sessionCookie.name, sessionCookie.value, {
					path: '/',
					...sessionCookie.attributes
				});

				await logActivity(db, {
					userId: user.id,
					action: 'LOGIN',
					metadata: { method: 'password' }
				});
				logSystemActivity(db, 'LOGIN', {
					userId: user.id,
					userEmail: email,
					ipAddress: getRequestIp(request),
					metadata: { method: 'password' },
					waitUntil: platform?.context?.waitUntil
				});

			} catch (e) {
				console.error(e);
				return fail(500, { message: 'Terjadi kesalahan server saat login.' });
			}

			// 6. Lempar ke Dashboard
			const role = user?.role ?? '';
			const target = role === 'SUPER_ADMIN' ? '/admin/super/overview' : '/dashboard';
			throw redirect(302, target);
		}
	};
