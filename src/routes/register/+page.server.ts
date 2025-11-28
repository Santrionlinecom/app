import { fail, redirect } from '@sveltejs/kit';
import { initializeLucia } from '$lib/server/lucia';
import { generateId } from 'lucia';
import { Scrypt } from 'oslo/password'; // <-- GANTI: Pakai Scrypt yang aman untuk Cloudflare
import type { Actions } from './$types';

export const actions: Actions = {
    default: async ({ request, platform, cookies, locals }) => {
        const formData = await request.formData();
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
        const role = formData.get('role') || 'santri'; // Default role santri jika kosong

        // Validasi Input
        if (
            typeof username !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string'
        ) {
            return fail(400, { message: 'Semua kolom wajib diisi!' });
        }

        if (password.length < 6) {
            return fail(400, { message: 'Password minimal 6 karakter.' });
        }

        // Ambil DB dari locals atau platform (D1 Cloudflare)
        const db = platform?.env.DB;
        if (!db) return fail(500, { message: 'Database error: D1 tidak terhubung.' });

        try {
            // 1. Cek apakah email sudah ada?
            const existingUser = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
            if (existingUser) {
                return fail(400, { message: 'Email sudah terdaftar.' });
            }

            // 2. Enkripsi Password menggunakan Scrypt
            const hashedPassword = await new Scrypt().hash(password);
            const userId = generateId(15);

            // 3. Simpan ke Database
            await db.prepare(
                'INSERT INTO users (id, username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
            )
                .bind(userId, username, email, hashedPassword, role, Date.now())
                .run();

            // 4. Auto Login setelah daftar
            const lucia = initializeLucia(db);
            const session = await lucia.createSession(userId, {});
            const sessionCookie = lucia.createSessionCookie(session.id);

            cookies.set(sessionCookie.name, sessionCookie.value, {
                path: '.',
                ...sessionCookie.attributes
            });

        } catch (e) {
            console.error(e);
            return fail(500, { message: 'Gagal mendaftar. Coba lagi.' });
        }

        // 5. Redirect ke Dashboard
        throw redirect(302, '/dashboard');
    }
};
