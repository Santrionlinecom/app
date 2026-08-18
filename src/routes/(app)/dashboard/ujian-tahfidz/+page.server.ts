import { error, fail } from '@sveltejs/kit';
import { generateId } from 'lucia';
import type { Actions, PageServerLoad } from './$types';
import { assertFeature, assertLoggedIn, assertOrgMember, isSystemAdmin } from '$lib/server/auth/rbac';
import { getOrganizationById } from '$lib/server/organizations';
import { assertTahfidzUjianTables } from '$lib/server/domains/tpq/ujian';
import { isEducationalOrgType } from '$lib/server/utils';
import { sanitizeOptionalNotes, sanitizePlainText } from '$lib/server/domains/tpq/academic';
import { SURAH_DATA } from '$lib/surah-data';

const requireUjianContext = async (locals: App.Locals) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');
	if (isSystemAdmin(user.role) && !user.orgId) {
		return { db: locals.db, user, org: null, orgId: null as string | null };
	}
	const orgId = assertOrgMember(user);
	const org = await getOrganizationById(locals.db, orgId);
	if (!org) throw error(404, 'Lembaga tidak ditemukan');
	if (!isEducationalOrgType(org.type)) {
		throw error(403, `Ujian tahfidz hanya untuk lembaga pendidikan. Lembaga aktif: ${org.type}.`);
	}
	assertFeature(org.type, user.role, 'ujian');
	await assertTahfidzUjianTables(locals.db);
	return { db: locals.db, user, org, orgId };
};

export const load: PageServerLoad = async ({ locals }) => {
	const ctx = await requireUjianContext(locals);
	if (!ctx.org || !ctx.orgId) {
		return {
			org: null,
			exams: [],
			santri: [],
			surahOptions: SURAH_DATA.slice(0, 20).map((s) => ({ number: s.number, name: s.name })),
			canWrite: false,
			note: 'Pilih/impersonate lembaga dulu untuk data ujian per lembaga.'
		};
	}

	const { results: exams } = await ctx.db
		.prepare(
			`SELECT u.id, u.judul, u.surah, u.ayat_from as ayatFrom, u.ayat_to as ayatTo, u.nilai,
			        u.catatan, u.created_at as createdAt,
			        COALESCE(st.nama, usr.username, usr.email, u.santri_id) as santriNama
			 FROM tahfidz_ujian u
			 LEFT JOIN santri st ON st.id = u.santri_id
			 LEFT JOIN users usr ON usr.id = u.santri_id
			 WHERE u.organization_id = ?
			 ORDER BY u.created_at DESC
			 LIMIT 50`
		)
		.bind(ctx.orgId)
		.all();

	const { results: santri } = await ctx.db
		.prepare(
			`SELECT id, nama FROM santri WHERE lembaga_id = ? AND is_aktif = 1 ORDER BY nama COLLATE NOCASE LIMIT 200`
		)
		.bind(ctx.orgId)
		.all<{ id: string; nama: string }>();

	return {
		org: { id: ctx.org.id, name: ctx.org.name, type: ctx.org.type },
		exams: exams ?? [],
		santri: santri ?? [],
		surahOptions: SURAH_DATA.map((s) => ({ number: s.number, name: s.name })),
		canWrite: Boolean(ctx.user.role && ['admin', 'kepala', 'kepala_tpq', 'kepala_tahfidz', 'pengasuh', 'musyrif', 'ustadz', 'ustadzah', 'SUPER_ADMIN', 'super_admin'].includes(ctx.user.role)),
		note: null
	};
};

export const actions: Actions = {
	catat: async ({ request, locals }) => {
		const ctx = await requireUjianContext(locals);
		if (!ctx.orgId) return fail(403, { error: 'Pilih lembaga dulu.' });
		if (!['admin', 'kepala', 'kepala_tpq', 'kepala_tahfidz', 'pengasuh', 'musyrif', 'ustadz', 'ustadzah', 'SUPER_ADMIN', 'super_admin'].includes(ctx.user.role ?? '')) {
			return fail(403, { error: 'Anda tidak boleh mencatat ujian.' });
		}
		const form = await request.formData();
		const santriId = `${form.get('santri_id') ?? ''}`.trim();
		const judul = sanitizePlainText(`${form.get('judul') ?? ''}`, 80) || 'Ujian tahfidz';
		const surahRaw = Number.parseInt(`${form.get('surah') ?? ''}`, 10);
		const ayatFrom = Number.parseInt(`${form.get('ayat_from') ?? ''}`, 10);
		const ayatTo = Number.parseInt(`${form.get('ayat_to') ?? ''}`, 10);
		const nilai = Number.parseInt(`${form.get('nilai') ?? ''}`, 10);
		const catatan = sanitizeOptionalNotes(`${form.get('catatan') ?? ''}`, 400);

		if (!santriId) return fail(400, { error: 'Santri wajib dipilih.' });
		const surah = SURAH_DATA.find((s) => s.number === surahRaw);
		if (!surah) return fail(400, { error: 'Surah tidak valid.' });
		if (!Number.isInteger(ayatFrom) || !Number.isInteger(ayatTo) || ayatFrom < 1 || ayatTo < ayatFrom || ayatTo > surah.totalAyah) {
			return fail(400, { error: `Rentang ayat tidak valid untuk ${surah.name}.` });
		}
		if (!Number.isInteger(nilai) || nilai < 0 || nilai > 100) {
			return fail(400, { error: 'Nilai harus 0–100.' });
		}

		const santri = await ctx.db
			.prepare('SELECT id FROM santri WHERE id = ? AND lembaga_id = ?')
			.bind(santriId, ctx.orgId)
			.first<{ id: string }>();
		if (!santri) return fail(404, { error: 'Santri tidak ditemukan di lembaga ini.' });

		await ctx.db
			.prepare(
				`INSERT INTO tahfidz_ujian
					(id, organization_id, santri_id, judul, surah, ayat_from, ayat_to, nilai, catatan, created_by, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				generateId(15),
				ctx.orgId,
				santriId,
				judul,
				`${surah.number}`,
				ayatFrom,
				ayatTo,
				nilai,
				catatan,
				ctx.user.id,
				Date.now()
			)
			.run();
		return { ok: true };
	}
};
