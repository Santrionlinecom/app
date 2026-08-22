// src/lib/server/auth/reset-password.ts
// Reset password lewat tautan email.
//
// Tautan reset adalah KUNCI CADANGAN sebuah akun: siapa pun yang memegangnya
// bisa masuk tanpa tahu password lama. Karena itu perlakuannya lebih ketat
// daripada password biasa.
//
// Tiga keputusan utama:
//
// 1. HANYA HASH YANG DISIMPAN. Token asli hanya ada di email penerima dan
//    tidak pernah masuk database. Kalau suatu saat isi tabel bocor, yang
//    didapat penyerang adalah hash — tidak bisa dipakai masuk.
//
// 2. JAWABAN SELALU NETRAL. Email terdaftar maupun tidak dijawab dengan
//    kalimat yang sama persis. Kalau berbeda, halaman ini berubah menjadi
//    alat memetakan siapa saja yang punya akun di SantriOnline.
//
// 3. SEKALI PAKAI DAN BERUMUR PENDEK. Token hangus begitu dipakai, dan mati
//    sendiri setelah 60 menit.

import type { D1Database } from '@cloudflare/workers-types';

/** Masa berlaku tautan reset, dalam menit. */
export const MENIT_BERLAKU = 60;

/** Panjang token acak dalam byte (menjadi 64 karakter heksadesimal). */
const PANJANG_TOKEN_BYTE = 32;

const PANJANG_PASSWORD_MINIMAL = 6;

/**
 * Satu-satunya kalimat yang dilihat pengguna setelah meminta reset —
 * baik emailnya terdaftar maupun tidak.
 */
export const PESAN_NETRAL =
	'Jika email tersebut terdaftar, kami sudah mengirim tautan reset password ke inbox-nya. Tautan berlaku 60 menit.';

export const PESAN_TOKEN_TIDAK_SAH =
	'Tautan reset tidak berlaku atau sudah kedaluwarsa. Silakan minta tautan baru.';

export const PESAN_PASSWORD_PENDEK = `Password minimal ${PANJANG_PASSWORD_MINIMAL} karakter.`;

/** Menghasilkan token acak yang aman secara kriptografis. */
export function buatToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(PANJANG_TOKEN_BYTE));
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash token dengan SHA-256.
 *
 * Token reset sudah 256 bit acak, jadi tidak bisa ditebak dengan kamus —
 * karena itu SHA-256 memadai di sini dan jauh lebih cepat daripada Scrypt
 * (penting: ini dijalankan di Workers dengan batas CPU).
 */
