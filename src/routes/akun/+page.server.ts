import { fail, redirect } from '@sveltejs/kit';
import { Scrypt } from 'oslo/password';
import type { Actions, PageServerLoad } from './$types';

const ensureGenderColumn = async (db: App.Locals['db']) => {
	try {
		await db.prepare('ALTER TABLE users ADD COLUMN gender TEXT').run();
		// ignore if column already exists
	} catch (err: any) {
		if (!`${err?.message ?? ''}`.includes('duplicate column name')) {
			throw err;
		}
	}
};

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	const { db, user } = locals;
	if (db) {
		await ensureGenderColumn(db);
	}
	const profile =
		(await db
			.prepare('SELECT id, email, username, role, gender, created_at as createdAt FROM users WHERE id = ?')
			.bind(user.id)
			.first<{
				id: string;
				email: string;
				username: string | null;
				role: string;
				gender: string | null;
				createdAt: number;
			}>())
		?? null;

	return {
		profile
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthenticated' });
		const form = await request.formData();
		const displayName = form.get('displayName');
		const handle = form.get('handle');
		const gender = form.get('gender');

		if (typeof displayName !== 'string') {
			return fail(400, { message: 'Nama tidak valid' });
		}
		if (typeof handle !== 'string') {
			return fail(400, { message: 'ID tidak valid' });
		}
		if (typeof gender !== 'string') {
			return fail(400, { message: 'Jenis kelamin tidak valid' });
		}

		const trimmedHandle = handle.trim();
		if (!trimmedHandle) return fail(400, { message: 'ID wajib diisi' });
		if (!/^[a-zA-Z0-9._-]{3,32}$/.test(trimmedHandle)) {
			return fail(400, { message: 'ID hanya huruf/angka/._- (3-32 karakter)' });
		}

		const genderValue = gender === 'pria' || gender === 'wanita' ? gender : null;

		try {
			await ensureGenderColumn(locals.db);

			await locals.db
				.prepare('UPDATE users SET username = ?, id = ?, gender = ? WHERE id = ?')
				.bind(displayName.trim(), trimmedHandle, genderValue, locals.user.id)
				.run();

			// perbarui sesi lokal agar tetap sinkron
			locals.user = {
				...locals.user,
				id: trimmedHandle,
				username: displayName.trim(),
				gender: genderValue ?? undefined
			} as typeof locals.user;
		} catch (err: any) {
			const msg = err?.code === 'SQLITE_CONSTRAINT' ? 'ID sudah dipakai, pilih yang lain.' : 'Gagal memperbarui profil';
			return fail(400, { message: msg });
		}

		return { success: true, message: 'Profil diperbarui' };
	},

	updatePassword: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Unauthenticated' });
		const form = await request.formData();
		const password = form.get('password');
		const confirm = form.get('confirm');

		if (typeof password !== 'string' || typeof confirm !== 'string') {
			return fail(400, { message: 'Password tidak valid', type: 'password' });
		}
		if (password.length < 6) {
			return fail(400, { message: 'Password minimal 6 karakter', type: 'password' });
		}
		if (password !== confirm) {
			return fail(400, { message: 'Konfirmasi password tidak sama', type: 'password' });
		}

		const hashed = await new Scrypt().hash(password);
		await locals.db
			.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
			.bind(hashed, locals.user.id)
			.run();

		return { success: true, message: 'Password diperbarui', type: 'password' };
	}
};
