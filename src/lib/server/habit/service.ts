import type { D1Database } from '@cloudflare/workers-types';
import { error } from '@sveltejs/kit';
import {
	addDays,
	computeCurrentStreak,
	countMetInWindow,
	isConsistent5of7,
	isValidLocalDate,
	todayWib,
	weekStartMonday
} from './dates';
import {
	HABIT_MISSION_KEYS,
	isHabitMissionKey,
	KEBAIKAN_CATEGORIES,
	QURAN_DURATION_BUCKETS,
	QURAN_MODES,
	SHALAT_STATUSES,
	SHALAT_TIMES,
	type HabitCheckin,
	type HabitMission,
	type HabitMissionKey,
	type HabitStreak,
	type HabitSummary,
	type KebaikanCategory,
	type MissionTodayCard,
	type QuranDurationBucket,
	type QuranMode,
	type ShalatStatus,
	type ShalatTime
} from './types';

type MissionRow = {
	key: string;
	title: string;
	description: string;
	sort_order: number;
	is_active: number;
};

type CheckinRow = {
	id: string;
	user_id: string;
	mission_key: string;
	local_date: string;
	status: string;
	detail_json: string | null;
	duration_bucket: string | null;
	optional_reflection: string | null;
	is_day_met: number;
	created_at: number;
	updated_at: number;
};

type StreakRow = {
	user_id: string;
	mission_key: string;
	current_streak: number;
	best_streak: number;
	last_met_date: string | null;
	restarted_at: string | null;
};

const nowMs = () => Date.now();

const clampReflection = (value: unknown): string | null => {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim().replace(/\s+/g, ' ');
	if (!trimmed) return null;
	return trimmed.slice(0, 140);
};

