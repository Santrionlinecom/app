import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { Scrypt, Argon2id } from 'oslo/password';
import { initializeLucia, google } from '$lib/server/lucia';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, `/dashboard/${locals.user.role}`);
	}

	return {
		googleEnabled: Boolean(google)
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, locals }) => {
		const db = locals.db;

		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		if (typeof email !== 'string' || typeof password !== 'string') {
			return fail(400, { message: 'Email dan password wajib diisi.' });
		}

		const user = await db.prepare('SELECT id, password_hash, role FROM users WHERE email = ?')
			.bind(email)
			.first<{ id: string; password_hash: string; role: string }>();

		if (!user?.id || typeof user.role !== 'string' || typeof user.password_hash !== 'string') {
			return fail(400, { message: 'Email tidak ditemukan.' });
		}

		let verified = false;
		const isArgonHash = user.password_hash.startsWith('$argon2');
		if (isArgonHash) {
			verified = await new Argon2id().verify(user.password_hash, password);
			if (verified) {
				const newHash = await new Scrypt().hash(password);
				await db
					.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
					.bind(newHash, user.id)
					.run();
			}
		} else {
			verified = await new Scrypt().verify(user.password_hash, password);
		}

		if (!verified) {
			return fail(400, { message: 'Password salah.' });
		}

		const lucia = initializeLucia(db);
		const session = await lucia.createSession(user.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);

		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});

		throw redirect(302, '/dashboard');
	}
};
