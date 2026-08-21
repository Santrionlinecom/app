// src/routes/(app)/halaqah/+page.server.ts
// Halaqah santri: daftar halaqah yang diikuti + riwayat setoran & balasannya.
import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { assertLoggedIn } from '$lib/server/auth/rbac';
import { halaqahSaya, kirimSetoran, setoranSaya, SETORAN_JENIS } from '$lib/server/halaqah/service';

export const load: PageServerLoad = async ({ locals }) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

	const [halaqah, setoran] = await Promise.all([
		halaqahSaya(locals.db, user.id),
		setoranSaya(locals.db, user.id)
	]);

	return { halaqah, setoran };
};

export const actions: Actions = {
	setor: async ({ request, locals }) => {
		const user = assertLoggedIn({ locals });
		if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

		const data = await request.formData();
		const halaqohId = String(data.get('halaqohId') ?? '').trim();
		const jenis = String(data.get('jenis') ?? '');
		const surah = String(data.get('surah') ?? '').trim();
		const ayatDari = Number(data.get('ayatDari'));
		const ayatSampai = Number(data.get('ayatSampai'));
		const catatan = String(data.get('catatan') ?? '');

		if (!halaqohId) return fail(400, { pesan: 'Pilih halaqah lebih dulu.' });
		if (!SETORAN_JENIS.includes(jenis as never)) {
			return fail(400, { pesan: 'Pilih jenis setoran yang sah.' });
		}
		if (!surah) return fail(400, { pesan: 'Tuliskan surah yang disetorkan.' });
		if (!Number.isInteger(ayatDari) || ayatDari < 1) {
			return fail(400, { pesan: 'Ayat awal tidak sah.' });
		}
		if (!Number.isInteger(ayatSampai) || ayatSampai < ayatDari) {
			return fail(400, { pesan: 'Ayat akhir tidak boleh lebih kecil dari ayat awal.' });
		}

		try {
			await kirimSetoran(locals.db, {
				halaqohId,
				santriUserId: user.id,
				jenis: jenis as 'hafalan' | 'murojaah',
				surah,
				ayatDari,
				ayatSampai,
				catatan
			});
		} catch (err) {
			if (err instanceof Error && err.message === 'BUKAN_ANGGOTA_HALAQAH') {
				return fail(403, { pesan: 'Anda bukan anggota halaqah tersebut.' });
			}
			return fail(400, { pesan: 'Setoran belum bisa dikirim. Periksa kembali isiannya.' });
		}

		return { sukses: true };
	}
};
