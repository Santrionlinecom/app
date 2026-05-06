import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	assertCanAccessRaporSantri,
	getDaftarSantriForRapor,
	getKategoriByOrg,
	getPencapaianBySantri,
	normalizeHafalanStatus,
	seedHafalanDefault,
	upsertPencapaian
} from '$lib/server/db-hafalan';
import { SEED_HAFALAN_DEFAULT } from '$lib/server/seed-hafalan-default';
import { requireTpqAcademicContext } from '$lib/server/tpq-academic';

const INPUT_ROLES = new Set(['admin', 'koordinator', 'ustadz', 'ustadzah', 'super_admin']);

const loadKategori = async (db: App.Locals['db'], orgId: string) => {
	if (!db) return [];
	let rows = await getKategoriByOrg(db, orgId);
	if (rows.length === 0) {
		await seedHafalanDefault(db, orgId, SEED_HAFALAN_DEFAULT);
		rows = await getKategoriByOrg(db, orgId);
	}
	return rows;
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const { db, user, institutionId, role } = await requireTpqAcademicContext(locals);
	if (!INPUT_ROLES.has(role)) {
		throw redirect(302, '/dashboard/rapor-hafalan');
	}

	const santriId = (url.searchParams.get('santri_id') ?? '').trim();
	const daftarSantri = await getDaftarSantriForRapor(db, {
		orgId: institutionId,
		userId: user.id,
		role
	});
	const selectedSantri =
		santriId && daftarSantri.some((santri) => santri.id === santriId) ? santriId : '';

	const rows = await loadKategori(db, institutionId);
	const pencapaian = selectedSantri ? await getPencapaianBySantri(db, selectedSantri) : [];

	return {
		daftarSantri,
		rows,
		pencapaian,
		santriId: selectedSantri,
		role
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, locals }) => {
		const { db, user, institutionId, role } = await requireTpqAcademicContext(locals);
		if (!INPUT_ROLES.has(role)) {
			return fail(403, { error: 'Akses ditolak.' });
		}

		const data = await request.formData();
		const santriId = `${data.get('santri_id') ?? ''}`.trim();
		const itemId = Number.parseInt(`${data.get('item_id') ?? ''}`, 10);
		const status = normalizeHafalanStatus(data.get('status'));
		const catatan = `${data.get('catatan') ?? ''}`.trim().slice(0, 500);

		if (!santriId || !Number.isInteger(itemId) || itemId <= 0) {
			return fail(400, { error: 'Data rapor tidak lengkap.' });
		}

		try {
			await assertCanAccessRaporSantri(db, {
				user,
				orgId: institutionId,
				santriId,
				write: true
			});
		} catch (err) {
			return fail(403, { error: (err as Error).message });
		}

		const item = await db
			.prepare(
				`SELECT i.id
				 FROM hafalan_item i
				 JOIN hafalan_kategori k ON k.id = i.kategori_id
				 WHERE i.id = ? AND k.org_id = ?`
			)
			.bind(itemId, institutionId)
			.first<{ id: number }>();
		if (!item) {
			throw error(404, 'Item hafalan tidak ditemukan.');
		}

		await upsertPencapaian(db, santriId, itemId, user.id, status, catatan);
		return { success: true };
	}
};
