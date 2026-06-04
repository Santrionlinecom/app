import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOrganizationById } from '$lib/server/organizations';
import { assertLoggedIn, assertOrgMember } from '$lib/server/auth/rbac';
import { requirePermission } from '$lib/rbac/helpers';
import {
	assertTpqAcademicTables,
	canInputSetoran,
	canReviewSetoran,
	canViewSetoranHistory,
	normalizeAppRole
} from '$lib/server/domains/tpq/academic';

type RoleScope = 'student' | 'teacher' | 'manager';

type AlertSummary = {
	merah: number;
	kuning: number;
	pending: number;
	total: number;
};

type AlertRow = {
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
	halaqohName: string | null;
	reviewedAt: number | null;
	createdAt: number;
};

export const load: PageServerLoad = async ({ locals }) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');
	requirePermission(locals, 'hafalan.read');

	const orgId = assertOrgMember(user);
	const org = await getOrganizationById(locals.db, orgId);
	if (!org) throw error(404, 'Lembaga tidak ditemukan');

	const db = locals.db!;
	const role = normalizeAppRole(user.role);
	const roleScope: RoleScope = !locals.can('hafalan.input')
		? 'student'
		: !locals.can('hafalan.review')
			? 'teacher'
			: 'manager';

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

	const alertConditions = [
		...scopeConditions,
		"(s.status IN ('submitted','rejected') OR (s.status = 'approved' AND s.quality IN ('cukup','belum')))"
	];

	const summaryRow = await db
		.prepare(
			`
			SELECT
				SUM(CASE WHEN s.status = 'submitted' THEN 1 ELSE 0 END) as pending,
				SUM(CASE WHEN s.status = 'rejected' OR (s.status = 'approved' AND s.quality = 'belum') THEN 1 ELSE 0 END) as merah,
				SUM(CASE WHEN s.status = 'approved' AND s.quality = 'cukup' THEN 1 ELSE 0 END) as kuning
			FROM tpq_setoran s
			WHERE ${alertConditions.join(' AND ')}
			`
		)
		.bind(...scopeParams)
		.first<{ pending: number | null; merah: number | null; kuning: number | null }>();

	const summary: AlertSummary = {
		merah: Number(summaryRow?.merah ?? 0),
		kuning: Number(summaryRow?.kuning ?? 0),
		pending: Number(summaryRow?.pending ?? 0),
		total: Number(summaryRow?.merah ?? 0) + Number(summaryRow?.kuning ?? 0) + Number(summaryRow?.pending ?? 0)
	};

	const { results: alertsRaw } = await db
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
				h.name as halaqohName,
				s.reviewed_at as reviewedAt,
				s.created_at as createdAt
			FROM tpq_setoran s
			LEFT JOIN users us ON us.id = s.santri_user_id
			LEFT JOIN users ut ON ut.id = s.ustadz_user_id
			LEFT JOIN tpq_halaqoh h ON h.id = s.halaqoh_id
			WHERE ${alertConditions.join(' AND ')}
			ORDER BY s.date DESC, s.created_at DESC
			LIMIT 300
			`
		)
		.bind(...scopeParams)
		.all<AlertRow>();

	return {
		role,
		roleScope,
		summary,
		alerts: (alertsRaw ?? []) as AlertRow[],
		canInputSetoran: canInputSetoran(role),
		canReviewSetoran: canReviewSetoran(role),
		canViewSetoranHistory: canViewSetoranHistory(role)
	};
};