export async function hashToken(token: string): Promise<string> {
	const data = new TextEncoder().encode(token);
	const digest = await crypto.subtle.digest('SHA-256', data);
	return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export type HasilMinta = {
	/** true bila email reset benar-benar perlu dikirim. */
	kirim: boolean;
	/** Pesan untuk pengguna — SELALU netral. */
	pesan: string;
	/** Token asli. Hanya untuk dikirim lewat email, jangan pernah dicatat di log. */
	token?: string;
	email?: string;
	nama?: string | null;
};

/**
 * Menerbitkan token reset untuk sebuah email.
 *
 * Pemanggil bertugas mengirim emailnya. Fungsi ini sengaja tidak tahu
 * cara mengirim email agar mudah diuji tanpa jaringan.
 */
export async function mintaResetPassword(
	db: D1Database,
	input: { email: string; ip?: string | null }
): Promise<HasilMinta> {
	const email = input.email.trim().toLowerCase();
	if (!email) return { kirim: false, pesan: PESAN_NETRAL };

	const akun = await db
		.prepare(
			`SELECT id, email, username, dihapus_at
			   FROM users WHERE LOWER(email) = ? LIMIT 1`
		)
		.bind(email)
		.first<{ id: string; email: string; username: string | null; dihapus_at: number | null }>();

	// Setiap jalan keluar di bawah ini memakai PESAN_NETRAL yang sama.
	if (!akun || akun.dihapus_at) {
		return { kirim: false, pesan: PESAN_NETRAL };
	}

	const token = buatToken();
	const tokenHash = await hashToken(token);
	const sekarang = Date.now();

	// Token lama dibatalkan: tautan di email sebelumnya harus mati, supaya
	// email lama yang bocor tidak bisa dipakai lagi.
	await db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').bind(akun.id).run();

	await db
		.prepare(
			`INSERT INTO password_reset_tokens (token_hash, user_id, expires_at, dibuat_at, ip)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.bind(tokenHash, akun.id, sekarang + MENIT_BERLAKU * 60_000, sekarang, input.ip ?? null)
		.run();

	return {
		kirim: true,
		pesan: PESAN_NETRAL,
		token,
		email: akun.email,
		nama: akun.username
	};
}

export type HasilPakai =
	| { ok: true; userId: string; email: string; nama: string | null }
	| { ok: false; pesan: string };

/**
 * Menukar token dengan password baru.
 *
 * `hashPassword` disuntikkan dari luar agar tes tidak perlu menjalankan
 * Scrypt yang lambat, sementara produksi tetap memakai Scrypt sungguhan.
 */
export async function pakaiTokenReset(
	db: D1Database,
	input: {
		token: string;
		passwordBaru: string;
		hashPassword: (password: string) => Promise<string>;
	}
): Promise<HasilPakai> {
	const token = input.token?.trim();
	if (!token) return { ok: false, pesan: PESAN_TOKEN_TIDAK_SAH };

	const tokenHash = await hashToken(token);
	const baris = await db
		.prepare(
			`SELECT token_hash, user_id, expires_at, dipakai_at
			   FROM password_reset_tokens WHERE token_hash = ? LIMIT 1`
		)
		.bind(tokenHash)
		.first<{ token_hash: string; user_id: string; expires_at: number; dipakai_at: number | null }>();

	if (!baris) return { ok: false, pesan: PESAN_TOKEN_TIDAK_SAH };
	if (baris.dipakai_at) return { ok: false, pesan: PESAN_TOKEN_TIDAK_SAH };
	if (Number(baris.expires_at) <= Date.now()) return { ok: false, pesan: PESAN_TOKEN_TIDAK_SAH };

	// Password terlalu pendek diperiksa SETELAH token divalidasi, tetapi
	// token sengaja TIDAK dihanguskan — ini kesalahan ketik pengguna sendiri,
	// bukan serangan. Menghanguskannya akan memaksa dia meminta tautan baru
	// hanya karena salah ketik.
	if (typeof input.passwordBaru !== 'string' || input.passwordBaru.length < PANJANG_PASSWORD_MINIMAL) {
		return { ok: false, pesan: PESAN_PASSWORD_PENDEK };
	}

	const akun = await db
		.prepare('SELECT id, email, username, dihapus_at FROM users WHERE id = ? LIMIT 1')
		.bind(baris.user_id)
		.first<{ id: string; email: string; username: string | null; dihapus_at: number | null }>();

	if (!akun || akun.dihapus_at) return { ok: false, pesan: PESAN_TOKEN_TIDAK_SAH };

	const hashed = await input.hashPassword(input.passwordBaru);
	const sekarang = Date.now();

	await db
		.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
		.bind(hashed, akun.id)
		.run();

	// Tandai terpakai lalu buang seluruh token milik akun ini.
	await db
		.prepare('UPDATE password_reset_tokens SET dipakai_at = ? WHERE token_hash = ?')
		.bind(sekarang, tokenHash)
		.run();
	await db
		.prepare('DELETE FROM password_reset_tokens WHERE user_id = ? AND token_hash <> ?')
		.bind(akun.id, tokenHash)
		.run();

	// Cabut semua sesi: kalau akun sempat diambil alih, penyusup ikut
	// terlempar keluar begitu pemilik sahnya mereset password.
	await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(akun.id).run();

	return { ok: true, userId: akun.id, email: akun.email, nama: akun.username };
}
