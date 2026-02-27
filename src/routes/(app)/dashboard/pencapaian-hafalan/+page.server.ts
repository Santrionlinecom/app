import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAllStudentsProgress } from '$lib/server/progress';
import { getOrganizationById } from '$lib/server/organizations';
import { assertFeature, assertLoggedIn, assertOrgMember } from '$lib/server/auth/rbac';
import {
	assertTpqAcademicTables,
	canInputSetoran,
	canReviewSetoran,
	canViewSetoranHistory,
	normalizeAppRole,
	todayIsoDate
} from '$lib/server/tpq-academic';

type RoleScope = 'student' | 'teacher' | 'manager';

type SetoranSummary = {
	total: number;
	submitted: number;
	approved: number;
	rejected: number;
};

type OfficialBySurahRow = {
	surahNumber: number;
	totalAyat: number | null;
	lancar: number | null;
	cukup: number | null;
	belum: number | null;
};

type RecentSetoranRow = {
	id: string;
	date: string;
	surah: string;
	ayatFrom: number;
	ayatTo: number;
	quality: string;
	status: string;
	santriName: string | null;
	ustadzName: string | null;
	halaqohName: string | null;
	createdAt: number;
};

type AttentionRow = {
	id: string;
	date: string;
	surah: string;
	ayatFrom: number;
	ayatTo: number;
	quality: string;
	status: string;
	notes: string | null;
	santriName: string | null;
	ustadzName: string | null;
	reviewedAt: number | null;
	createdAt: number;
};

type StudentProgressRow = {
	id: string;
	email: string;
	username: string | null;
	approvedAyah: number;
	percentage: number;
};

type MurojaStats = {
	totalMuroja: number;
	lancar: number;
	kurangLancar: number;
	belumLancar: number;
};

type MurojaPerSurahRow = {
	surahNumber: number;
	totalMuroja: number;
	lastMuroja: string | null;
};

const STUDENT_ROLES = new Set(['santri', 'alumni']);
const TEACHER_ROLES = new Set(['ustadz', 'ustadzah']);

const isMissingTableError = (err: unknown) =>
	`${(err as Error)?.message ?? err}`.toLowerCase().includes('no such table');

const toSummary = (row?: { total: number | null; submitted: number | null; approved: number | null; rejected: number | null } | null): SetoranSummary => ({
	total: Number(row?.total ?? 0),
	submitted: Number(row?.submitted ?? 0),
	approved: Number(row?.approved ?? 0),
	rejected: Number(row?.rejected ?? 0)
});

