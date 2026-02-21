import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ensureSantriUstadzSchema } from '$lib/server/santri-ustadz';
import {
	assertTpqAcademicTables,
	canInputSetoran,
	isValidIsoDate,
	requireTpqAcademicContext,
	todayIsoDate,
	TPQ_SETORAN_QUALITIES,
	TPQ_SETORAN_TYPES
} from '$lib/server/tpq-academic';

const SETORAN_TYPE_SET = new Set<string>(TPQ_SETORAN_TYPES);
const SETORAN_QUALITY_SET = new Set<string>(TPQ_SETORAN_QUALITIES);

const parsePositiveInt = (value: FormDataEntryValue | null) => {
	const parsed = Number.parseInt(`${value ?? ''}`, 10);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeTime = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) return null;
	return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : null;
};

type TeacherRow = {
	id: string;
	username: string | null;
	email: string | null;
	role: string;
};

type SantriRow = {
	id: string;
	username: string | null;
	email: string | null;
};

type HalaqohRow = {
	id: string;
	name: string;
	ustadzUserId: string;
	ustadzName: string | null;
	scheduleJson: string;
	createdAt: number;
};

type SetoranRow = {
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
	createdAt: number;
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const { db, user, institutionId, role } = await requireTpqAcademicContext(locals);
	if (!canInputSetoran(role)) {
		throw error(403, 'Hanya ustadz/ustadzah/admin yang boleh input setoran.');
	}

	await assertTpqAcademicTables(db);
	await ensureSantriUstadzSchema(db);

	const selectedDateRaw = (url.searchParams.get('date') ?? '').trim();
	const selectedDate = selectedDateRaw && isValidIsoDate(selectedDateRaw) ? selectedDateRaw : todayIsoDate();

	const { results: halaqohRaw } = await (role === 'admin'
		? db.prepare(
				`SELECT h.id,
				        h.name,
				        h.ustadz_user_id as ustadzUserId,
				        COALESCE(u.username, u.email) as ustadzName,
				        h.schedule_json as scheduleJson,
				        h.created_at as createdAt
				 FROM tpq_halaqoh h
				 LEFT JOIN users u ON u.id = h.ustadz_user_id
				 WHERE h.institution_id = ?
				 ORDER BY h.name ASC`
			).bind(institutionId)
		: db.prepare(
				`SELECT h.id,
				        h.name,
				        h.ustadz_user_id as ustadzUserId,
				        COALESCE(u.username, u.email) as ustadzName,
				        h.schedule_json as scheduleJson,
				        h.created_at as createdAt
				 FROM tpq_halaqoh h
				 LEFT JOIN users u ON u.id = h.ustadz_user_id
				 WHERE h.institution_id = ? AND h.ustadz_user_id = ?
				 ORDER BY h.name ASC`
			).bind(institutionId, user.id)
	).all<HalaqohRow>();

	const { results: teachersRaw } = await db
		.prepare(
			`SELECT id, username, email, role
			 FROM users
			 WHERE org_id = ?
			   AND (org_status IS NULL OR org_status = 'active')
			   AND role IN ('admin', 'ustadz', 'ustadzah')
			 ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, COALESCE(username, email) ASC`
		)
		.bind(institutionId)
		.all<TeacherRow>();

	const { results: santriRaw } = await (role === 'admin'
		? db.prepare(
				`SELECT id, username, email
				 FROM users
				 WHERE org_id = ?
				   AND (org_status IS NULL OR org_status = 'active')
				   AND role IN ('santri', 'alumni')
				 ORDER BY COALESCE(username, email) ASC`
			).bind(institutionId)
		: db.prepare(
				`SELECT u.id, u.username, u.email
				 FROM santri_ustadz su
				 JOIN users u ON u.id = su.santri_id
				 WHERE su.org_id = ?
				   AND su.ustadz_id = ?
				   AND (u.org_status IS NULL OR u.org_status = 'active')
				 ORDER BY COALESCE(u.username, u.email) ASC`
			).bind(institutionId, user.id)
	).all<SantriRow>();

	const recentConditions = ['s.institution_id = ?', 's.date = ?'];
	const recentParams: Array<string | number> = [institutionId, selectedDate];
	if (role !== 'admin') {
		recentConditions.push('s.ustadz_user_id = ?');
		recentParams.push(user.id);
	}

	const { results: recentRaw } = await db
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
			        s.created_at as createdAt
			 FROM tpq_setoran s
			 LEFT JOIN users us ON us.id = s.santri_user_id
			 LEFT JOIN users ut ON ut.id = s.ustadz_user_id
			 LEFT JOIN tpq_halaqoh h ON h.id = s.halaqoh_id
			 WHERE ${recentConditions.join(' AND ')}
			 ORDER BY s.created_at DESC
			 LIMIT 120`
		)
		.bind(...recentParams)
		.all<SetoranRow>();

	const summaryConditions = ['institution_id = ?', 'date = ?'];
	const summaryParams: Array<string | number> = [institutionId, todayIsoDate()];
	if (role !== 'admin') {
		summaryConditions.push('ustadz_user_id = ?');
		summaryParams.push(user.id);
	}

	const todaySummary =
		(await db
			.prepare(
				`SELECT
					COUNT(*) as total,
					SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
					SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
					SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
				 FROM tpq_setoran
				 WHERE ${summaryConditions.join(' AND ')}`
			)
			.bind(...summaryParams)
			.first<{
				total: number | null;
				submitted: number | null;
				approved: number | null;
				rejected: number | null;
			}>()) ?? { total: 0, submitted: 0, approved: 0, rejected: 0 };

	return {
		role,
		selectedDate,
		canChooseUstadz: role === 'admin',
		teachers: (teachersRaw ?? []) as TeacherRow[],
		santri: (santriRaw ?? []) as SantriRow[],
		halaqoh: (halaqohRaw ?? []) as HalaqohRow[],
		recentSetoran: (recentRaw ?? []) as SetoranRow[],
		todaySummary: {
			total: todaySummary.total ?? 0,
			submitted: todaySummary.submitted ?? 0,
			approved: todaySummary.approved ?? 0,
			rejected: todaySummary.rejected ?? 0
		}
	};
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const { db, user, institutionId, role } = await requireTpqAcademicContext(locals);
		if (!canInputSetoran(role)) {
			return fail(403, { createError: 'Hanya ustadz/ustadzah/admin yang boleh input setoran.' });
		}

		await assertTpqAcademicTables(db);
		await ensureSantriUstadzSchema(db);

		const form = await request.formData();
		const santriUserId = `${form.get('santri_user_id') ?? ''}`.trim();
		const date = `${form.get('date') ?? ''}`.trim();
		const type = `${form.get('type') ?? ''}`.trim().toLowerCase();
		const surah = `${form.get('surah') ?? ''}`.trim();
		const ayatFrom = parsePositiveInt(form.get('ayat_from'));
		const ayatTo = parsePositiveInt(form.get('ayat_to'));
		const quality = `${form.get('quality') ?? ''}`.trim().toLowerCase();
		const notesRaw = `${form.get('notes') ?? ''}`;
		const notes = notesRaw.trim() ? notesRaw.trim().slice(0, 1000) : null;
		const halaqohIdRaw = `${form.get('halaqoh_id') ?? ''}`.trim();
		const halaqohId = halaqohIdRaw || null;
		const requestedUstadzUserId = `${form.get('ustadz_user_id') ?? ''}`.trim();

		if (!santriUserId) {
			return fail(400, { createError: 'Santri wajib dipilih.' });
		}
		if (!date || !isValidIsoDate(date)) {
			return fail(400, { createError: 'Tanggal tidak valid (format YYYY-MM-DD).' });
		}
		if (!SETORAN_TYPE_SET.has(type)) {
			return fail(400, { createError: 'Tipe setoran tidak valid.' });
		}
		if (!surah) {
			return fail(400, { createError: 'Surah wajib diisi.' });
		}
		const surahNumber = Number.parseInt(surah, 10);
		if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
			return fail(400, { createError: 'Surah wajib berupa angka 1-114.' });
		}
		if (!ayatFrom || !ayatTo) {
			return fail(400, { createError: 'Rentang ayat wajib diisi.' });
		}
		if (ayatFrom > ayatTo) {
			return fail(400, { createError: 'Ayat mulai tidak boleh lebih besar dari ayat akhir.' });
		}
		if (!SETORAN_QUALITY_SET.has(quality)) {
			return fail(400, { createError: 'Kualitas tidak valid.' });
		}

		const santriInScope =
			role === 'admin'
				? await db
						.prepare(
							`SELECT id
							 FROM users
							 WHERE id = ?
							   AND org_id = ?
							   AND role IN ('santri', 'alumni')
							 LIMIT 1`
						)
						.bind(santriUserId, institutionId)
						.first<{ id: string }>()
				: await db
						.prepare(
							`SELECT santri_id as id
							 FROM santri_ustadz
							 WHERE santri_id = ?
							   AND ustadz_id = ?
							   AND org_id = ?
							 LIMIT 1`
						)
						.bind(santriUserId, user.id, institutionId)
						.first<{ id: string }>();

		if (!santriInScope) {
			return fail(403, { createError: 'Santri tidak berada dalam scope pengajaran Anda.' });
		}

		let finalUstadzUserId = role === 'admin' ? requestedUstadzUserId || user.id : user.id;

		if (role === 'admin') {
			const validTeacher = await db
				.prepare(
					`SELECT id
					 FROM users
					 WHERE id = ?
					   AND org_id = ?
					   AND role IN ('admin', 'ustadz', 'ustadzah')
					 LIMIT 1`
				)
				.bind(finalUstadzUserId, institutionId)
				.first<{ id: string }>();
			if (!validTeacher) {
				return fail(400, { createError: 'Ustadz pengampu tidak valid.' });
			}
		}

		if (halaqohId) {
			const halaqoh = await db
				.prepare(
					`SELECT id, ustadz_user_id as ustadzUserId
					 FROM tpq_halaqoh
					 WHERE id = ? AND institution_id = ?
					 LIMIT 1`
				)
				.bind(halaqohId, institutionId)
				.first<{ id: string; ustadzUserId: string }>();

			if (!halaqoh) {
				return fail(400, { createError: 'Halaqoh tidak ditemukan.' });
			}

			if (role !== 'admin' && halaqoh.ustadzUserId !== user.id) {
				return fail(403, { createError: 'Anda tidak bisa input setoran untuk halaqoh ini.' });
			}

			if (role === 'admin') {
				if (!requestedUstadzUserId) {
					finalUstadzUserId = halaqoh.ustadzUserId;
				} else if (requestedUstadzUserId !== halaqoh.ustadzUserId) {
					return fail(400, {
						createError: 'Ustadz pengampu harus sesuai dengan ustadz yang ditetapkan pada halaqoh.'
					});
				}
			}
		}

		await db
			.prepare(
				`INSERT INTO tpq_setoran (
					id,
					institution_id,
					santri_user_id,
					ustadz_user_id,
					halaqoh_id,
					date,
					type,
					surah,
					ayat_from,
					ayat_to,
					quality,
					notes,
					status,
					created_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)`
			)
			.bind(
				crypto.randomUUID(),
				institutionId,
				santriUserId,
				finalUstadzUserId,
				halaqohId,
				date,
				type,
				String(surahNumber),
				ayatFrom,
				ayatTo,
				quality,
				notes,
				Date.now()
			)
			.run();

		return { createMessage: 'Setoran berhasil disimpan sebagai submitted.' };
	},
	createHalaqoh: async ({ locals, request }) => {
		const { db, user, institutionId, role } = await requireTpqAcademicContext(locals);
		if (!canInputSetoran(role)) {
			return fail(403, { halaqohError: 'Hanya ustadz/ustadzah/admin yang boleh membuat halaqoh.' });
		}

		await assertTpqAcademicTables(db);

		const form = await request.formData();
		const name = `${form.get('name') ?? ''}`.trim();
		const daysRaw = `${form.get('days') ?? ''}`;
		const startTimeRaw = `${form.get('start_time') ?? ''}`;
		const endTimeRaw = `${form.get('end_time') ?? ''}`;
		const requestedUstadzUserId = `${form.get('ustadz_user_id') ?? ''}`.trim();

		if (!name) {
			return fail(400, { halaqohError: 'Nama halaqoh wajib diisi.' });
		}

		const startTime = normalizeTime(startTimeRaw);
		if (startTimeRaw.trim() && !startTime) {
			return fail(400, { halaqohError: 'Format jam mulai tidak valid (HH:MM).' });
		}
		const endTime = normalizeTime(endTimeRaw);
		if (endTimeRaw.trim() && !endTime) {
			return fail(400, { halaqohError: 'Format jam selesai tidak valid (HH:MM).' });
		}

		let ustadzUserId = role === 'admin' ? requestedUstadzUserId || user.id : user.id;

		if (role === 'admin') {
			const validTeacher = await db
				.prepare(
					`SELECT id
					 FROM users
					 WHERE id = ?
					   AND org_id = ?
					   AND role IN ('admin', 'ustadz', 'ustadzah')
					 LIMIT 1`
				)
				.bind(ustadzUserId, institutionId)
				.first<{ id: string }>();
			if (!validTeacher) {
				return fail(400, { halaqohError: 'Ustadz pengampu halaqoh tidak valid.' });
			}
		}

		const days = daysRaw
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean);

		const scheduleJson = JSON.stringify({
			days,
			start_time: startTime,
			end_time: endTime
		});

		await db
			.prepare(
				`INSERT INTO tpq_halaqoh (id, institution_id, name, ustadz_user_id, schedule_json, created_at)
				 VALUES (?, ?, ?, ?, ?, ?)`
			)
			.bind(crypto.randomUUID(), institutionId, name, ustadzUserId, scheduleJson, Date.now())
			.run();

		return { halaqohMessage: 'Halaqoh berhasil dibuat.' };
	}
};
