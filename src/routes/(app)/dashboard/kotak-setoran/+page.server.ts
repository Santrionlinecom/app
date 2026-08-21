// src/routes/(app)/dashboard/kotak-setoran/+page.server.ts
// Kotak setoran musyrif: setoran yang menunggu dibalas.
import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { assertLoggedIn } from '$lib/server/auth/rbac';
import { balasSetoran, setoranMenunggu } from '$lib/server/halaqah/service';

export const load: PageServerLoad = async ({ locals }) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

	const menunggu = await setoranMenunggu(locals.db, user.id);
	return { menunggu };
};

export const actions: Actions = {
	balas: async ({ request, locals }) => {
		const user = assertLoggedIn({ locals });
		if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

		const data = await request.formData();
		const setoranId = String(data.get('setoranId') ?? '').trim();
		const mutu = String(data.get('mutu') ?? '');
		const balasan = String(data.get('balasan') ?? '');
		const disetujui = String(data.get('keputusan') ?? '') === 'setuju';

		if (!['lancar', 'cukup', 'belum'].includes(mutu)) {
			return fail(400, { pesan: 'Pilih penilaian bacaan.' });
		}
		if (balasan.trim().length < 3) {
			return fail(400, {
				pesan: 'Tuliskan balasan untuk santri. Satu kalimat dari Anda sangat berarti baginya.'
			});
		}

		try {
			await balasSetoran(locals.db, {
				setoranId,
				ustadzUserId: user.id,
				mutu: mutu as 'lancar' | 'cukup' | 'belum',
				balasan,
				disetujui
			});
		} catch (err) {
			if (err instanceof Error && err.message === 'BUKAN_MUSYRIF_SETORAN_INI') {
				return fail(403, { pesan: 'Setoran ini bukan dari halaqah Anda.' });
			}
			if (err instanceof Error && err.message === 'BALASAN_KOSONG') {
				return fail(400, { pesan: 'Balasan tidak boleh kosong.' });
			}
			throw err;
		}

		return { sukses: true };
	}
};
