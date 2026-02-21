import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	assertSafeScopedId,
	assertTpqAcademicTables,
	canReviewSetoran,
	isValidIsoDate,
	isSafeScopedId,
	requireTpqAcademicContext,
	syncApprovedHafalanFromSetoran,
	todayIsoDate
} from '$lib/server/tpq-academic';

const REVIEW_DECISIONS = new Set(['approved', 'rejected']);

type FilterOption = {
	id: string;
	label: string;
};

type PendingSetoranRow = {
	id: string;
	date: string;
	type: string;
	surah: string;
	ayatFrom: number;
	ayatTo: number;
	quality: string;
	notes: string | null;
	santriName: string | null;
	ustadzName: string | null;
	halaqohName: string | null;
	createdAt: number;
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const { db, institutionId, role } = await requireTpqAcademicContext(locals);
	if (!canReviewSetoran(role)) {
		throw error(403, 'Hanya koordinator/admin yang boleh review setoran.');
	}
	await assertTpqAcademicTables(db);

	const today = todayIsoDate();
	const dateFilterRaw = (url.searchParams.get('date') ?? '').trim();
	const dateFilter = dateFilterRaw && isValidIsoDate(dateFilterRaw) ? dateFilterRaw : today;
	const halaqohFilterRaw = (url.searchParams.get('halaqoh_id') ?? '').trim();
	const ustadzFilterRaw = (url.searchParams.get('ustadz_user_id') ?? '').trim();
	const halaqohFilter = isSafeScopedId(halaqohFilterRaw) ? halaqohFilterRaw : '';
	const ustadzFilter = isSafeScopedId(ustadzFilterRaw) ? ustadzFilterRaw : '';

	const conditions = ['s.institution_id = ?', "s.status = 'submitted'", 's.date = ?'];
	const params: Array<string | number> = [institutionId, dateFilter];

	if (halaqohFilter) {
		conditions.push('s.halaqoh_id = ?');
		params.push(halaqohFilter);
	}
	if (ustadzFilter) {
		conditions.push('s.ustadz_user_id = ?');
		params.push(ustadzFilter);
	}

	const { results: pendingRaw } = await db
		.prepare(
			`SELECT s.id,
			        s.date,
			        s.type,
			        s.surah,
			        s.ayat_from as ayatFrom,
			        s.ayat_to as ayatTo,
			        s.quality,
			        s.notes,
			        COALESCE(us.username, us.email) as santriName,
			        COALESCE(ut.username, ut.email) as ustadzName,
			        h.name as halaqohName,
			        s.created_at as createdAt
			 FROM tpq_setoran s
			 LEFT JOIN users us ON us.id = s.santri_user_id
			 LEFT JOIN users ut ON ut.id = s.ustadz_user_id
			 LEFT JOIN tpq_halaqoh h ON h.id = s.halaqoh_id
			 WHERE ${conditions.join(' AND ')}
			 ORDER BY s.created_at ASC
			 LIMIT 300`
		)
		.bind(...params)
		.all<PendingSetoranRow>();

	const { results: halaqohRaw } = await db
		.prepare(
			`SELECT id, name
			 FROM tpq_halaqoh
			 WHERE institution_id = ?
			 ORDER BY name ASC
			 LIMIT 300`
		)
		.bind(institutionId)
		.all<{ id: string; name: string }>();

	const { results: ustadzRaw } = await db
		.prepare(
			`SELECT id, COALESCE(username, email) as label
			 FROM users
			 WHERE org_id = ?
			   AND role IN ('admin', 'ustadz', 'ustadzah')
			   AND (org_status IS NULL OR org_status = 'active')
			 ORDER BY COALESCE(username, email) ASC
			 LIMIT 500`
		)
		.bind(institutionId)
		.all<FilterOption>();

	const todaySummary =
		(await db
			.prepare(
				`SELECT
					SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
					SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
					SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
				 FROM tpq_setoran
				 WHERE institution_id = ? AND date = ?`
			)
			.bind(institutionId, today)
			.first<{ submitted: number | null; approved: number | null; rejected: number | null }>()) ?? {
			submitted: 0,
			approved: 0,
			rejected: 0
		};

	return {
		filters: {
			date: dateFilter,
			halaqohId: halaqohFilter,
			ustadzUserId: ustadzFilter
		},
		pendingSetoran: (pendingRaw ?? []) as PendingSetoranRow[],
		filterOptions: {
			halaqoh: (halaqohRaw ?? []).map((row) => ({ id: row.id, label: row.name })),
			ustadz: (ustadzRaw ?? []) as FilterOption[]
		},
		todaySummary: {
			submitted: todaySummary.submitted ?? 0,
			approved: todaySummary.approved ?? 0,
			rejected: todaySummary.rejected ?? 0
		}
	};
};

