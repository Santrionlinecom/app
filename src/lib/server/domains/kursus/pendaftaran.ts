import type { D1Database } from '@cloudflare/workers-types';

import { deductCoins } from '../buku/coin-operations';

/** Harga untuk kursus gratis. */
export const KURSUS_GRATIS = 0;

export type HasilDaftar =
	| { status: 'terdaftar'; kursusId: string; dibayar: number }
	| { status: 'sudah_terdaftar'; kursusId: string }
	| { status: 'saldo_kurang'; butuh: number; kurang: number }
	| { status: 'tidak_ditemukan' }
	| { status: 'gagal'; pesan: string };

/**
 * Menormalkan harga kursus.
 *
 * Nilai minus dan pecahan bisa masuk dari input admin atau data lama, dan
 * keduanya berbahaya bila diteruskan ke pemotongan koin.
 */
export const hitungHargaKursus = (nilai: number): number => {
	if (!Number.isFinite(nilai) || nilai <= 0) return KURSUS_GRATIS;
	return Math.floor(nilai);
};

/** Memeriksa apakah pengguna sudah terdaftar pada satu kursus. */
export const sudahTerdaftar = async (
	db: D1Database,
	userId: string,
	kursusId: string
): Promise<boolean> => {
	const baris = await db
		.prepare('SELECT id FROM kursus_pendaftaran WHERE user_id = ? AND kursus_id = ? LIMIT 1')
		.bind(userId, kursusId)
		.first<{ id: string }>();
	return Boolean(baris);
};

/**
 * Mendaftarkan pengguna ke sebuah kursus.
 *
 * Kursus memakai ulang dompet koin yang sudah ada lewat `deductCoins`, bukan
 * membuat sistem saldo sendiri — sehingga riwayat transaksi pengguna tetap
 * satu tempat dan tidak ada dua sumber kebenaran untuk saldo.
 *
 * Kursus gratis (harga 0) tidak menyentuh dompet sama sekali.
 */
export const daftarKursus = async (
	db: D1Database,
	userId: string,
	slug: string
): Promise<HasilDaftar> => {
	const kursus = await db
		.prepare('SELECT id, slug, harga_koin, status FROM kursus WHERE slug = ? LIMIT 1')
		.bind(slug)
		.first<{ id: string; slug: string; harga_koin: number; status: string }>();

	// Kursus draft diperlakukan seperti tidak ada agar materi yang belum siap
	// tidak bocor lewat tebakan slug.
	if (!kursus || kursus.status !== 'published') return { status: 'tidak_ditemukan' };

	if (await sudahTerdaftar(db, userId, kursus.id)) {
		return { status: 'sudah_terdaftar', kursusId: kursus.id };
	}

	const harga = hitungHargaKursus(Number(kursus.harga_koin));

	if (harga > KURSUS_GRATIS) {
		const saldo = await db
			.prepare('SELECT balance FROM coin_wallets WHERE user_id = ? LIMIT 1')
			.bind(userId)
			.first<{ balance: number }>();
		const punya = Number(saldo?.balance ?? 0);

		if (punya < harga) {
			return { status: 'saldo_kurang', butuh: harga, kurang: harga - punya };
		}

		const potong = await deductCoins(
			db,
			userId,
			harga,
			`Pendaftaran kursus: ${kursus.slug}`,
			'kursus',
			kursus.id
		);
		if (!potong.success) {
			return { status: 'gagal', pesan: potong.error ?? 'Pemotongan koin gagal' };
		}
	}

	const sekarang = Date.now();
	await db
		.prepare(
			`INSERT INTO kursus_pendaftaran (id, kursus_id, user_id, harga_dibayar, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(crypto.randomUUID(), kursus.id, userId, harga, sekarang, sekarang)
		.run();

	return { status: 'terdaftar', kursusId: kursus.id, dibayar: harga };
};
