import { fail, redirect } from '@sveltejs/kit';
import { initializeLucia } from '$lib/server/lucia';
import { Scrypt, Argon2id } from 'oslo/password';
import type { Actions, PageServerLoad } from './$types';

// Jika user sudah login, lempar ke dashboard (biar gak login 2x)
export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user) throw redirect(302, '/dashboard');
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

        const db = locals.db ?? platform?.env.DB;
        if (!db) return fail(500, { message: 'Database error: D1 tidak terhubung.' });

        try {
            // 2. Cari user di database
            // Kita ambil password_hash juga untuk verifikasi
            const user = await db
                .prepare('SELECT id, password_hash FROM users WHERE email = ?')
                .bind(email)
                .first<{ id: string; password_hash: unknown }>();

            if (!user) {
                // User tidak ditemukan
                return fail(400, { message: 'Email atau Password salah.' });
            }

            // 3. Cek Password (kalau user ini dulunya daftar pake Google doang, dia gak punya password)
            const passwordHash =
                typeof user.password_hash === 'string' ? user.password_hash : null;

            if (!passwordHash) {
                return fail(400, { 
                    message: 'Akun ini terdaftar via Google. Silakan login menggunakan tombol Google.' 
                });
            }

            // 4. Verifikasi Password (dukung hash lama Argon2id)
            let validPassword = false;
            const isArgonHash = passwordHash.startsWith('$argon2');
            if (isArgonHash) {
                validPassword = await new Argon2id().verify(passwordHash, password);
                // jika valid, migrasikan ke Scrypt supaya seragam
                if (validPassword) {
                    const newHash = await new Scrypt().hash(password);
                    await db
                        .prepare('UPDATE users SET password_hash = ? WHERE id = ?')
                        .bind(newHash, user.id)
                        .run();
                }
            } else {
                validPassword = await new Scrypt().verify(passwordHash, password);
            }
            
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

        } catch (e) {
            console.error(e);
            return fail(500, { message: 'Terjadi kesalahan server saat login.' });
        }

        // 6. Lempar ke Dashboard
        throw redirect(302, '/dashboard');
    }
};
