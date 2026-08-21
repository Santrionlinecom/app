// src/routes/(app)/wali/[santriId]/+page.server.ts
// Detail perkembangan seorang anak.
// Otorisasi ditegakkan di service (assertWaliBerhak), bukan di UI.
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { assertLoggedIn } from '$lib/server/auth/rbac';
import { ringkasanAnak } from '$lib/server/wali/service';

export const load: PageServerLoad = async ({ locals, params, setHeaders }) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

	// Data anak tidak boleh tersimpan di cache bersama mana pun.
	setHeaders({
		'cache-control': 'private, no-store, max-age=0',
		'x-robots-tag': 'noindex, nofollow, noarchive'
	});

	try {
		const ringkasan = await ringkasanAnak(locals.db, user.id, params.santriId);
		return { ringkasan };
	} catch (err) {
		// Wali tanpa hak dibalas 404, bukan 403 — supaya keberadaan akun
		// santri tertentu tidak bisa diendus lewat perbedaan kode status.
		if (err instanceof Error && err.message === 'WALI_TIDAK_BERHAK') {
			throw error(404, 'Halaman tidak ditemukan');
		}
		throw err;
	}
};
