import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPendingSubmissions, getAllStudentsProgress, getSantriChecklist, getSantriStats, getDailySeries } from '$lib/server/progress';
import { getOrgScope, getOrganizationById } from '$lib/server/organizations';
import type { D1Database } from '@cloudflare/workers-types';
import { SURAH_DATA } from '$lib/surah-data';
import { getOrgFinanceSummary } from '$lib/server/ummah';
import { isCommunityOrgType, isEducationalOrgType } from '$lib/server/utils';

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

const toISODate = (value: Date) => value.toISOString().slice(0, 10);

const fetchKasWeeklyIn = async (db: D1Database, orgId: string) => {
	const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
	const { results } = await db
		.prepare(
			`SELECT SUM(nominal) as totalNominal
			 FROM kas_masjid
			 WHERE organization_id = ? AND tipe = 'masuk' AND tanggal >= ?`
		)
		.bind(orgId, weekStart)
		.all<{ totalNominal: number | null }>();
	return results?.[0]?.totalNominal ?? 0;
};

type CommunityScheduleItem = {
	id: string;
	title: string;
	content: string | null;
	eventDate: string;
	createdAt: number;
};

const fetchCommunitySchedule = async (
	db: D1Database,
	user: { id: string; role: string },
	orgId: string | null,
	isSystemAdmin: boolean
) => {
	const start = new Date();
	const end = new Date();
	end.setDate(end.getDate() + 14);
	const startDate = toISODate(start);
	const endDate = toISODate(end);

	const baseSelect = `SELECT cn.id,
		cn.title,
		cn.content,
		cn.event_date as eventDate,
		cn.created_at as createdAt
	FROM calendar_notes cn`;
	const conditions = ['cn.event_date BETWEEN ? AND ?'];
	const params: (string | number)[] = [startDate, endDate];

	let query = `${baseSelect} WHERE ${conditions.join(' AND ')}`;
	if (user.role === 'admin' && !isSystemAdmin && orgId) {
		query = `${baseSelect} JOIN users u ON u.id = cn.user_id WHERE ${conditions.join(' AND ')} AND u.org_id = ?`;
		params.push(orgId);
	} else if (user.role !== 'admin') {
		query = `${baseSelect} WHERE ${conditions.join(' AND ')} AND cn.user_id = ?`;
		params.push(user.id);
	}

	const { results } = await db
		.prepare(`${query} ORDER BY cn.event_date ASC, cn.created_at ASC LIMIT 5`)
		.bind(...params)
		.all<CommunityScheduleItem>();

	return results ?? [];
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
	const orgType = orgProfile?.type ?? null;
	const isEducationalOrg = isEducationalOrgType(orgType);
	const isCommunityOrg = isCommunityOrgType(orgType);
	const isCommunityMember = isCommunityOrg || role === 'jamaah';

	const loadCommunityWidgets = async () => {
		if (!isCommunityMember || !orgId) {
			return { finance: null, kasWeeklyIn: 0, communitySchedule: [] as CommunityScheduleItem[] };
		}
		try {
			const [finance, kasWeeklyIn, communitySchedule] = await Promise.all([
				getOrgFinanceSummary(db, orgId),
				fetchKasWeeklyIn(db, orgId),
				fetchCommunitySchedule(db, locals.user, orgId, isSystemAdmin)
			]);
			return { finance, kasWeeklyIn, communitySchedule };
		} catch (err) {
			console.error('dashboard community widgets error', err);
			return { finance: null, kasWeeklyIn: 0, communitySchedule: [] as CommunityScheduleItem[] };
		}
	};

	// Load data based on user role
	if (role === 'admin' || role === 'SUPER_ADMIN') {
		// Admin: list all users + santri & surah options
		const baseQuery = 'SELECT id, username, email, role, created_at FROM users';
		const { results } = await (scopedOrgId
			? db.prepare(`${baseQuery} WHERE org_id = ? ORDER BY created_at DESC`).bind(scopedOrgId)
			: db.prepare(`${baseQuery} ORDER BY created_at DESC`)
		).all<{ id: string; username: string | null; email: string; role: string; created_at: string }>();

		let orgs: Array<{
			id: string;
			type: string;
			name: string;
			slug: string;
			status: string;
			createdAt: number;
		}> = [];
		if (role === 'SUPER_ADMIN') {
			const { results: orgResults } = await db
				.prepare(
					`SELECT id, type, name, slug, status, created_at as createdAt
					 FROM organizations
					 ORDER BY created_at DESC`
				)
				.all();
			orgs = (orgResults ?? []) as typeof orgs;
		}

		const basePayload = {
			role,
			currentUser: locals.user,
			org: orgProfile,
			isEducationalOrg,
			isCommunityOrg,
			users: (results ?? []) as {
				id: string;
				username: string | null;
				email: string;
				role: string;
				created_at: string;
			}[]
		};

		if (isCommunityOrg) {
			const communityWidgets = await loadCommunityWidgets();
			return {
				...basePayload,
				orgs,
				...communityWidgets
			};
		}

		const surahs = await fetchSurahs(db);
		return {
			...basePayload,
			surahs,
			orgs,
			students: await getAllStudentsProgress(db, scopedOrgId),
			pending: await getPendingSubmissions(db, scopedOrgId)
		};
	} else if (role === 'ustadz' || role === 'ustadzah') {
		// Ustadz: pending submissions and student progress
		if (isCommunityOrg) {
			const communityWidgets = await loadCommunityWidgets();
			return {
				role,
				currentUser: locals.user,
				org: orgProfile,
				isEducationalOrg,
				isCommunityOrg,
				...communityWidgets
			};
		}

		const surahs = await fetchSurahs(db);
		return {
			role,
			currentUser: locals.user,
			org: orgProfile,
			isEducationalOrg,
			isCommunityOrg,
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
			isEducationalOrg,
			isCommunityOrg,
			checklist,
			stats,
			series,
			percentage: Math.round(percentage * 100) / 100,
			totalAyah: stats.approved // approved ayat count
		};
	}
	// Role lainnya: tetap izinkan masuk dengan data kosong
	const communityWidgets = isCommunityMember
		? await loadCommunityWidgets()
		: { finance: null, kasWeeklyIn: 0, communitySchedule: [] };
	return {
		role,
		currentUser: locals.user,
		org: orgProfile,
		isEducationalOrg,
		isCommunityOrg,
		checklist: [],
		stats: { approved: 0, submitted: 0, todayApproved: 0 },
		series: [],
		percentage: 0,
		totalAyah: 0,
		...communityWidgets
	};
};
