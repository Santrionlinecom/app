// src/routes/(app)/lembaga/undangan-wali/+page.server.ts
// Lembaga menerbitkan kode undangan wali untuk santrinya.
//
// Gerbang berlapis:
// 1. Harus login.
// 2. Harus terhubung ke lembaga (assertOrgMember).
// 3. Santri yang diundangkan WAJIB anggota lembaga yang sama —
//    supaya pengurus TPQ A tidak bisa menerbitkan kode untuk santri TPQ B.
import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { assertLoggedIn, assertOrgMember } from '$lib/server/auth/rbac';
import { terbitkanUndangan, type Hubungan } from '$lib/server/wali/service';

const HUBUNGAN_SAH: Hubungan[] = ['ayah', 'ibu', 'wali'];

export const load: PageServerLoad = async ({ locals }) => {
	const user = assertLoggedIn({ locals });
	const orgId = assertOrgMember(user);
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

	const { results } = await locals.db
		.prepare(
			`SELECT om.user_id, COALESCE(u.username, u.email) AS nama
			   FROM organization_memberships om
			   JOIN users u ON u.id = om.user_id
			  WHERE om.org_id = ? AND om.role = 'santri' AND om.is_active = 1
			  ORDER BY nama
			  LIMIT 200`
		)
		.bind(orgId)
		.all<{ user_id: string; nama: string }>();

	return { santri: results ?? [] };
};

export const actions: Actions = {
	terbitkan: async ({ request, locals }) => {
		const user = assertLoggedIn({ locals });
		const orgId = assertOrgMember(user);
		if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

		const data = await request.formData();
		const santriUserId = String(data.get('santriUserId') ?? '').trim();
		const hubungan = String(data.get('hubungan') ?? '') as Hubungan;

		if (!santriUserId) return fail(400, { pesan: 'Pilih santri lebih dulu.' });
		if (!HUBUNGAN_SAH.includes(hubungan)) {
			return fail(400, { pesan: 'Pilih hubungan wali yang sah.' });
		}

		// Gerbang inti: santri harus benar-benar anggota lembaga ini.
		const anggota = await locals.db
			.prepare(
				`SELECT user_id FROM organization_memberships
				  WHERE org_id = ? AND user_id = ? AND role = 'santri' AND is_active = 1
				  LIMIT 1`
			)
			.bind(orgId, santriUserId)
			.first<{ user_id: string }>();

		if (!anggota) {
			return fail(403, { pesan: 'Santri tersebut bukan anggota aktif lembaga ini.' });
		}

		const { kode, expiresAt } = await terbitkanUndangan(locals.db, {
			santriUserId,
			diterbitkanOleh: user.id,
			hubungan,
			lembagaId: orgId
		});

		return { kode, expiresAt };
	}
};
