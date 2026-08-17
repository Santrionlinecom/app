import { error, redirect } from '@sveltejs/kit';

import { canManageCms } from '$lib/server/auth/cms-access';

import type { PageServerLoad } from './$types';

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
