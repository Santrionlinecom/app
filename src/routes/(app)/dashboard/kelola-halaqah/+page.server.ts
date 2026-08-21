// src/routes/(app)/dashboard/kelola-halaqah/+page.server.ts
// Pengurus lembaga: buat halaqah & atur anggotanya.
//
// Gerbang: harus punya izin 'hafalan.input' (ustadz/admin lembaga), dan
// setiap halaqah yang disentuh WAJIB milik lembaga pengguna — supaya
// pengurus TPQ A tidak bisa mengubah halaqah TPQ B.
import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { assertLoggedIn, assertOrgMember, canAccessPermission } from '$lib/server/auth/rbac';
import { tambahAnggota, bersihkanTeks } from '$lib/server/halaqah/service';

const PESAN_GAGAL: Record<string, string> = {
	penuh: 'Halaqah sudah penuh. Naikkan kapasitas atau buat halaqah baru.',
	sudah_anggota: 'Santri tersebut sudah menjadi anggota halaqah ini.',
	halaqah_tidak_ada: 'Halaqah tidak ditemukan.'
};

/** Gerbang bersama: pengguna berhak mengelola halaqah lembaga ini. */
function assertBolehKelola(locals: App.Locals) {
	const user = assertLoggedIn({ locals });
	const orgId = assertOrgMember(user);
	if (!canAccessPermission(user.role, 'hafalan.input')) {
		throw error(403, 'Anda tidak berwenang mengelola halaqah.');
	}
	return { user, orgId };
}

/** Memastikan halaqah benar-benar milik lembaga ini. */
async function assertHalaqahMilikLembaga(
	db: App.Locals['db'],
	halaqohId: string,
	orgId: string
): Promise<void> {
	const row = await db!
		.prepare(`SELECT id FROM tpq_halaqoh WHERE id = ? AND institution_id = ? LIMIT 1`)
		.bind(halaqohId, orgId)
		.first<{ id: string }>();
	if (!row) throw error(404, 'Halaqah tidak ditemukan');
}

export const load: PageServerLoad = async ({ locals }) => {
	const { orgId } = assertBolehKelola(locals);
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

	const [halaqahRes, santriRes] = await Promise.all([
		locals.db
			.prepare(
				`SELECT h.id, h.name AS nama, h.kapasitas,
				        COALESCE(u.username, u.email) AS ustadz_nama,
				        (SELECT COUNT(*) FROM halaqah_anggota ha
				          WHERE ha.halaqoh_id = h.id AND ha.status = 'aktif') AS jumlah
				   FROM tpq_halaqoh h
				   LEFT JOIN users u ON u.id = h.ustadz_user_id
				  WHERE h.institution_id = ?
				  ORDER BY h.name`
			)
			.bind(orgId)
			.all<{ id: string; nama: string; kapasitas: number; ustadz_nama: string | null; jumlah: number }>(),
		locals.db
			.prepare(
				`SELECT om.user_id, COALESCE(u.username, u.email) AS nama
				   FROM organization_memberships om
				   JOIN users u ON u.id = om.user_id
				  WHERE om.org_id = ? AND om.role = 'santri' AND om.is_active = 1
				  ORDER BY nama LIMIT 200`
			)
			.bind(orgId)
			.all<{ user_id: string; nama: string }>()
	]);

	const halaqah = halaqahRes.results ?? [];

	// Anggota tiap halaqah, supaya pengurus melihat isinya langsung.
	const anggotaPerHalaqah: Record<string, { userId: string; nama: string }[]> = {};
	for (const h of halaqah) {
		const { results } = await locals.db
			.prepare(
				`SELECT ha.santri_user_id, COALESCE(u.username, u.email) AS nama
				   FROM halaqah_anggota ha
				   JOIN users u ON u.id = ha.santri_user_id
				  WHERE ha.halaqoh_id = ? AND ha.status = 'aktif'
				  ORDER BY nama`
			)
			.bind(h.id)
			.all<{ santri_user_id: string; nama: string }>();
		anggotaPerHalaqah[h.id] = (results ?? []).map((r) => ({
			userId: r.santri_user_id,
			nama: r.nama
		}));
	}

	return { halaqah, santri: santriRes.results ?? [], anggotaPerHalaqah };
};

export const actions: Actions = {
	buatHalaqah: async ({ request, locals }) => {
		const { user, orgId } = assertBolehKelola(locals);
		if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

		const data = await request.formData();
		const nama = bersihkanTeks(data.get('nama'), 80);
		const kapasitas = Number(data.get('kapasitas'));

		if (nama.length < 2) return fail(400, { pesan: 'Tuliskan nama halaqah.' });
		if (!Number.isInteger(kapasitas) || kapasitas < 3 || kapasitas > 30) {
			return fail(400, {
				pesan: 'Kapasitas antara 3 sampai 30. Halaqah sengaja dibatasi agar tetap kecil.'
			});
		}

		await locals.db
			.prepare(
				`INSERT INTO tpq_halaqoh (id, institution_id, name, ustadz_user_id, kapasitas)
				 VALUES (?, ?, ?, ?, ?)`
			)
			.bind(crypto.randomUUID(), orgId, nama, user.id, kapasitas)
			.run();

		return { sukses: 'Halaqah dibuat.' };
	},

	tambahAnggota: async ({ request, locals }) => {
		const { orgId } = assertBolehKelola(locals);
		if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

		const data = await request.formData();
		const halaqohId = String(data.get('halaqohId') ?? '').trim();
		const santriUserId = String(data.get('santriUserId') ?? '').trim();

		if (!halaqohId || !santriUserId) return fail(400, { pesan: 'Pilih halaqah dan santri.' });

		await assertHalaqahMilikLembaga(locals.db, halaqohId, orgId);

		// Santri juga harus anggota lembaga ini.
		const anggotaLembaga = await locals.db
			.prepare(
				`SELECT user_id FROM organization_memberships
				  WHERE org_id = ? AND user_id = ? AND role = 'santri' AND is_active = 1 LIMIT 1`
			)
			.bind(orgId, santriUserId)
			.first<{ user_id: string }>();

		if (!anggotaLembaga) {
			return fail(403, { pesan: 'Santri tersebut bukan anggota aktif lembaga ini.' });
		}

		const hasil = await tambahAnggota(locals.db, halaqohId, santriUserId);
		if (!hasil.ok) return fail(400, { pesan: PESAN_GAGAL[hasil.alasan] ?? 'Gagal menambahkan.' });

		return { sukses: 'Santri ditambahkan ke halaqah.' };
	},

	keluarkanAnggota: async ({ request, locals }) => {
		const { orgId } = assertBolehKelola(locals);
		if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

		const data = await request.formData();
		const halaqohId = String(data.get('halaqohId') ?? '').trim();
		const santriUserId = String(data.get('santriUserId') ?? '').trim();

		await assertHalaqahMilikLembaga(locals.db, halaqohId, orgId);

		// Riwayat tidak dihapus, hanya ditandai keluar.
		await locals.db
			.prepare(
				`UPDATE halaqah_anggota SET status = 'keluar', left_at = unixepoch()
				  WHERE halaqoh_id = ? AND santri_user_id = ?`
			)
			.bind(halaqohId, santriUserId)
			.run();

		return { sukses: 'Santri dikeluarkan dari halaqah.' };
	}
};
