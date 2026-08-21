// src/routes/(app)/rapor/+page.server.ts
// Rapor milik santri. Di sinilah santri memutuskan mau membagikan atau tidak.
//
// Hak publikasi sengaja di tangan SANTRI, bukan lembaga — merekalah yang
// menanggung akibat bila capaiannya tersebar.
import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { assertLoggedIn } from '$lib/server/auth/rbac';
import { ubahPublikasi } from '$lib/server/rapor/service';

export const load: PageServerLoad = async ({ locals }) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

	const { results } = await locals.db
		.prepare(
			`SELECT c.id, c.title, c.slug, c.issued_at, c.is_public, c.dicabut_at,
			        c.periode_mulai, c.periode_selesai,
			        o.name AS lembaga_nama
			   FROM certificates c
			   LEFT JOIN organizations o ON o.id = c.org_id
			  WHERE c.santri_id = ? AND c.jenis = 'rapor'
			  ORDER BY c.issued_at DESC`
		)
		.bind(user.id)
		.all<{
			id: string;
			title: string;
			slug: string | null;
			issued_at: string;
			is_public: number;
			dicabut_at: number | null;
			periode_mulai: string | null;
			periode_selesai: string | null;
			lembaga_nama: string | null;
		}>();

	return { rapor: results ?? [] };
};

export const actions: Actions = {
	ubahPublikasi: async ({ request, locals }) => {
		const user = assertLoggedIn({ locals });
		if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

		const data = await request.formData();
		const raporId = String(data.get('raporId') ?? '').trim();
		const publik = String(data.get('publik') ?? '') === 'ya';

		if (!raporId) return fail(400, { pesan: 'Rapor tidak dikenali.' });

		// Service membatasi UPDATE pada santri_id = pemilik, jadi rapor
		// orang lain tidak akan pernah tersentuh meski id-nya ditebak.
		const berhasil = await ubahPublikasi(locals.db, {
			raporId,
			pemilikUserId: user.id,
			publik
		});

		if (!berhasil) return fail(404, { pesan: 'Rapor tidak ditemukan.' });

		return {
			sukses: publik
				? 'Rapor sekarang bisa dibagikan lewat tautannya.'
				: 'Rapor kembali privat. Tautan lama tidak lagi bisa dibuka.'
		};
	}
};