export const load: PageServerLoad = async ({ locals }) => {
	const user = assertLoggedIn({ locals });

	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	const orgId = assertOrgMember(user);
	const org = await getOrganizationById(locals.db, orgId);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}
	assertFeature(org.type, user.role, 'hafalan');

	const role = normalizeAppRole(user.role);
	const db = locals.db!;
	const roleScope: RoleScope = STUDENT_ROLES.has(role)
		? 'student'
		: TEACHER_ROLES.has(role)
			? 'teacher'
			: 'manager';

	try {
		await assertTpqAcademicTables(db);

		const scopeConditions = ['s.institution_id = ?'];
		const scopeParams: Array<string | number> = [orgId];

		if (roleScope === 'student') {
			scopeConditions.push('s.santri_user_id = ?');
			scopeParams.push(user.id);
		} else if (roleScope === 'teacher') {
			scopeConditions.push('s.ustadz_user_id = ?');
			scopeParams.push(user.id);
		}

		const scopeWhere = scopeConditions.join(' AND ');
		const today = todayIsoDate();

		const setoranSummaryTotal = await db
			.prepare(
				`
				SELECT
					COUNT(*) as total,
					SUM(CASE WHEN s.status = 'submitted' THEN 1 ELSE 0 END) as submitted,
					SUM(CASE WHEN s.status = 'approved' THEN 1 ELSE 0 END) as approved,
					SUM(CASE WHEN s.status = 'rejected' THEN 1 ELSE 0 END) as rejected
				FROM tpq_setoran s
				WHERE ${scopeWhere}
				`
			)
			.bind(...scopeParams)
			.first<{ total: number | null; submitted: number | null; approved: number | null; rejected: number | null }>();

		const todayConditions = [...scopeConditions, 's.date = ?'];
		const todayParams: Array<string | number> = [...scopeParams, today];
		const setoranSummaryToday = await db
			.prepare(
				`
				SELECT
					COUNT(*) as total,
					SUM(CASE WHEN s.status = 'submitted' THEN 1 ELSE 0 END) as submitted,
					SUM(CASE WHEN s.status = 'approved' THEN 1 ELSE 0 END) as approved,
					SUM(CASE WHEN s.status = 'rejected' THEN 1 ELSE 0 END) as rejected
				FROM tpq_setoran s
				WHERE ${todayConditions.join(' AND ')}
				`
			)
			.bind(...todayParams)
			.first<{ total: number | null; submitted: number | null; approved: number | null; rejected: number | null }>();

		const { results: recentSetoranRaw } = await db
			.prepare(
				`
				SELECT s.id,
					s.date,
					s.surah,
					s.ayat_from as ayatFrom,
					s.ayat_to as ayatTo,
					s.quality,
					s.status,
					COALESCE(us.username, us.email) as santriName,
					COALESCE(ut.username, ut.email) as ustadzName,
					h.name as halaqohName,
					s.created_at as createdAt
				FROM tpq_setoran s
				LEFT JOIN users us ON us.id = s.santri_user_id
				LEFT JOIN users ut ON ut.id = s.ustadz_user_id
				LEFT JOIN tpq_halaqoh h ON h.id = s.halaqoh_id
				WHERE ${scopeWhere}
				ORDER BY s.date DESC, s.created_at DESC
				LIMIT 30
				`
			)
			.bind(...scopeParams)
			.all<RecentSetoranRow>();

		const attentionConditions = [
			...scopeConditions,
			"(s.status IN ('submitted','rejected') OR (s.status = 'approved' AND s.quality = 'belum'))"
		];
		const { results: attentionRaw } = await db
			.prepare(
				`
				SELECT s.id,
					s.date,
					s.surah,
					s.ayat_from as ayatFrom,
					s.ayat_to as ayatTo,
					s.quality,
					s.status,
					s.notes,
					COALESCE(us.username, us.email) as santriName,
					COALESCE(ut.username, ut.email) as ustadzName,
					s.reviewed_at as reviewedAt,
					s.created_at as createdAt
				FROM tpq_setoran s
				LEFT JOIN users us ON us.id = s.santri_user_id
				LEFT JOIN users ut ON ut.id = s.ustadz_user_id
				WHERE ${attentionConditions.join(' AND ')}
				ORDER BY s.date DESC, s.created_at DESC
				LIMIT 120
				`
			)
			.bind(...scopeParams)
			.all<AttentionRow>();

		const { results: officialBySurahRaw } = await db
			.prepare(
				`
				SELECT hp.surah_number as surahNumber,
					COUNT(*) as totalAyat,
					SUM(CASE WHEN hp.quality_status IN ('hijau','lancar') THEN 1 ELSE 0 END) as lancar,
					SUM(CASE WHEN hp.quality_status IN ('kuning','cukup','kurang_lancar') THEN 1 ELSE 0 END) as cukup,
					SUM(CASE WHEN hp.quality_status IN ('merah','belum','belum_lancar') THEN 1 ELSE 0 END) as belum
				FROM hafalan_progress hp
				WHERE hp.user_id = ? AND hp.status = 'disetujui'
				GROUP BY hp.surah_number
				ORDER BY hp.surah_number
				`
			)
			.bind(user.id)
			.all<OfficialBySurahRow>();

		const officialQuality = await db
			.prepare(
				`
				SELECT
					COUNT(*) as totalAyat,
					SUM(CASE WHEN hp.quality_status IN ('hijau','lancar') THEN 1 ELSE 0 END) as lancar,
					SUM(CASE WHEN hp.quality_status IN ('kuning','cukup','kurang_lancar') THEN 1 ELSE 0 END) as cukup,
					SUM(CASE WHEN hp.quality_status IN ('merah','belum','belum_lancar') THEN 1 ELSE 0 END) as belum
				FROM hafalan_progress hp
				WHERE hp.user_id = ? AND hp.status = 'disetujui'
				`
			)
			.bind(user.id)
			.first<{ totalAyat: number | null; lancar: number | null; cukup: number | null; belum: number | null }>();

		let studentProgress: StudentProgressRow[] = [];
		if (roleScope !== 'student') {
			const rows = await getAllStudentsProgress(
				db,
				roleScope === 'teacher' ? { orgId, ustadzId: user.id } : { orgId }
			);
			studentProgress = rows
				.sort((a, b) => b.approvedAyah - a.approvedAyah)
				.slice(0, 200);
		}

		let murojaStats: MurojaStats = {
			totalMuroja: 0,
			lancar: 0,
			kurangLancar: 0,
			belumLancar: 0
		};
		let murojaPerSurah: MurojaPerSurahRow[] = [];

		try {
			const murojaStatsRow = await db
				.prepare(
					`
					SELECT
						COUNT(*) as totalMuroja,
						SUM(CASE WHEN quality = 'lancar' THEN 1 ELSE 0 END) as lancar,
						SUM(CASE WHEN quality = 'kurang_lancar' THEN 1 ELSE 0 END) as kurangLancar,
						SUM(CASE WHEN quality = 'belum_lancar' THEN 1 ELSE 0 END) as belumLancar
					FROM muroja_tracking
					WHERE user_id = ?
					`
				)
				.bind(user.id)
				.first<{
					totalMuroja: number | null;
					lancar: number | null;
					kurangLancar: number | null;
					belumLancar: number | null;
				}>();

			murojaStats = {
				totalMuroja: Number(murojaStatsRow?.totalMuroja ?? 0),
				lancar: Number(murojaStatsRow?.lancar ?? 0),
				kurangLancar: Number(murojaStatsRow?.kurangLancar ?? 0),
				belumLancar: Number(murojaStatsRow?.belumLancar ?? 0)
			};

			const { results: murojaBySurahRaw } = await db
				.prepare(
					`
					SELECT surah_number as surahNumber,
						COUNT(*) as totalMuroja,
						MAX(muroja_date) as lastMuroja
					FROM muroja_tracking
					WHERE user_id = ?
					GROUP BY surah_number
					ORDER BY surah_number
					`
				)
				.bind(user.id)
				.all<MurojaPerSurahRow>();
			murojaPerSurah = (murojaBySurahRaw ?? []) as MurojaPerSurahRow[];
		} catch (murojaErr) {
			if (!isMissingTableError(murojaErr)) {
				throw murojaErr;
			}
		}

		return {
			role,
			roleScope,
			canInputSetoran: canInputSetoran(role),
			canReviewSetoran: canReviewSetoran(role),
			canViewSetoranHistory: canViewSetoranHistory(role),
			summaries: {
				total: toSummary(setoranSummaryTotal),
				today: toSummary(setoranSummaryToday)
			},
			official: {
				bySurah: (officialBySurahRaw ?? []) as OfficialBySurahRow[],
				quality: {
					totalAyat: Number(officialQuality?.totalAyat ?? 0),
					lancar: Number(officialQuality?.lancar ?? 0),
					cukup: Number(officialQuality?.cukup ?? 0),
					belum: Number(officialQuality?.belum ?? 0)
				}
			},
			recentSetoran: (recentSetoranRaw ?? []) as RecentSetoranRow[],
			attentionRows: (attentionRaw ?? []) as AttentionRow[],
			studentProgress,
			murojaStats,
			murojaPerSurah
		};
	} catch (err) {
		console.error('Error loading pencapaian hafalan:', err);
		throw error(500, 'Gagal memuat data pencapaian hafalan');
	}
};
