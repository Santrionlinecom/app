import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

type BarisKursus = {
	id: string;
	slug: string;
	judul: string;
	ringkasan: string | null;
	deskripsi: string | null;
	harga_koin: number;
	level: string;
	kategori: string | null;
	durasi_menit: number;
};

type BarisMateri = {
	id: string;
	judul: string;
	urutan: number;
	durasi_menit: number;
	isi?: string;
};

/**
 * Halaman belajar. Materi hanya dibuka untuk yang sudah terdaftar, sehingga
 * kursus berbayar tidak bisa dibaca hanya dengan menebak slug.
 */
export const load: PageServerLoad = async ({ locals, params, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) throw error(503, 'Layanan data tidak tersedia');

	// Kegagalan kueri (mis. tabel belum termigrasi di suatu lingkungan) tidak
	// boleh muncul sebagai 500 beserta jejak tumpukan; perlakukan seperti
	// kursus tidak ditemukan.
	const kursus = await db
		.prepare(
			`SELECT id, slug, judul, ringkasan, deskripsi, harga_koin, level, kategori, durasi_menit
			 FROM kursus WHERE slug = ? AND status = 'published' LIMIT 1`
		)
		.bind(params.slug)
		.first<BarisKursus>()
		.catch(() => null);

	if (!kursus) throw error(404, 'Kursus tidak ditemukan');

	const userId = locals.user?.id;
	let boleh = false;

	if (userId) {
		const daftar = await db
			.prepare('SELECT id FROM kursus_pendaftaran WHERE user_id = ? AND kursus_id = ? LIMIT 1')
			.bind(userId, kursus.id)
			.first<{ id: string }>()
			.catch(() => null);
		boleh = Boolean(daftar);
	}

	// Judul materi selalu ditampilkan sebagai daftar isi; isinya hanya untuk
	// yang sudah terdaftar.
	const materi = await db
		.prepare(
			`SELECT id, judul, urutan, durasi_menit${boleh ? ', isi' : ''}
			 FROM kursus_materi WHERE kursus_id = ? ORDER BY urutan`
		)
		.bind(kursus.id)
		.all<BarisMateri>()
		.catch(() => ({ results: [] as BarisMateri[] }));

	return {
		kursus,
		materi: materi.results ?? [],
		boleh,
		masuk: Boolean(userId)
	};
};
