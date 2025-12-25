import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPendingSubmissions, getAllStudentsProgress, getSantriChecklist, getSantriStats, getDailySeries } from '$lib/server/progress';
import { ensureOrgSchema, getOrgScope, getOrganizationById } from '$lib/server/organizations';
import type { D1Database } from '@cloudflare/workers-types';
import { SURAH_DATA } from '$lib/surah-data';

const fetchSurahs = async (db: D1Database) => {
	// Coba beberapa variasi kolom agar tidak error jika skema lama berbeda (prioritas pakai "nama","total_ayat")
	const queries = [
		'SELECT number, nama as name, total_ayat as total_ayah FROM surah ORDER BY number',
		'SELECT number, name as name, COALESCE(total_ayah, totalAyat, total_ayat) as total_ayah FROM surah ORDER BY number'
	];
	for (const q of queries) {
		try {
			const { results } = await db
				.prepare(q)
				.all<{ number: number; name: string; total_ayah: number }>();
			const rows = (results ?? []).filter((r) => r.number != null);
			if (rows.length) return rows as { number: number; name: string; total_ayah: number }[];
		} catch (err) {
			// lanjut ke query berikutnya
		}
	}
	// fallback ke SURAH_DATA jika tabel tidak lengkap
	return SURAH_DATA.map((s) => ({
		number: s.number,
		name: s.name,
		total_ayah: s.totalAyah
	}));
};

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	const db = locals.db!;
	const role = locals.user.role;
	const { orgId, isSystemAdmin } = getOrgScope(locals.user);
	const scopedOrgId = isSystemAdmin ? null : orgId;
	const orgProfile = orgId ? await getOrganizationById(db, orgId) : null;

	// Load data based on user role
	if (role === 'admin') {
		// Admin: list all users + santri & surah options
		const baseQuery = 'SELECT id, username, email, role, created_at FROM users';
		const { results } = await (scopedOrgId
			? db.prepare(`${baseQuery} WHERE org_id = ? ORDER BY created_at DESC`).bind(scopedOrgId)
			: db.prepare(`${baseQuery} ORDER BY created_at DESC`)
		).all<{ id: string; username: string | null; email: string; role: string; created_at: string }>();

		const surahs = await fetchSurahs(db);
		let orgs: Array<{
			id: string;
			type: string;
			name: string;
			slug: string;
			status: string;
			createdAt: number;
		}> = [];
		if (isSystemAdmin) {
			await ensureOrgSchema(db);
			const { results } = await db
				.prepare(
					`SELECT id, type, name, slug, status, created_at as createdAt
					 FROM organizations
					 ORDER BY created_at DESC`
				)
				.all();
			orgs = (results ?? []) as typeof orgs;
		}
		return {
			role,
			currentUser: locals.user,
			org: orgProfile,
			users: (results ?? []) as {
				id: string;
				username: string | null;
				email: string;
				role: string;
				created_at: string;
			}[],
			surahs,
			orgs,
			students: await getAllStudentsProgress(db, scopedOrgId),
			pending: await getPendingSubmissions(db, scopedOrgId)
		};
	} else if (role === 'ustadz' || role === 'ustadzah') {
		// Ustadz: pending submissions and student progress
		const surahs = await fetchSurahs(db);
		return {
			role,
			currentUser: locals.user,
			org: orgProfile,
			pending: await getPendingSubmissions(db, scopedOrgId),
			students: await getAllStudentsProgress(db, scopedOrgId),
			surahs
		};
	} else if (role === 'santri' || role === 'alumni') {
		// Santri/Alumni: personal progress and checklist
		const checklist = await getSantriChecklist(db, locals.user.id);
		const stats = await getSantriStats(db, locals.user.id);
		const series = await getDailySeries(db, locals.user.id, 7);

		const totalAyah = checklist.reduce((sum, row) => sum + row.totalAyah, 0);
		const percentage = totalAyah ? (stats.approved / totalAyah) * 100 : 0;

		return {
			role,
			currentUser: locals.user,
			org: orgProfile,
			checklist,
			stats,
			series,
			percentage: Math.round(percentage * 100) / 100,
			totalAyah: stats.approved // approved ayat count
		};
	}
	// Role lainnya: tetap izinkan masuk dengan data kosong
	return {
		role,
		currentUser: locals.user,
		org: orgProfile,
		checklist: [],
		stats: { approved: 0, submitted: 0, todayApproved: 0 },
		series: [],
		percentage: 0,
		totalAyah: 0
	};
};
