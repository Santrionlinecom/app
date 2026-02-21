import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ensureSantriUstadzSchema } from '$lib/server/santri-ustadz';
import {
	assertSafeScopedId,
	assertTpqAcademicTables,
	canViewSetoranHistory,
	isValidIsoDate,
	MAX_FILTER_RANGE_DAYS,
	requireTpqAcademicContext,
	todayIsoDate,
	validateDateRangeDays
} from '$lib/server/tpq-academic';

const STATUS_FILTERS = new Set(['submitted', 'approved', 'rejected']);
const TYPE_FILTERS = new Set(['hafalan', 'murojaah']);
const ADMIN_HISTORY_ROLES = new Set(['admin', 'koordinator']);
const USTADZ_HISTORY_ROLES = new Set(['ustadz', 'ustadzah']);
const SANTRI_HISTORY_ROLES = new Set(['santri', 'alumni']);

type SelectOption = {
	id: string;
	label: string;
};

type RiwayatRow = {
	id: string;
	date: string;
	type: string;
	surah: string;
	ayatFrom: number;
	ayatTo: number;
	quality: string;
	status: string;
	notes: string | null;
	santriName: string | null;
	ustadzName: string | null;
	halaqohName: string | null;
	reviewerName: string | null;
	reviewedAt: number | null;
	createdAt: number;
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const { db, user, institutionId, role } = await requireTpqAcademicContext(locals);
	if (!canViewSetoranHistory(role)) {
		throw error(403, 'Role ini tidak diizinkan membuka riwayat setoran.');
	}

	await assertTpqAcademicTables(db);
	await ensureSantriUstadzSchema(db);

	const dateFromRaw = (url.searchParams.get('date_from') ?? '').trim();
	const dateToRaw = (url.searchParams.get('date_to') ?? '').trim();
	const statusRaw = (url.searchParams.get('status') ?? '').trim().toLowerCase();
	const typeRaw = (url.searchParams.get('type') ?? '').trim().toLowerCase();
	const halaqohId = (url.searchParams.get('halaqoh_id') ?? '').trim();
	const santriUserId = (url.searchParams.get('santri_user_id') ?? '').trim();
	const ustadzUserId = (url.searchParams.get('ustadz_user_id') ?? '').trim();

	const dateFrom = dateFromRaw && isValidIsoDate(dateFromRaw) ? dateFromRaw : '';
	const dateTo = dateToRaw && isValidIsoDate(dateToRaw) ? dateToRaw : '';
	const status = STATUS_FILTERS.has(statusRaw) ? statusRaw : '';
	const type = TYPE_FILTERS.has(typeRaw) ? typeRaw : '';

	if (dateFrom && dateTo && dateFrom > dateTo) {
		throw error(400, 'Filter tanggal tidak valid: date_from harus <= date_to.');
	}
	validateDateRangeDays(dateFrom, dateTo, MAX_FILTER_RANGE_DAYS);

	const validatedHalaqohId = halaqohId ? assertSafeScopedId(halaqohId, 'ID halaqoh') : '';
	const validatedSantriUserId = santriUserId
		? assertSafeScopedId(santriUserId, 'ID santri')
		: '';
	const validatedUstadzUserId = ustadzUserId
		? assertSafeScopedId(ustadzUserId, 'ID ustadz')
		: '';

	const conditions = ['s.institution_id = ?'];
	const params: Array<string | number> = [institutionId];

	if (SANTRI_HISTORY_ROLES.has(role)) {
		conditions.push('s.santri_user_id = ?');
		params.push(user.id);
	} else if (USTADZ_HISTORY_ROLES.has(role)) {
		conditions.push(
			`EXISTS (
				SELECT 1
				FROM santri_ustadz su
				WHERE su.santri_id = s.santri_user_id
				  AND su.ustadz_id = ?
				  AND su.org_id = s.institution_id
			)`
		);
		params.push(user.id);
	}

	if (dateFrom) {
		conditions.push('s.date >= ?');
		params.push(dateFrom);
	}
	if (dateTo) {
		conditions.push('s.date <= ?');
		params.push(dateTo);
	}
	if (status) {
		conditions.push('s.status = ?');
		params.push(status);
	}
	if (type) {
		conditions.push('s.type = ?');
		params.push(type);
	}
	if (validatedHalaqohId) {
		conditions.push('s.halaqoh_id = ?');
		params.push(validatedHalaqohId);
	}

	if (ADMIN_HISTORY_ROLES.has(role)) {
		if (validatedSantriUserId) {
			conditions.push('s.santri_user_id = ?');
			params.push(validatedSantriUserId);
		}
		if (validatedUstadzUserId) {
			conditions.push('s.ustadz_user_id = ?');
			params.push(validatedUstadzUserId);
		}
	} else if (USTADZ_HISTORY_ROLES.has(role) && validatedSantriUserId) {
		conditions.push('s.santri_user_id = ?');
		params.push(validatedSantriUserId);
	}

	const whereClause = conditions.join(' AND ');

	const { results: riwayatRaw } = await db
		.prepare(
			`SELECT s.id,
			        s.date,
			        s.type,
			        s.surah,
			        s.ayat_from as ayatFrom,
			        s.ayat_to as ayatTo,
			        s.quality,
			        s.status,
			        s.notes,
			        COALESCE(us.username, us.email) as santriName,
			        COALESCE(ut.username, ut.email) as ustadzName,
			        h.name as halaqohName,
			        COALESCE(ur.username, ur.email) as reviewerName,
			        s.reviewed_at as reviewedAt,
			        s.created_at as createdAt
			 FROM tpq_setoran s
			 LEFT JOIN users us ON us.id = s.santri_user_id
			 LEFT JOIN users ut ON ut.id = s.ustadz_user_id
			 LEFT JOIN users ur ON ur.id = s.reviewed_by
			 LEFT JOIN tpq_halaqoh h ON h.id = s.halaqoh_id
			 WHERE ${whereClause}
			 ORDER BY s.date DESC, s.created_at DESC
			 LIMIT 500`
		)
		.bind(...params)
		.all<RiwayatRow>();

	const totalRows =
		(await db
			.prepare(`SELECT COUNT(*) as total FROM tpq_setoran s WHERE ${whereClause}`)
			.bind(...params)
			.first<{ total: number | null }>())?.total ?? 0;

	const today = todayIsoDate();
	const summaryConditions = ['s.institution_id = ?', 's.date = ?'];
	const summaryParams: Array<string | number> = [institutionId, today];
	if (SANTRI_HISTORY_ROLES.has(role)) {
		summaryConditions.push('s.santri_user_id = ?');
		summaryParams.push(user.id);
	} else if (USTADZ_HISTORY_ROLES.has(role)) {
		summaryConditions.push(
			`EXISTS (
				SELECT 1
				FROM santri_ustadz su
				WHERE su.santri_id = s.santri_user_id
				  AND su.ustadz_id = ?
				  AND su.org_id = s.institution_id
			)`
		);
		summaryParams.push(user.id);
	}

	const todaySummary =
		(await db
			.prepare(
				`SELECT
					SUM(CASE WHEN s.status = 'submitted' THEN 1 ELSE 0 END) as submitted,
					SUM(CASE WHEN s.status = 'approved' THEN 1 ELSE 0 END) as approved,
					SUM(CASE WHEN s.status = 'rejected' THEN 1 ELSE 0 END) as rejected
				 FROM tpq_setoran s
				 WHERE ${summaryConditions.join(' AND ')}`
			)
			.bind(...summaryParams)
			.first<{ submitted: number | null; approved: number | null; rejected: number | null }>()) ?? {
			submitted: 0,
			approved: 0,
			rejected: 0
		};

	const { results: halaqohRaw } = await (USTADZ_HISTORY_ROLES.has(role)
		? db.prepare(
				`SELECT id, name as label
				 FROM tpq_halaqoh
				 WHERE institution_id = ? AND ustadz_user_id = ?
				 ORDER BY name ASC
				 LIMIT 300`
			).bind(institutionId, user.id)
		: db.prepare(
				`SELECT id, name as label
				 FROM tpq_halaqoh
				 WHERE institution_id = ?
				 ORDER BY name ASC
				 LIMIT 300`
			).bind(institutionId)
	).all<SelectOption>();

	const { results: santriRaw } = await (ADMIN_HISTORY_ROLES.has(role)
		? db.prepare(
				`SELECT id, COALESCE(username, email) as label
				 FROM users
				 WHERE org_id = ?
				   AND role IN ('santri', 'alumni')
				   AND (org_status IS NULL OR org_status = 'active')
				 ORDER BY COALESCE(username, email) ASC
				 LIMIT 1000`
			).bind(institutionId)
		: USTADZ_HISTORY_ROLES.has(role)
			? db.prepare(
					`SELECT u.id, COALESCE(u.username, u.email) as label
					 FROM santri_ustadz su
					 JOIN users u ON u.id = su.santri_id
					 WHERE su.org_id = ?
					   AND su.ustadz_id = ?
					   AND (u.org_status IS NULL OR u.org_status = 'active')
					 ORDER BY COALESCE(u.username, u.email) ASC
					 LIMIT 1000`
				).bind(institutionId, user.id)
			: db.prepare(`SELECT '' as id, '' as label WHERE 1 = 0`)
	).all<SelectOption>();

	const { results: ustadzRaw } = await (ADMIN_HISTORY_ROLES.has(role)
		? db.prepare(
				`SELECT id, COALESCE(username, email) as label
				 FROM users
				 WHERE org_id = ?
				   AND role IN ('admin', 'ustadz', 'ustadzah')
				   AND (org_status IS NULL OR org_status = 'active')
				 ORDER BY COALESCE(username, email) ASC
				 LIMIT 500`
			).bind(institutionId)
		: db.prepare(`SELECT '' as id, '' as label WHERE 1 = 0`)
	).all<SelectOption>();

	return {
		role,
		totalRows,
		riwayat: (riwayatRaw ?? []) as RiwayatRow[],
		todaySummary: {
			submitted: todaySummary.submitted ?? 0,
			approved: todaySummary.approved ?? 0,
			rejected: todaySummary.rejected ?? 0
		},
		filters: {
			dateFrom,
			dateTo,
			status,
			type,
			halaqohId: validatedHalaqohId,
			santriUserId: validatedSantriUserId,
			ustadzUserId: validatedUstadzUserId
		},
		filterOptions: {
			halaqoh: (halaqohRaw ?? []) as SelectOption[],
			santri: (santriRaw ?? []) as SelectOption[],
			ustadz: (ustadzRaw ?? []) as SelectOption[]
		},
		canFilterByUser: ADMIN_HISTORY_ROLES.has(role) || USTADZ_HISTORY_ROLES.has(role),
		canFilterByUstadz: ADMIN_HISTORY_ROLES.has(role)
	};
};
