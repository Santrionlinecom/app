// src/routes/(app)/dashboard/diniyah/+page.server.ts
// Jadwal diniyah harian — dibaca dari database, bukan ditulis di komponen.
//
// Sebelumnya halaman ini menyimpan 7 slug kitab langsung di +page.svelte.
// Risikonya senyap: begitu sebuah kitab berganti slug atau ditarik dari
// katalog, tautannya berubah jadi 404 tanpa ada yang tahu. Sekarang setiap
// slug diverifikasi ke kitab_catalog; yang tidak ditemukan ditandai
// 'tersedia: false' dan tidak dijadikan tautan.
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { assertLoggedIn } from '$lib/server/auth/rbac';

export type MateriHari = {
	hari: string;
	topik: string;
	kitabSlug: string;
	kitabJudul: string;
	tersedia: boolean;
};

/**
 * Kurikulum pekanan. Urutan hari & topik memang keputusan kurikulum
 * (bukan data pengguna), tapi JUDUL dan ketersediaan kitab diambil dari
 * katalog supaya halaman tidak pernah menjanjikan kitab yang tak ada.
 */
const KURIKULUM: { hari: string; topik: string; kitabSlug: string }[] = [
	{ hari: 'Ahad', topik: 'Aqidah', kitabSlug: 'terjemah-aqidatul-awam' },
	{ hari: 'Senin', topik: "Tadabbur Qur'an", kitabSlug: 'ilmu-tajwid-lengkap' },
	{
		hari: 'Selasa',
		topik: 'Hadits',
		kitabSlug: 'terjemah-syarah-arbain-nawawiyah-ibnu-daqiqil-ied'
	},
	{ hari: 'Rabu', topik: 'Fiqih', kitabSlug: 'safinatun-najah-makna-perkata' },
	{ hari: 'Kamis', topik: 'Tasawuf', kitabSlug: 'terjemah-bidayatul-hidayah' },
	{ hari: 'Jumat', topik: "Do'a & Dzikir", kitabSlug: 'terjemah-bidayatul-hidayah' },
	{ hari: 'Sabtu', topik: 'B. Arab', kitabSlug: 'bahasa-arab-dasar-1' }
];

export const load: PageServerLoad = async ({ locals }) => {
	assertLoggedIn({ locals });
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

	const slugUnik = [...new Set(KURIKULUM.map((k) => k.kitabSlug))];
	const tanda = slugUnik.map(() => '?').join(',');

	const { results } = await locals.db
		.prepare(
			`SELECT slug, title FROM kitab_catalog
			  WHERE slug IN (${tanda}) AND status = 'published'`
		)
		.bind(...slugUnik)
		.all<{ slug: string; title: string }>();

	const katalog = new Map((results ?? []).map((r) => [r.slug, r.title]));

	const materi: MateriHari[] = KURIKULUM.map((k) => ({
		hari: k.hari,
		topik: k.topik,
		kitabSlug: k.kitabSlug,
		kitabJudul: katalog.get(k.kitabSlug) ?? 'Kitab belum tersedia',
		tersedia: katalog.has(k.kitabSlug)
	}));

	return { materi };
};
