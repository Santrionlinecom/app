import { error, fail, redirect } from '@sveltejs/kit';

import { canManageCms } from '$lib/server/auth/cms-access';
import { bersihkanHtml } from '$lib/server/domains/kursus/format-materi';

import type { Actions, PageServerLoad } from './$types';

type BarisKursus = {
	id: string;
	slug: string;
	judul: string;
	ringkasan: string | null;
	harga_koin: number;
	level: string;
	kategori: string | null;
	durasi_menit: number;
	status: string;
};

type BarisMateri = {
	id: string;
	judul: string;
	isi: string;
	urutan: number;
	durasi_menit: number;
	format: string | null;
};

/**
 * Penyuntingan kursus hanya untuk superadmin, mengikuti aturan yang sama
 * dengan CMS artikel (canManageCms).
 */
export const load: PageServerLoad = async ({ locals, params, platform }) => {
	if (!locals.user) throw redirect(302, '/auth');
	if (!canManageCms(locals.user)) throw redirect(302, '/dashboard');

	const db = locals.db ?? platform?.env?.DB;
	if (!db) throw error(503, 'Layanan data tidak tersedia');

	const kursus = await db
		.prepare(
			`SELECT id, slug, judul, ringkasan, harga_koin, level, kategori, durasi_menit, status
			 FROM kursus WHERE slug = ? LIMIT 1`
		)
		.bind(params.slug)
		.first<BarisKursus>()
		.catch(() => null);

	if (!kursus) throw error(404, 'Kursus tidak ditemukan');

	const materi = await db
		.prepare(
			`SELECT id, judul, isi, urutan, durasi_menit, format
			 FROM kursus_materi WHERE kursus_id = ? ORDER BY urutan`
		)
		.bind(kursus.id)
		.all<BarisMateri>()
		.catch(() => ({ results: [] as BarisMateri[] }));

	return { kursus, materi: materi.results ?? [] };
};

export const actions: Actions = {
	/** Menyimpan keterangan kursus (judul, harga, status). */
	kursus: async ({ locals, params, platform, request }) => {
		if (!canManageCms(locals.user)) return fail(403, { pesan: 'Tidak diizinkan' });

		const db = locals.db ?? platform?.env?.DB;
		if (!db) return fail(503, { pesan: 'Layanan data tidak tersedia' });

		const form = await request.formData();
		const judul = String(form.get('judul') ?? '').trim();
		const ringkasan = String(form.get('ringkasan') ?? '').trim();
		const kategori = String(form.get('kategori') ?? '').trim();
		const level = String(form.get('level') ?? 'dasar').trim();
		const status = String(form.get('status') ?? 'draft').trim();

		// Harga dinormalkan di sini juga, bukan hanya di sisi klien: form bisa
		// dikirim langsung tanpa lewat halaman.
		const hargaMentah = Number(form.get('harga_koin') ?? 0);
		const harga = Number.isFinite(hargaMentah) && hargaMentah > 0 ? Math.floor(hargaMentah) : 0;

		const durasiMentah = Number(form.get('durasi_menit') ?? 0);
		const durasi = Number.isFinite(durasiMentah) && durasiMentah > 0 ? Math.floor(durasiMentah) : 0;

		if (!judul) return fail(400, { pesan: 'Judul wajib diisi' });
		if (!['draft', 'published', 'archived'].includes(status)) {
			return fail(400, { pesan: 'Status tidak dikenal' });
		}

		await db
			.prepare(
				`UPDATE kursus
				 SET judul = ?, ringkasan = ?, kategori = ?, level = ?, status = ?,
				     harga_koin = ?, durasi_menit = ?, updated_at = ?
				 WHERE slug = ?`
			)
			.bind(judul, ringkasan || null, kategori || null, level, status, harga, durasi, Date.now(), params.slug)
			.run();

		return { berhasil: true, pesan: 'Keterangan kursus tersimpan' };
	},

	/** Menyimpan satu materi. Isi dari editor selalu HTML. */
	materi: async ({ locals, platform, request }) => {
		if (!canManageCms(locals.user)) return fail(403, { pesan: 'Tidak diizinkan' });

		const db = locals.db ?? platform?.env?.DB;
		if (!db) return fail(503, { pesan: 'Layanan data tidak tersedia' });

		const form = await request.formData();
		const id = String(form.get('id') ?? '').trim();
		const judul = String(form.get('judul') ?? '').trim();
		const isiMentah = String(form.get('isi') ?? '');

		if (!id) return fail(400, { pesan: 'Materi tidak disebutkan' });
		if (!judul) return fail(400, { pesan: 'Judul materi wajib diisi' });

		// Dibersihkan meski hanya superadmin yang bisa menyunting: isi sering
		// datang dari salin-tempel halaman lain, dan materi ini dirender mentah
		// ke setiap peserta.
		const isi = bersihkanHtml(isiMentah);
		if (!isi.trim()) return fail(400, { pesan: 'Isi materi tidak boleh kosong' });

		await db
			.prepare(
				`UPDATE kursus_materi
				 SET judul = ?, isi = ?, format = 'html', updated_by = ?, updated_at = ?
				 WHERE id = ?`
			)
			.bind(judul, isi, locals.user?.id ?? null, Date.now(), id)
			.run();

		return { berhasil: true, pesan: `Materi "${judul}" tersimpan` };
	}
};
