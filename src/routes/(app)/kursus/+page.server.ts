import type { PageServerLoad } from './$types';

type BarisKursus = {
	id: string;
	slug: string;
	judul: string;
	ringkasan: string | null;
	harga_koin: number;
	level: string;
	kategori: string | null;
	durasi_menit: number;
};

/**
 * Katalog kursus terbuka untuk umum — tidak butuh login.
 *
 * Pendaftaran barulah yang memerlukan akun; halaman ini sengaja bisa dilihat
 * siapa saja agar kursus dapat dibagikan tautannya.
 */
export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) return { kursus: [], terdaftar: [] as string[], masuk: false };

	const daftar = await db
		.prepare(
			`SELECT id, slug, judul, ringkasan, harga_koin, level, kategori, durasi_menit
			 FROM kursus WHERE status = 'published' ORDER BY urutan, judul`
		)
		.all<BarisKursus>()
		.catch(() => ({ results: [] as BarisKursus[] }));

	const userId = locals.user?.id;
	let terdaftar: string[] = [];

	if (userId) {
		const punya = await db
			.prepare('SELECT kursus_id FROM kursus_pendaftaran WHERE user_id = ?')
			.bind(userId)
			.all<{ kursus_id: string }>()
			.catch(() => ({ results: [] as { kursus_id: string }[] }));
		terdaftar = (punya.results ?? []).map((r) => r.kursus_id);
	}

	return {
		kursus: daftar.results ?? [],
		terdaftar,
		masuk: Boolean(userId)
	};
};
