import { error, fail } from '@sveltejs/kit';
import { generateId } from 'lucia';
import type { Actions, PageServerLoad } from './$types';
import { assertLoggedIn, assertOrgMember, assertOrgRoleAllowed } from '$lib/server/auth/rbac';
import { getOrganizationById } from '$lib/server/organizations';
import { assertPondokAsramaTables } from '$lib/server/domains/pondok/asrama';
import { sanitizePlainText } from '$lib/server/domains/tpq/academic';

const MANAGE_ROLES = new Set(['admin', 'pengasuh', 'musyrif', 'operator', 'SUPER_ADMIN', 'super_admin']);

const requirePondokContext = async (locals: App.Locals) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');
	const orgId = assertOrgMember(user);
	const org = await getOrganizationById(locals.db, orgId);
	if (!org) throw error(404, 'Lembaga tidak ditemukan');
	assertOrgRoleAllowed(org.type, user.role);
	if (org.type !== 'pondok') {
		throw error(403, `Asrama hanya untuk pondok. Lembaga aktif: ${org.type || 'tidak dikenal'}.`);
	}
	await assertPondokAsramaTables(locals.db);
	return { db: locals.db, user, org, orgId };
};

export const load: PageServerLoad = async ({ locals }) => {
	const { db, user, org, orgId } = await requirePondokContext(locals);
	const canManage = MANAGE_ROLES.has(user.role ?? '');

	const { results: rooms } = await db
		.prepare(
			`SELECT a.id, a.name, a.capacity, a.notes, a.created_at as createdAt,
			        COUNT(s.santri_id) as occupied
			 FROM pondok_asrama a
			 LEFT JOIN pondok_asrama_santri s ON s.room_id = a.id
			 WHERE a.organization_id = ?
			 GROUP BY a.id
			 ORDER BY a.name COLLATE NOCASE`
		)
		.bind(orgId)
		.all<{ id: string; name: string; capacity: number; notes: string | null; createdAt: number; occupied: number }>();

	const { results: occupants } = await db
		.prepare(
			`SELECT s.room_id as roomId, s.santri_id as santriId, COALESCE(st.nama, u.username, u.email, s.santri_id) as nama
			 FROM pondok_asrama_santri s
			 LEFT JOIN santri st ON st.id = s.santri_id
			 LEFT JOIN users u ON u.id = s.santri_id
			 WHERE s.organization_id = ?
			 ORDER BY nama COLLATE NOCASE`
		)
		.bind(orgId)
		.all<{ roomId: string; santriId: string; nama: string }>();

	const { results: unassigned } = await db
		.prepare(
			`SELECT st.id, st.nama
			 FROM santri st
			 WHERE st.lembaga_id = ? AND st.is_aktif = 1
			   AND st.id NOT IN (SELECT santri_id FROM pondok_asrama_santri WHERE organization_id = ?)
			 ORDER BY st.nama COLLATE NOCASE
			 LIMIT 200`
		)
		.bind(orgId, orgId)
		.all<{ id: string; nama: string }>();

	return {
		org: { id: org.id, name: org.name, type: org.type },
		canManage,
		rooms: rooms ?? [],
		occupants: occupants ?? [],
		unassigned: unassigned ?? []
	};
};

export const actions: Actions = {
	buatKamar: async ({ request, locals }) => {
		const { db, user, orgId } = await requirePondokContext(locals);
		if (!MANAGE_ROLES.has(user.role ?? '')) {
			return fail(403, { error: 'Hanya pengurus pondok yang boleh menambah kamar.' });
		}
		const form = await request.formData();
		const name = sanitizePlainText(`${form.get('name') ?? ''}`, 60);
		const capacity = Number.parseInt(`${form.get('capacity') ?? '4'}`, 10);
		const notes = sanitizePlainText(`${form.get('notes') ?? ''}`, 200) || null;
		if (!name) return fail(400, { error: 'Nama kamar wajib diisi.' });
		if (!Number.isInteger(capacity) || capacity < 1 || capacity > 40) {
			return fail(400, { error: 'Kapasitas kamar 1–40 santri.' });
		}
		await db
			.prepare(
				`INSERT INTO pondok_asrama (id, organization_id, name, capacity, notes, created_at)
				 VALUES (?, ?, ?, ?, ?, ?)`
			)
			.bind(generateId(15), orgId, name, capacity, notes, Date.now())
			.run();
		return { ok: true };
	},
	tempatkan: async ({ request, locals }) => {
		const { db, user, orgId } = await requirePondokContext(locals);
		if (!MANAGE_ROLES.has(user.role ?? '')) {
			return fail(403, { error: 'Hanya pengurus pondok yang boleh menempatkan santri.' });
		}
		const form = await request.formData();
		const roomId = `${form.get('room_id') ?? ''}`.trim();
		const santriId = `${form.get('santri_id') ?? ''}`.trim();
		if (!roomId || !santriId) return fail(400, { error: 'Kamar dan santri wajib dipilih.' });

		const room = await db
			.prepare(
				`SELECT a.id, a.capacity, COUNT(s.santri_id) as occupied
				 FROM pondok_asrama a
				 LEFT JOIN pondok_asrama_santri s ON s.room_id = a.id
				 WHERE a.id = ? AND a.organization_id = ?
				 GROUP BY a.id`
			)
			.bind(roomId, orgId)
			.first<{ id: string; capacity: number; occupied: number }>();
		if (!room) return fail(404, { error: 'Kamar tidak ditemukan.' });
		if (room.occupied >= room.capacity) return fail(400, { error: 'Kamar sudah penuh.' });

		const santri = await db
			.prepare('SELECT id FROM santri WHERE id = ? AND lembaga_id = ?')
			.bind(santriId, orgId)
			.first<{ id: string }>();
		if (!santri) return fail(404, { error: 'Santri tidak ditemukan di pondok ini.' });

		await db
			.prepare(
				`INSERT INTO pondok_asrama_santri (organization_id, room_id, santri_id, assigned_at)
				 VALUES (?, ?, ?, ?)
				 ON CONFLICT(organization_id, santri_id) DO UPDATE SET room_id = excluded.room_id, assigned_at = excluded.assigned_at`
			)
			.bind(orgId, roomId, santriId, Date.now())
			.run();
		return { ok: true };
	},
	keluarkan: async ({ request, locals }) => {
		const { db, user, orgId } = await requirePondokContext(locals);
		if (!MANAGE_ROLES.has(user.role ?? '')) {
			return fail(403, { error: 'Hanya pengurus pondok yang boleh mengeluarkan santri dari kamar.' });
		}
		const form = await request.formData();
		const santriId = `${form.get('santri_id') ?? ''}`.trim();
		if (!santriId) return fail(400, { error: 'Santri wajib dipilih.' });
		await db
			.prepare('DELETE FROM pondok_asrama_santri WHERE organization_id = ? AND santri_id = ?')
			.bind(orgId, santriId)
			.run();
		return { ok: true };
	}
};