export const actions: Actions = {
	review: async ({ locals, request }) => {
		const { db, user, institutionId, role } = await requireTpqAcademicContext(locals);
		if (!canReviewSetoran(role)) {
			return fail(403, { reviewError: 'Hanya koordinator/admin yang boleh review setoran.' });
		}
		await assertTpqAcademicTables(db);

		const form = await request.formData();
		const setoranIdRaw = `${form.get('setoran_id') ?? ''}`.trim();
		const decision = `${form.get('decision') ?? ''}`.trim().toLowerCase();

		if (!setoranIdRaw) {
			return fail(400, { reviewError: 'Data setoran tidak ditemukan.' });
		}
		let setoranId = '';
		try {
			setoranId = assertSafeScopedId(setoranIdRaw, 'ID setoran');
		} catch (err) {
			return fail(400, { reviewError: (err as Error)?.message ?? 'ID setoran tidak valid.' });
		}
		if (!REVIEW_DECISIONS.has(decision)) {
			return fail(400, { reviewError: 'Keputusan review tidak valid.' });
		}

		const setoran = await db
			.prepare(
				`SELECT id,
				        santri_user_id as santriUserId,
				        type,
				        surah,
				        ayat_from as ayatFrom,
				        ayat_to as ayatTo,
				        quality,
				        status
				 FROM tpq_setoran
				 WHERE id = ? AND institution_id = ?
				 LIMIT 1`
			)
			.bind(setoranId, institutionId)
			.first<{
				id: string;
				santriUserId: string;
				type: string;
				surah: string;
				ayatFrom: number;
				ayatTo: number;
				quality: string;
				status: string;
			}>();

		if (!setoran) {
			return fail(404, { reviewError: 'Setoran tidak ditemukan.' });
		}
		if (setoran.status !== 'submitted') {
			return fail(400, { reviewError: 'Setoran ini sudah diproses sebelumnya.' });
		}

		const reviewedAt = Date.now();
		const updateResult = await db
			.prepare(
				`UPDATE tpq_setoran
				 SET status = ?,
				     reviewed_by = ?,
				     reviewed_at = ?
				 WHERE id = ? AND institution_id = ? AND status = 'submitted'`
			)
			.bind(decision, user.id, reviewedAt, setoranId, institutionId)
			.run();
		if (Number(updateResult.meta?.changes ?? 0) < 1) {
			return fail(409, { reviewError: 'Setoran sudah diproses oleh pengguna lain.' });
		}

		if (decision === 'approved' && setoran.type === 'hafalan') {
			try {
				await syncApprovedHafalanFromSetoran(db, setoran);
			} catch (err) {
				await db
					.prepare(
						`UPDATE tpq_setoran
						 SET status = 'submitted',
						     reviewed_by = NULL,
						     reviewed_at = NULL
						 WHERE id = ? AND institution_id = ?`
					)
					.bind(setoranId, institutionId)
					.run();

				return fail(500, {
					reviewError: `Approval dibatalkan karena sinkronisasi hafalan gagal: ${(err as Error)?.message ?? 'unknown'}`
				});
			}
		}

		return {
			reviewMessage:
				decision === 'approved'
					? 'Setoran berhasil di-approve.'
					: 'Setoran ditandai rejected. Santri perlu perbaikan.'
		};
	}
};
