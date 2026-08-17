import { json } from '@sveltejs/kit';

import { daftarKursus } from '$lib/server/domains/kursus/pendaftaran';

import type { RequestHandler } from './$types';

/**
 * Mendaftarkan pengguna yang sedang login ke sebuah kursus.
 *
 * Kursus gratis langsung terdaftar; kursus berbayar memotong koin lewat
 * dompet yang sudah ada. Semua jawaban memakai bahasa Indonesia karena
 * ditampilkan apa adanya kepada pengguna.
 */
export const POST: RequestHandler = async ({ locals, platform, request }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		return json({ ok: false, pesan: 'Layanan data tidak tersedia' }, { status: 503 });
	}

	const userId = locals.user?.id;
	if (!userId) {
		return json({ ok: false, pesan: 'Silakan masuk terlebih dahulu' }, { status: 401 });
	}

	const badan = (await request.json().catch(() => null)) as { slug?: unknown } | null;
	const slug = typeof badan?.slug === 'string' ? badan.slug.trim() : '';
	if (!slug) {
		return json({ ok: false, pesan: 'Kursus tidak disebutkan' }, { status: 400 });
	}

	const hasil = await daftarKursus(db, userId, slug);

	switch (hasil.status) {
		case 'terdaftar':
			return json({
				ok: true,
				pesan: hasil.dibayar > 0
					? `Pendaftaran berhasil. ${hasil.dibayar} koin telah dipotong.`
					: 'Pendaftaran berhasil. Kursus ini gratis.',
				kursusId: hasil.kursusId
			});

		case 'sudah_terdaftar':
			return json({
				ok: true,
				pesan: 'Anda sudah terdaftar di kursus ini.',
				kursusId: hasil.kursusId
			});

		case 'saldo_kurang':
			return json(
				{
					ok: false,
					pesan: `Saldo koin kurang ${hasil.kurang}. Silakan topup terlebih dahulu.`,
					butuh: hasil.butuh,
					kurang: hasil.kurang
				},
				{ status: 402 }
			);

		case 'tidak_ditemukan':
			return json({ ok: false, pesan: 'Kursus tidak ditemukan' }, { status: 404 });

		default:
			return json({ ok: false, pesan: hasil.pesan }, { status: 500 });
	}
};
