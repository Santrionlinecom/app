import { error, fail, redirect } from '@sveltejs/kit';

import { canManageCms } from '$lib/server/auth/cms-access';
import { periksaHargaKursus } from '$lib/server/domains/kursus/kebijakan-harga';
import { slugify } from '$lib/server/organizations';

import type { Actions, PageServerLoad } from './$types';

type BarisKursus = {
	id: string;
	slug: string;
	judul: string;
	harga_koin: number;
	status: string;
	urutan: number;
	jumlah_materi: number;
	jumlah_peserta: number;
};

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) throw redirect(302, '/auth');
	if (!canManageCms(locals.user)) throw redirect(302, '/dashboard');

	const db = locals.db ?? platform?.env?.DB;
	if (!db) throw error(503, 'Layanan data tidak tersedia');

	const daftar = await db
		.prepare(
			`SELECT k.id, k.slug, k.judul, k.harga_koin, k.status, k.urutan,
			        (SELECT COUNT(*) FROM kursus_materi m WHERE m.kursus_id = k.id) AS jumlah_materi,
			        (SELECT COUNT(*) FROM kursus_pendaftaran p WHERE p.kursus_id = k.id) AS jumlah_peserta
			 FROM kursus k ORDER BY k.urutan, k.judul`
		)
		.all<BarisKursus>()
		.catch(() => ({ results: [] as BarisKursus[] }));

	return { kursus: daftar.results ?? [] };
};

export const actions: Actions = {
	/**
	 * Membuat kursus baru berstatus draft. Sengaja minimal: judul saja.
	 * Rincian selebihnya diisi di halaman sunting yang sudah ada, sehingga
	 * aturan harga/kategori tetap ditegakkan di satu tempat.
	 */
	buat: async ({ locals, platform, request }) => {
		if (!canManageCms(locals.user)) return fail(403, { pesan: 'Tidak diizinkan' });

		const db = locals.db ?? platform?.env?.DB;
		if (!db) return fail(503, { pesan: 'Layanan data tidak tersedia' });

		const form = await request.formData();
		const judul = String(form.get('judul') ?? '').trim();
		const kategori = String(form.get('kategori') ?? '').trim();

		if (!judul) return fail(400, { pesan: 'Judul kursus wajib diisi' });

		const dasarSlug = slugify(judul);
		if (!dasarSlug) return fail(400, { pesan: 'Judul harus memuat huruf atau angka' });

		// Slug wajib unik di tabel. Cari akhiran bebas dulu agar admin tidak
		// dihadapkan pada galat UNIQUE mentah.
		let slug = dasarSlug;
		for (let percobaan = 2; percobaan <= 50; percobaan += 1) {
			const bentrok = await db
				.prepare('SELECT 1 FROM kursus WHERE slug = ? LIMIT 1')
				.bind(slug)
				.first<{ 1: number }>()
				.catch(() => null);
			if (!bentrok) break;
			slug = `${dasarSlug}-${percobaan}`;
		}

		// Kursus ilmu agama wajib gratis; kursus baru selalu mulai dari 0 koin
		// dan tetap dilewatkan kebijakan yang sama supaya konsisten.
		const putusan = periksaHargaKursus(kategori, 0);

		const sekarang = Date.now();
		const id = crypto.randomUUID();

		await db
			.prepare(
				`INSERT INTO kursus (id, slug, judul, kategori, harga_koin, status, urutan, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, 'draft', 0, ?, ?)`
			)
			.bind(id, slug, judul, kategori || null, putusan.harga, sekarang, sekarang)
			.run();

		throw redirect(303, `/admin/kursus/${slug}/edit`);
	},

	/**
	 * Menghapus kursus. Ditolak bila sudah ada peserta terdaftar: pendaftaran
	 * menyimpan harga koin yang benar-benar dibayar, dan ON DELETE CASCADE akan
	 * menghapus riwayat itu berikut progres belajarnya. Arsipkan saja.
	 */
	hapus: async ({ locals, platform, request }) => {
		if (!canManageCms(locals.user)) return fail(403, { pesan: 'Tidak diizinkan' });

		const db = locals.db ?? platform?.env?.DB;
		if (!db) return fail(503, { pesan: 'Layanan data tidak tersedia' });

		const form = await request.formData();
		const slug = String(form.get('slug') ?? '').trim();
		if (!slug) return fail(400, { pesan: 'Kursus tidak disebutkan' });

		const kursus = await db
			.prepare('SELECT id, judul FROM kursus WHERE slug = ? LIMIT 1')
			.bind(slug)
			.first<{ id: string; judul: string }>()
			.catch(() => null);

		if (!kursus) return fail(404, { pesan: 'Kursus tidak ditemukan' });

		const peserta = await db
			.prepare('SELECT COUNT(*) AS jumlah FROM kursus_pendaftaran WHERE kursus_id = ?')
			.bind(kursus.id)
			.first<{ jumlah: number }>()
			.catch(() => ({ jumlah: 0 }));

		if ((peserta?.jumlah ?? 0) > 0) {
			return fail(409, {
				pesan: `"${kursus.judul}" sudah punya ${peserta?.jumlah} peserta. Ubah status menjadi Arsip, jangan dihapus.`
			});
		}

		await db.prepare('DELETE FROM kursus WHERE id = ?').bind(kursus.id).run();

		return { berhasil: true, pesan: `Kursus "${kursus.judul}" dihapus` };
	}
};