const parseDetail = (raw: string | null): Record<string, unknown> | null => {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as unknown;
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
			? (parsed as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
};

const mapMission = (row: MissionRow): HabitMission => ({
	key: row.key as HabitMissionKey,
	title: row.title,
	description: row.description,
	sortOrder: row.sort_order,
	isActive: row.is_active === 1
});

const mapCheckin = (row: CheckinRow): HabitCheckin => ({
	id: row.id,
	userId: row.user_id,
	missionKey: row.mission_key as HabitMissionKey,
	localDate: row.local_date,
	status: row.status,
	detail: parseDetail(row.detail_json),
	durationBucket: (row.duration_bucket as QuranDurationBucket | null) ?? null,
	optionalReflection: row.optional_reflection,
	isDayMet: row.is_day_met === 1,
	createdAt: row.created_at,
	updatedAt: row.updated_at
});

const mapStreak = (row: StreakRow): HabitStreak => ({
	userId: row.user_id,
	missionKey: row.mission_key as HabitMissionKey,
	currentStreak: row.current_streak,
	bestStreak: row.best_streak,
	lastMetDate: row.last_met_date,
	restartedAt: row.restarted_at
});

const isShalatTime = (value: string): value is ShalatTime =>
	(SHALAT_TIMES as readonly string[]).includes(value);
const isShalatStatus = (value: string): value is ShalatStatus =>
	(SHALAT_STATUSES as readonly string[]).includes(value);
const isQuranMode = (value: string): value is QuranMode =>
	(QURAN_MODES as readonly string[]).includes(value);
const isDurationBucket = (value: string): value is QuranDurationBucket =>
	(QURAN_DURATION_BUCKETS as readonly string[]).includes(value);
const isKebaikanCategory = (value: string): value is KebaikanCategory =>
	(KEBAIKAN_CATEGORIES as readonly string[]).includes(value);

/** Strip uzur details for mentor-facing payloads (uzur stays opaque). */
export const stripSensitiveCheckinForMentor = (checkin: HabitCheckin): HabitCheckin => {
	if (checkin.missionKey !== 'shalat_wajib' || !checkin.detail) return checkin;
	const times = (checkin.detail.times ?? {}) as Record<string, string>;
	const sanitized: Record<string, string> = {};
	for (const [time, status] of Object.entries(times)) {
		sanitized[time] = status === 'uzur' ? 'uzur' : status;
	}
	return {
		...checkin,
		detail: {
			times: sanitized,
			keptCount: checkin.detail.keptCount ?? 0
		},
		optionalReflection: null
	};
};

export type ShalatCheckinInput = {
	missionKey: 'shalat_wajib';
	times: Partial<Record<ShalatTime, ShalatStatus>>;
	optionalReflection?: string | null;
};

export type QuranCheckinInput = {
	missionKey: 'quran_harian';
	mode: QuranMode;
	durationBucket: QuranDurationBucket;
	optionalReflection?: string | null;
};

export type KebaikanCheckinInput = {
	missionKey: 'amal_adab_harian';
	done: boolean;
	category?: KebaikanCategory;
	optionalReflection?: string | null;
};

export type CheckinInput = ShalatCheckinInput | QuranCheckinInput | KebaikanCheckinInput;

export const normalizeCheckinPayload = (
	input: CheckinInput
): {
	status: string;
	detailJson: string | null;
	durationBucket: string | null;
	optionalReflection: string | null;
	isDayMet: boolean;
} => {
	const reflection = clampReflection(input.optionalReflection);

	if (input.missionKey === 'shalat_wajib') {
		const times: Partial<Record<ShalatTime, ShalatStatus>> = {};
		let kept = 0;
		let hasAny = false;
		for (const time of SHALAT_TIMES) {
			const status = input.times?.[time];
			if (!status) continue;
			if (!isShalatStatus(status)) {
				throw error(400, `Status shalat tidak valid: ${time}`);
			}
			times[time] = status;
			hasAny = true;
			if (status === 'tepat_waktu' || status === 'terlaksana' || status === 'uzur') {
				// uzur does not count as failure; counts toward "kept/handled"
				if (status !== 'uzur') kept += 1;
			}
		}
		if (!hasAny) throw error(400, 'Isi minimal satu waktu shalat.');
		// Day is "active/met for consistency" if honest check-in exists (even partial).
		// Target quality still shown via keptCount.
		const handled = SHALAT_TIMES.filter((t) => times[t] && times[t] !== 'belum').length;
		const isDayMet = handled > 0;
		const status =
			kept >= 5 ? 'lengkap' : handled > 0 ? 'sebagian' : 'belum';
		return {
			status,
			detailJson: JSON.stringify({ times, keptCount: kept }),
			durationBucket: null,
			optionalReflection: reflection,
			isDayMet
		};
	}

	if (input.missionKey === 'quran_harian') {
		if (!isQuranMode(input.mode)) throw error(400, 'Mode Al-Qur\'an tidak valid.');
		if (!isDurationBucket(input.durationBucket)) {
			throw error(400, 'Durasi Al-Qur\'an tidak valid.');
		}
		const isDayMet = input.durationBucket === '10-19' || input.durationBucket === '20+';
		return {
			status: isDayMet ? 'tercapai' : 'usaha',
			detailJson: JSON.stringify({ mode: input.mode }),
			durationBucket: input.durationBucket,
			optionalReflection: reflection,
			isDayMet
		};
	}

	// kebaikan
	const done = Boolean(input.done);
	if (done) {
		const category = input.category ?? 'lainnya';
		if (!isKebaikanCategory(category)) throw error(400, 'Kategori kebaikan tidak valid.');
		return {
			status: 'sudah',
			detailJson: JSON.stringify({ category }),
			durationBucket: null,
			optionalReflection: reflection,
			isDayMet: true
		};
	}
	return {
		status: 'belum',
		detailJson: input.category && isKebaikanCategory(input.category)
			? JSON.stringify({ category: input.category })
			: null,
		durationBucket: null,
		optionalReflection: reflection,
		isDayMet: false
	};
};

export const supportCopyFor = (missionKey: HabitMissionKey, checkin: HabitCheckin | null): string => {
	if (!checkin) {
		if (missionKey === 'shalat_wajib') return 'Mulai dengan satu waktu shalat yang bisa kamu jaga hari ini.';
		if (missionKey === 'quran_harian') return 'Sediakan sedikit waktu untuk Al-Qur\'an hari ini.';
		return 'Pilih satu kebaikan sederhana yang bisa kamu lakukan hari ini.';
	}
	if (checkin.isDayMet) {
		if (missionKey === 'shalat_wajib') return 'Alhamdulillah, terus jaga dengan ikhlas.';
		if (missionKey === 'quran_harian') return 'MasyaAllah, hari ini kamu sudah menyediakan waktu untuk Al-Qur\'an.';
		return 'Kebaikan kecil yang istiqamah membentuk karakter besar.';
	}
	if (missionKey === 'quran_harian' && checkin.durationBucket === '5-9') {
		return 'Usahamu sudah tercatat. Tambahkan sedikit waktu bila mampu.';
	}
	if (missionKey === 'shalat_wajib') return 'Tidak apa-apa, evaluasi dan mulai lagi pada waktu shalat berikutnya.';
	return 'Masih ada kesempatan hari ini. Pilih satu kebaikan sederhana yang bisa kamu lakukan.';
};

export const dayStatusFor = (checkin: HabitCheckin | null): MissionTodayCard['dayStatus'] => {
	if (!checkin) return 'pending';
	if (checkin.isDayMet) return 'done';
	if (checkin.missionKey === 'shalat_wajib' && checkin.status === 'sebagian') return 'partial';
	if (checkin.missionKey === 'quran_harian' && checkin.status === 'usaha') return 'partial';
	return 'pending';
};

export async function listActiveMissions(db: D1Database): Promise<HabitMission[]> {
	const { results } = await db
		.prepare(
			`SELECT key, title, description, sort_order, is_active
			 FROM habit_missions
			 WHERE is_active = 1
			 ORDER BY sort_order ASC`
		)
		.all<MissionRow>();

	const missions = (results ?? [])
		.filter((row) => isHabitMissionKey(row.key))
		.map(mapMission);

	// Fallback seed order if migration not applied yet — still only 3 keys.
	if (missions.length === 0) {
		return HABIT_MISSION_KEYS.map((key, index) => ({
			key,
			title:
				key === 'shalat_wajib'
					? 'Jaga Shalat Wajib'
					: key === 'quran_harian'
						? 'Bersama Al-Qur\'an'
						: 'Satu Kebaikan Hari Ini',
			description: 'Misi pilot Habit System',
			sortOrder: index + 1,
			isActive: true
		}));
	}
	return missions.slice(0, 3);
}

export async function getCheckin(
	db: D1Database,
	userId: string,
	missionKey: HabitMissionKey,
	localDate: string
): Promise<HabitCheckin | null> {
	const row = await db
		.prepare(
			`SELECT id, user_id, mission_key, local_date, status, detail_json, duration_bucket,
			        optional_reflection, is_day_met, created_at, updated_at
			 FROM habit_checkins
			 WHERE user_id = ? AND mission_key = ? AND local_date = ?`
		)
		.bind(userId, missionKey, localDate)
		.first<CheckinRow>();
	return row ? mapCheckin(row) : null;
}

export async function listCheckinsInRange(
	db: D1Database,
	userId: string,
	missionKey: HabitMissionKey,
	startDate: string,
	endDate: string
): Promise<HabitCheckin[]> {
	const { results } = await db
		.prepare(
			`SELECT id, user_id, mission_key, local_date, status, detail_json, duration_bucket,
			        optional_reflection, is_day_met, created_at, updated_at
			 FROM habit_checkins
			 WHERE user_id = ? AND mission_key = ? AND local_date >= ? AND local_date <= ?
			 ORDER BY local_date ASC`
		)
		.bind(userId, missionKey, startDate, endDate)
		.all<CheckinRow>();
	return (results ?? []).map(mapCheckin);
}

export async function getStreak(
	db: D1Database,
	userId: string,
	missionKey: HabitMissionKey
): Promise<HabitStreak | null> {
	const row = await db
		.prepare(
			`SELECT user_id, mission_key, current_streak, best_streak, last_met_date, restarted_at
			 FROM habit_streaks
			 WHERE user_id = ? AND mission_key = ?`
		)
		.bind(userId, missionKey)
		.first<StreakRow>();
	return row ? mapStreak(row) : null;
}

async function recomputeAndSaveStreak(
	db: D1Database,
	userId: string,
	missionKey: HabitMissionKey,
	asOfDate: string
): Promise<HabitStreak> {
	const start = addDays(asOfDate, -119);
	const checkins = await listCheckinsInRange(db, userId, missionKey, start, asOfDate);
	const metDates = new Set(checkins.filter((c) => c.isDayMet).map((c) => c.localDate));
	const current = computeCurrentStreak(metDates, asOfDate);
	const existing = await getStreak(db, userId, missionKey);
	const best = Math.max(existing?.bestStreak ?? 0, current);
	const lastMetDate =
		[...metDates].sort().reverse()[0] ?? existing?.lastMetDate ?? null;

	await db
		.prepare(
			`INSERT INTO habit_streaks (user_id, mission_key, current_streak, best_streak, last_met_date, restarted_at)
			 VALUES (?, ?, ?, ?, ?, ?)
			 ON CONFLICT(user_id, mission_key) DO UPDATE SET
			   current_streak = excluded.current_streak,
			   best_streak = excluded.best_streak,
			   last_met_date = excluded.last_met_date`
		)
		.bind(userId, missionKey, current, best, lastMetDate, existing?.restartedAt ?? null)
		.run();

	return {
		userId,
		missionKey,
		currentStreak: current,
		bestStreak: best,
		lastMetDate,
		restartedAt: existing?.restartedAt ?? null
	};
}

export async function upsertCheckin(
	db: D1Database,
	params: {
		userId: string;
		input: CheckinInput;
		localDate?: string;
	}
): Promise<{ checkin: HabitCheckin; streak: HabitStreak }> {
	const localDate = params.localDate ?? todayWib();
	if (!isValidLocalDate(localDate)) throw error(400, 'Tanggal tidak valid.');
	if (!isHabitMissionKey(params.input.missionKey)) {
		throw error(400, 'Misi tidak termasuk pilot.');
	}

	const normalized = normalizeCheckinPayload(params.input);
	const existing = await getCheckin(db, params.userId, params.input.missionKey, localDate);
	const id = existing?.id ?? crypto.randomUUID();
	const createdAt = existing?.createdAt ?? nowMs();
	const updatedAt = nowMs();

	await db
		.prepare(
			`INSERT INTO habit_checkins (
			   id, user_id, mission_key, local_date, status, detail_json, duration_bucket,
			   optional_reflection, is_day_met, created_at, updated_at
			 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(user_id, mission_key, local_date) DO UPDATE SET
			   status = excluded.status,
			   detail_json = excluded.detail_json,
			   duration_bucket = excluded.duration_bucket,
			   optional_reflection = excluded.optional_reflection,
			   is_day_met = excluded.is_day_met,
			   updated_at = excluded.updated_at`
		)
		.bind(
			id,
			params.userId,
			params.input.missionKey,
			localDate,
			normalized.status,
			normalized.detailJson,
			normalized.durationBucket,
			normalized.optionalReflection,
			normalized.isDayMet ? 1 : 0,
			createdAt,
			updatedAt
		)
		.run();

	const checkin = (await getCheckin(db, params.userId, params.input.missionKey, localDate))!;
	const streak = await recomputeAndSaveStreak(db, params.userId, params.input.missionKey, localDate);
	return { checkin, streak };
}

export async function restartStreak(
	db: D1Database,
	userId: string,
	missionKey: HabitMissionKey,
	asOfDate = todayWib()
): Promise<HabitStreak> {
	if (!isHabitMissionKey(missionKey)) throw error(400, 'Misi tidak valid.');
	const existing = await getStreak(db, userId, missionKey);
	await db
		.prepare(
			`INSERT INTO habit_streaks (user_id, mission_key, current_streak, best_streak, last_met_date, restarted_at)
			 VALUES (?, ?, 0, ?, ?, ?)
			 ON CONFLICT(user_id, mission_key) DO UPDATE SET
			   current_streak = 0,
			   restarted_at = excluded.restarted_at`
		)
		.bind(
			userId,
			missionKey,
			existing?.bestStreak ?? 0,
			existing?.lastMetDate ?? null,
			asOfDate
		)
		.run();

	// History preserved in habit_checkins; only current streak counter resets until next met day.
	return {
		userId,
		missionKey,
		currentStreak: 0,
		bestStreak: existing?.bestStreak ?? 0,
		lastMetDate: existing?.lastMetDate ?? null,
		restartedAt: asOfDate
	};
}

export async function getTodayDashboard(
	db: D1Database,
	userId: string,
	localDate = todayWib()
): Promise<{ localDate: string; cards: MissionTodayCard[] }> {
	const missions = await listActiveMissions(db);
	const cards: MissionTodayCard[] = [];

	for (const mission of missions) {
		const [checkin, streak] = await Promise.all([
			getCheckin(db, userId, mission.key, localDate),
			getStreak(db, userId, mission.key)
		]);
		cards.push({
			mission,
			checkin,
			streak,
			dayStatus: dayStatusFor(checkin),
			supportCopy: supportCopyFor(mission.key, checkin)
		});
	}

	return { localDate, cards };
}

export async function getHabitSummary(
	db: D1Database,
	userId: string,
	rangeDays: 7 | 28 = 7,
	endDate = todayWib()
): Promise<HabitSummary> {
	const startDate = addDays(endDate, -(rangeDays - 1));
	const missions = await listActiveMissions(db);
	const missionSummaries: HabitSummary['missions'] = [];

	for (const mission of missions) {
		const checkins = await listCheckinsInRange(db, userId, mission.key, startDate, endDate);
		const metDates = checkins.filter((c) => c.isDayMet).map((c) => c.localDate);
		const metSet = new Set(metDates);
		const week = countMetInWindow(metSet, endDate, 7);
		const totalMet = metSet.size;
		const currentStreak = computeCurrentStreak(metSet, endDate);

		// crude trend: compare first half vs second half met density
		const mid = addDays(startDate, Math.floor(rangeDays / 2) - 1);
		const firstHalf = checkins.filter((c) => c.isDayMet && c.localDate <= mid).length;
		const secondHalf = checkins.filter((c) => c.isDayMet && c.localDate > mid).length;
		let trend: 'membaik' | 'stabil' | 'perlu_pendampingan' = 'stabil';
		if (secondHalf > firstHalf) trend = 'membaik';
		else if (totalMet < Math.ceil(rangeDays * 0.4)) trend = 'perlu_pendampingan';

		missionSummaries.push({
			key: mission.key,
			title: mission.title,
			metDays: totalMet,
			consistent5of7: isConsistent5of7(metSet, endDate),
			currentStreak,
			trend
		});
	}

	return { rangeDays, endDate, startDate, missions: missionSummaries };
}

/** Aggregate daily streak for layout widget: max current streak across 3 missions + any met today. */
export async function getHabitDailyStreakSummary(
	db: D1Database,
	userId: string,
	localDate = todayWib()
): Promise<{ count: number; isCheckedToday: boolean }> {
	try {
		const { cards } = await getTodayDashboard(db, userId, localDate);
		const count = cards.reduce((max, card) => Math.max(max, card.streak?.currentStreak ?? 0), 0);
		const isCheckedToday = cards.some((card) => card.dayStatus === 'done' || card.dayStatus === 'partial');
		return { count, isCheckedToday };
	} catch (err) {
		// Tables may not exist yet before migration — fall back without breaking layout.
		const message = `${(err as Error)?.message ?? err}`.toLowerCase();
		if (message.includes('no such table') || message.includes('habit_')) {
			return { count: 0, isCheckedToday: false };
		}
		throw err;
	}
}

export function parseCheckinBody(body: unknown): CheckinInput {
	if (!body || typeof body !== 'object') throw error(400, 'Body tidak valid.');
	const data = body as Record<string, unknown>;
	const missionKey = data.missionKey ?? data.mission_key;
	if (!isHabitMissionKey(missionKey)) throw error(400, 'missionKey tidak valid untuk pilot.');

	if (missionKey === 'shalat_wajib') {
		const timesRaw = (data.times ?? {}) as Record<string, unknown>;
		const times: Partial<Record<ShalatTime, ShalatStatus>> = {};
		for (const [key, value] of Object.entries(timesRaw)) {
			if (!isShalatTime(key)) continue;
			if (typeof value === 'string' && isShalatStatus(value)) times[key] = value;
		}
		return {
			missionKey,
			times,
			optionalReflection: (data.optionalReflection ?? data.optional_reflection) as string | null
		};
	}

	if (missionKey === 'quran_harian') {
		const mode = String(data.mode ?? '');
		const durationBucket = String(data.durationBucket ?? data.duration_bucket ?? '');
		if (!isQuranMode(mode) || !isDurationBucket(durationBucket)) {
			throw error(400, 'mode dan durationBucket wajib untuk misi Al-Qur\'an.');
		}
		return {
			missionKey,
			mode,
			durationBucket,
			optionalReflection: (data.optionalReflection ?? data.optional_reflection) as string | null
		};
	}

	const done = Boolean(data.done ?? data.status === 'sudah');
	const categoryRaw = data.category ? String(data.category) : undefined;
	return {
		missionKey,
		done,
		category: categoryRaw && isKebaikanCategory(categoryRaw) ? categoryRaw : undefined,
		optionalReflection: (data.optionalReflection ?? data.optional_reflection) as string | null
	};
}

const GUARDIAN_CONFIRMATIONS = ['sesuai_pantauan', 'perlu_dibicarakan', 'belum_sempat'] as const;
export type GuardianConfirmation = (typeof GUARDIAN_CONFIRMATIONS)[number];

const isGuardianConfirmation = (value: string): value is GuardianConfirmation =>
	(GUARDIAN_CONFIRMATIONS as readonly string[]).includes(value);

const clampNote = (value: unknown, max = 280): string | null => {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim().replace(/\s+/g, ' ');
	if (!trimmed) return null;
	return trimmed.slice(0, max);
};

export async function upsertGuardianWeekly(
	db: D1Database,
	params: {
		childUserId: string;
		guardianUserId: string;
		confirmation: GuardianConfirmation;
		note?: string | null;
		asOfDate?: string;
	}
) {
	if (!isGuardianConfirmation(params.confirmation)) {
		throw error(400, 'Konfirmasi orang tua tidak valid.');
	}
	const weekStart = weekStartMonday(params.asOfDate ?? todayWib());
	const id = crypto.randomUUID();
	const createdAt = nowMs();
	const note = clampNote(params.note);

	await db
		.prepare(
			`INSERT INTO habit_guardian_weekly (
			   id, user_id, guardian_user_id, week_start, confirmation, note, created_at
			 ) VALUES (?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(user_id, guardian_user_id, week_start) DO UPDATE SET
			   confirmation = excluded.confirmation,
			   note = excluded.note,
			   created_at = excluded.created_at`
		)
		.bind(
			id,
			params.childUserId,
			params.guardianUserId,
			weekStart,
			params.confirmation,
			note,
			createdAt
		)
		.run();

	return {
		weekStart,
		confirmation: params.confirmation,
		note
	};
}

export async function upsertMentorWeekly(
	db: D1Database,
	params: {
		childUserId: string;
		mentorUserId: string;
		note: string;
		asOfDate?: string;
	}
) {
	const note = clampNote(params.note, 500);
	if (!note) throw error(400, 'Catatan mentor wajib diisi (tanpa detail uzur).');
	const weekStart = weekStartMonday(params.asOfDate ?? todayWib());
	const id = crypto.randomUUID();
	const createdAt = nowMs();

	await db
		.prepare(
			`INSERT INTO habit_mentor_weekly (
			   id, user_id, mentor_user_id, week_start, note, created_at
			 ) VALUES (?, ?, ?, ?, ?, ?)
			 ON CONFLICT(user_id, mentor_user_id, week_start) DO UPDATE SET
			   note = excluded.note,
			   created_at = excluded.created_at`
		)
		.bind(id, params.childUserId, params.mentorUserId, weekStart, note, createdAt)
		.run();

	return { weekStart, note };
}

/**
 * Mentor trends for a list of child user ids — no uzur details, no public ranking.
 * Returns children needing private support when weekly consistency is weak.
 */
export async function getMentorTrends(
	db: D1Database,
	childUserIds: string[],
	endDate = todayWib()
) {
	const uniqueIds = [...new Set(childUserIds.filter(Boolean))];
	const rows: Array<{
		userId: string;
		missions: HabitSummary['missions'];
		needsPrivateSupport: boolean;
	}> = [];

	for (const userId of uniqueIds) {
		const summary = await getHabitSummary(db, userId, 7, endDate);
		const weakCount = summary.missions.filter((m) => !m.consistent5of7).length;
		rows.push({
			userId,
			missions: summary.missions,
			needsPrivateSupport: weakCount >= 2 || summary.missions.some((m) => m.trend === 'perlu_pendampingan')
		});
	}

	return {
		endDate,
		// Stable order by userId only — never sort by piety score.
		children: rows.sort((a, b) => a.userId.localeCompare(b.userId))
	};
}

export async function assertSameOrgUsers(
	db: D1Database,
	actorUserId: string,
	targetUserId: string
): Promise<{ actorOrgId: string | null; targetOrgId: string | null }> {
	const actor = await db
		.prepare(`SELECT org_id as orgId FROM users WHERE id = ?`)
		.bind(actorUserId)
		.first<{ orgId: string | null }>();
	const target = await db
		.prepare(`SELECT org_id as orgId FROM users WHERE id = ?`)
		.bind(targetUserId)
		.first<{ orgId: string | null }>();

	if (!target) throw error(404, 'Santri tidak ditemukan.');
	const actorOrgId = actor?.orgId ?? null;
	const targetOrgId = target.orgId ?? null;
	if (actorOrgId && targetOrgId && actorOrgId !== targetOrgId) {
		throw error(403, 'Tidak boleh mengakses data santri di luar lembaga.');
	}
	return { actorOrgId, targetOrgId };
}
