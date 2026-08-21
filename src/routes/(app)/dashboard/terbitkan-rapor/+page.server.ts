// src/routes/(app)/dashboard/terbitkan-rapor/+page.server.ts
// Pengurus lembaga menerbitkan rapor untuk santrinya.
//
// Gerbang: izin 'raport.write' + santri wajib anggota lembaga ini.
// Rapor terbit dalam keadaan PRIVAT; yang memutuskan publik adalah santri.
import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { assertLoggedIn, assertOrgMember, canAccessPermission } from '$lib/server/auth/rbac';
import { terbitkanRapor } from '$lib/server/rapor/service';
import { bersihkanTeks } from '$lib/server/halaqah/service';

const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

function assertBolehTerbit(locals: App.Locals) {
	const user = assertLoggedIn({ locals });
	const orgId = assertOrgMember(user);
	if (!canAccessPermission(user.role, 'raport.write')) {
		throw error(403, 'Anda tidak berwenang menerbitkan rapor.');
	}
	return { user, orgId };
}

export const load: PageServerLoad = async ({ locals }) => {
	const { orgId } = assertBolehTerbit(locals);
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

	const [santriRes, raporRes] = await Promise.all([
		locals.db
			.prepare(
				`SELECT om.user_id, COALESCE(u.username, u.email) AS nama
				   FROM organization_memberships om
				   JOIN users u ON u.id = om.user_id
				  WHERE om.org_id = ? AND om.role = 'santri' AND om.is_active = 1
				  ORDER BY nama LIMIT 200`
			)
			.bind(orgId)
			.all<{ user_id: string; nama: string }>(),
		locals.db
			.prepare(
				`SELECT c.id, c.title, c.slug, c.issued_at, c.is_public, c.dicabut_at,
				        COALESCE(u.username, u.email) AS santri_nama
				   FROM certificates c
				   LEFT JOIN users u ON u.id = c.santri_id
				  WHERE c.org_id = ? AND c.jenis = 'rapor'
				  ORDER BY c.issued_at DESC LIMIT 50`
			)
			.bind(orgId)
			.all<{
				id: string;
				title: string;
				slug: string | null;
				issued_at: string;
				is_public: number;
				dicabut_at: number | null;
				santri_nama: string;
			}>()
	]);

	return { santri: santriRes.results ?? [], rapor: raporRes.results ?? [] };
};

export const actions: Actions = {
	terbitkan: async ({ request, locals }) => {
		const { user, orgId } = assertBolehTerbit(locals);
		if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

		const data = await request.formData();
		const santriUserId = String(data.get('santriUserId') ?? '').trim();
		const judul = bersihkanTeks(data.get('judul'), 120);
		const mulai = String(data.get('mulai') ?? '').trim();
		const selesai = String(data.get('selesai') ?? '').trim();
		const catatan = bersihkanTeks(data.get('catatan'), 1000);

		if (!santriUserId) return fail(400, { pesan: 'Pilih santri.' });
		if (judul.length < 3) return fail(400, { pesan: 'Tuliskan judul rapor.' });
		if (!POLA_TANGGAL.test(mulai) || !POLA_TANGGAL.test(selesai)) {
			return fail(400, { pesan: 'Tanggal periode belum lengkap.' });
		}
		if (mulai > selesai) {
			return fail(400, { pesan: 'Tanggal mulai tidak boleh melewati tanggal selesai.' });
		}

		// Santri wajib anggota lembaga ini.
		const anggota = await locals.db
			.prepare(
				`SELECT om.user_id, COALESCE(u.username, u.email) AS nama
				   FROM organization_memberships om
				   JOIN users u ON u.id = om.user_id
				  WHERE om.org_id = ? AND om.user_id = ? AND om.role = 'santri' AND om.is_active = 1
				  LIMIT 1`
			)
			.bind(orgId, santriUserId)
			.first<{ user_id: string; nama: string }>();

		if (!anggota) return fail(403, { pesan: 'Santri tersebut bukan anggota aktif lembaga ini.' });

		const org = await locals.db
			.prepare(`SELECT slug FROM organizations WHERE id = ? LIMIT 1`)
			.bind(orgId)
			.first<{ slug: string | null }>();

		const { slug } = await terbitkanRapor(locals.db, {
			santriUserId,
			orgId,
			orgSlug: org?.slug ?? null,
			santriNama: anggota.nama,
			judul,
			mulai,
			selesai,
			catatan,
			diterbitkanOleh: user.id
		});

		return {
			sukses: `Rapor diterbitkan (masih privat). Tautan: /s/${slug}`,
			slug
		};
	}
};
