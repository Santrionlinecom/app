import { fail, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { SURAH_DATA } from '$lib/surah-data';
import { ensureHafalanSurahChecksTable } from '$lib/server/hafalan';
import { assertFeature, assertLoggedIn, assertOrgMember } from '$lib/server/auth/rbac';
import { getOrganizationById } from '$lib/server/organizations';

const allowedRoles = [
	'admin',
	'ustadz',
	'ustadzah',
	'alumni',
	'SUPER_ADMIN',
	'santri',
	'jamaah',
	'tamir',
	'bendahara'
];
const TOTAL_AYAH = SURAH_DATA.reduce((sum, s) => sum + s.totalAyah, 0);

const assertAllowed = async (locals: App.Locals) => {
	const user = assertLoggedIn({ locals });
	if (!allowedRoles.includes(user.role)) {
		throw error(403, 'Fitur ini tersedia untuk semua akun.');
	}
	if (!locals.db) throw error(500, 'Database tidak tersedia');
	const orgId = assertOrgMember(user);
	const org = await getOrganizationById(locals.db, orgId);
	if (!org) throw error(404, 'Lembaga tidak ditemukan');
	assertFeature(org.type, user.role, 'hafalan');
};

export const load: PageServerLoad = async ({ locals }) => {
	await assertAllowed(locals);
	const db = locals.db!;
	const user = locals.user!;

	const { results: progress } = await db.prepare(`
		SELECT surah_number, ayah_number, status, quality_status, notes, reviewed_at
		FROM hafalan_progress
		WHERE user_id = ? AND status IN ('setor', 'disetujui')
		ORDER BY surah_number, ayah_number
	`).bind(user.id).all();

	const { results: muroja } = await db.prepare(`
		SELECT * FROM muroja_tracking
		WHERE user_id = ?
		ORDER BY muroja_date DESC
		LIMIT 30
	`).bind(user.id).all();

	let checkedSurahs: { surah_number: number }[] = [];
	try {
		const { results } =
			(await db
				.prepare('SELECT surah_number FROM hafalan_surah_checks WHERE user_id = ?')
				.bind(user.id)
				.all<{ surah_number: number }>()) ?? {};
		checkedSurahs = results ?? [];
	} catch (err: any) {
		const message = `${err?.message ?? err}`;
		if (!message.includes('no such table: hafalan_surah_checks')) {
			throw err;
		}
	}

	const approvedAyah =
		progress?.filter((p: any) => p.status === 'disetujui')?.length ?? 0;
	const juzEquivalent = (approvedAyah / TOTAL_AYAH) * 30;
	const juzSegments = Array.from({ length: 30 }, (_v, idx) => {
		const filled = Math.min(Math.max(juzEquivalent - idx, 0), 1);
		return { index: idx + 1, fill: Math.round(filled * 100) / 100 };
	});

	const stats = {
		total: progress?.length || 0,
		lancar: progress?.filter((p: any) => p.quality_status === 'lancar').length || 0,
		kurangLancar: progress?.filter((p: any) => p.quality_status === 'kurang_lancar').length || 0,
		belumLancar: progress?.filter((p: any) => p.quality_status === 'belum_lancar').length || 0,
		approvedAyah,
		totalAyah: TOTAL_AYAH
	};

	return {
		progress: progress || [],
		muroja: muroja || [],
		stats,
		surahs: SURAH_DATA,
		checkedSurahs: checkedSurahs.map((s: { surah_number: number }) => s.surah_number),
		juzSegments,
		juzEquivalent
	};
};

export const actions: Actions = {
	addMuroja: async ({ request, locals }) => {
		try {
			await assertAllowed(locals);
		} catch (err: any) {
			if (err?.status === 302) throw err;
			return fail(err?.status ?? 500, { error: err?.message ?? 'Tidak diizinkan' });
		}

		const db = locals.db!;
		const user = locals.user!;

		const data = await request.formData();
		const surahNumber = parseInt(data.get('surahNumber') as string);
		const ayahStart = parseInt(data.get('ayahStart') as string);
		const ayahEnd = parseInt(data.get('ayahEnd') as string);
		const quality = data.get('quality') as string;
		const notes = data.get('notes') as string;
		const murojaDate = data.get('murojaDate') as string;

		if (!surahNumber || !ayahStart || !ayahEnd || !quality) {
			return fail(400, { error: 'Data tidak lengkap' });
		}

		const id = crypto.randomUUID();
		await db.prepare(`
			INSERT INTO muroja_tracking (id, user_id, surah_number, ayah_start, ayah_end, quality, notes, muroja_date)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`).bind(id, user.id, surahNumber, ayahStart, ayahEnd, quality, notes || null, murojaDate).run();

		// Tambahkan ke kalender
		const surah = SURAH_DATA.find((s) => s.number === surahNumber);
		await db.prepare(`
			INSERT INTO calendar_notes (id, user_id, role, title, content, event_date, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`).bind(
			crypto.randomUUID(),
			user.id,
			user.role,
			`Muroja'ah ${surah?.name || 'Surah ' + surahNumber}`,
			`Ayat ${ayahStart}-${ayahEnd} | Kualitas: ${quality}${notes ? '\n' + notes : ''}`,
			murojaDate,
			Date.now(),
			Date.now()
		).run();

		return { success: true };
	},

	deleteMuroja: async ({ request, locals }) => {
		try {
			await assertAllowed(locals);
		} catch (err: any) {
			if (err?.status === 302) throw err;
			return fail(err?.status ?? 500, { error: err?.message ?? 'Tidak diizinkan' });
		}

		const db = locals.db!;
		const user = locals.user!;

		const data = await request.formData();
		const id = data.get('id') as string;

		await db.prepare('DELETE FROM muroja_tracking WHERE id = ? AND user_id = ?')
			.bind(id, user.id).run();

		return { success: true };
	},

	toggleSurah: async ({ request, locals }) => {
		try {
			await assertAllowed(locals);
		} catch (err: any) {
			if (err?.status === 302) throw err;
			return fail(err?.status ?? 500, { error: err?.message ?? 'Tidak diizinkan' });
		}

		const db = locals.db!;
		const user = locals.user!;

		const data = await request.formData();
		const surahNumber = parseInt(String(data.get('surahNumber') ?? ''), 10);
		const checked = String(data.get('checked') ?? 'false') === 'true';

		if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
			return fail(400, { error: 'Surah tidak valid' });
		}

		await ensureHafalanSurahChecksTable(db);
		if (checked) {
			await db
				.prepare(
					`INSERT OR REPLACE INTO hafalan_surah_checks (user_id, surah_number, checked_at)
           VALUES (?, ?, ?)`
				)
				.bind(user.id, surahNumber, Date.now())
				.run();
		} else {
			await db
				.prepare('DELETE FROM hafalan_surah_checks WHERE user_id = ? AND surah_number = ?')
				.bind(user.id, surahNumber)
				.run();
		}

		return { success: true };
	}
};
