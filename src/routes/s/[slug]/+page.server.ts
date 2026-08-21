// src/routes/s/[slug]/+page.server.ts
// Halaman rapor publik. Sengaja DI LUAR grup (app): tidak butuh login,
// karena inilah yang dibagikan wali ke grup WA.
//
// Semua yang tidak boleh terbaca dibalas 404 yang sama — privat, dicabut,
// dan tidak ada tidak dibedakan, supaya keberadaan rapor privat tidak
// bisa diendus dari perbedaan kode status.
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { raporPublik } from '$lib/server/rapor/service';

export const load: PageServerLoad = async ({ locals, params, setHeaders }) => {
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

	const rapor = await raporPublik(locals.db, params.slug);
	if (!rapor) throw error(404, 'Halaman tidak ditemukan');

	// Boleh di-cache: isinya snapshot beku yang tidak berubah.
	setHeaders({ 'cache-control': 'public, max-age=600' });

	return { rapor };
};
