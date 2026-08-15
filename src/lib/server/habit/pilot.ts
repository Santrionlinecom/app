import type { D1Database } from '@cloudflare/workers-types';
import { error } from '@sveltejs/kit';
import { addDays, computeCurrentStreak, diffDays, isValidLocalDate, listDatesInclusive, todayWib } from './dates';
import { listActiveMissions, listCheckinsInRange } from './service';
import { HABIT_MISSION_KEYS, type HabitMissionKey } from './types';

export type PilotParticipant = {
	id: string;
	userId: string;
	label: string | null;
	guardianUserId: string | null;
	startDate: string;
	endDate: string;
	active: boolean;
	notes: string | null;
	createdAt: number;
	userUsername: string | null;
	userEmail: string;
	guardianUsername: string | null;
	guardianEmail: string | null;
};

type ParticipantRow = {
	id: string;
	user_id: string;
	label: string | null;
	guardian_user_id: string | null;
	start_date: string;
	end_date: string;
	active: number;
	notes: string | null;
	created_at: number;
	user_username: string | null;
	user_email: string;
	guardian_username: string | null;
	guardian_email: string | null;
};

const mapParticipant = (row: ParticipantRow): PilotParticipant => ({
	id: row.id,
	userId: row.user_id,
	label: row.label,
	guardianUserId: row.guardian_user_id,
	startDate: row.start_date,
	endDate: row.end_date,
	active: row.active === 1,
	notes: row.notes,
	createdAt: row.created_at,
	userUsername: row.user_username,
	userEmail: row.user_email,
	guardianUsername: row.guardian_username,
	guardianEmail: row.guardian_email
});

export async function listPilotParticipants(db: D1Database): Promise<PilotParticipant[]> {
	const { results } = await db
		.prepare(
			`SELECT
				p.id, p.user_id, p.label, p.guardian_user_id, p.start_date, p.end_date,
				p.active, p.notes, p.created_at,
				u.username AS user_username, u.email AS user_email,
				g.username AS guardian_username, g.email AS guardian_email
			 FROM pilot_participants p
			 JOIN users u ON u.id = p.user_id
			 LEFT JOIN users g ON g.id = p.guardian_user_id
			 ORDER BY p.active DESC, p.start_date ASC, p.created_at ASC
			 LIMIT 100`
		)
		.all<ParticipantRow>();
	return (results ?? []).map(mapParticipant);
}

const normalizeEmail = (value: unknown): string | null => {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim().toLowerCase();
	return trimmed ? trimmed : null;
};

const clampText = (value: unknown, max: number): string | null => {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim().replace(/\s+/g, ' ');
	if (!trimmed) return null;
	return trimmed.slice(0, max);
};

export async function addPilotParticipant(
	db: D1Database,
	params: {
		userEmail: string;
		label?: string | null;
		guardianEmail?: string | null;
		startDate: string;
		endDate: string;
		notes?: string | null;
	}
): Promise<PilotParticipant> {
	const email = normalizeEmail(params.userEmail);
	if (!email) throw error(400, 'Email santri wajib diisi.');
	if (!isValidLocalDate(params.startDate) || !isValidLocalDate(params.endDate)) {
		throw error(400, 'Format tanggal salah (YYYY-MM-DD).');
	}
	if (diffDays(params.startDate, params.endDate) < 0) {
		throw error(400, 'Tanggal selesai harus setelah tanggal mulai.');
	}

	const user = await db
		.prepare(`SELECT id, username, email FROM users WHERE email = ?`)
		.bind(email)
		.first<{ id: string; username: string | null; email: string }>();
	if (!user) throw error(404, 'Santri dengan email tersebut tidak ditemukan.');

	const guardianEmail = normalizeEmail(params.guardianEmail);
	let guardianUserId: string | null = null;
	if (guardianEmail) {
		const guardian = await db
			.prepare(`SELECT id FROM users WHERE email = ?`)
			.bind(guardianEmail)
			.first<{ id: string }>();
		if (!guardian) throw error(404, 'Orang tua dengan email tersebut tidak ditemukan.');
		guardianUserId = guardian.id;
	}

	const id = crypto.randomUUID();
	await db
		.prepare(
			`INSERT INTO pilot_participants (
			   id, user_id, label, guardian_user_id, start_date, end_date, active, notes, created_at
			 ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
		)
		.bind(
			id,
			user.id,
			clampText(params.label, 120),
			guardianUserId,
			params.startDate,
			params.endDate,
			clampText(params.notes, 500),
			Date.now()
		)
		.run();

	return {
		id,
		userId: user.id,
		label: clampText(params.label, 120),
		guardianUserId,
		startDate: params.startDate,
		endDate: params.endDate,
		active: true,
		notes: clampText(params.notes, 500),
		createdAt: Date.now(),
		userUsername: user.username,
		userEmail: user.email,
		guardianUsername: null,
		guardianEmail
	};
}

export async function removePilotParticipant(db: D1Database, id: string): Promise<void> {
	const result = await db.prepare(`DELETE FROM pilot_participants WHERE id = ?`).bind(id).run();
	if (Number(result.meta?.changes ?? 0) === 0) {
		throw error(404, 'Peserta pilot tidak ditemukan.');
	}
}

export async function setPilotParticipantActive(db: D1Database, id: string, active: boolean): Promise<void> {
	const result = await db
		.prepare(`UPDATE pilot_participants SET active = ? WHERE id = ?`)
		.bind(active ? 1 : 0, id)
		.run();
	if (Number(result.meta?.changes ?? 0) === 0) {
		throw error(404, 'Peserta pilot tidak ditemukan.');
	}
}

export type PilotDayCell = 'met' | 'miss' | 'future';

export type PilotMissionMonitor = {
	key: HabitMissionKey;
	title: string;
	metDays: number;
	totalDays: number;
	currentStreak: number;
	trend: 'membaik' | 'stabil' | 'perlu_pendampingan';
	grid: Array<{ date: string; cell: PilotDayCell }>;
};

export type GuardianConfirmationRow = {
	weekStart: string;
	confirmation: string;
	note: string | null;
};

export type PilotMonitor = {
	windowStart: string;
	windowEnd: string;
	today: string;
	elapsedDays: number;
	totalWindowDays: number;
	missions: PilotMissionMonitor[];
	guardianConfirmations: GuardianConfirmationRow[];
};

export async function getPilotMonitor(
	db: D1Database,
	participant: PilotParticipant,
	now: Date = new Date()
): Promise<PilotMonitor> {
	const today = todayWib(now);
	const windowStart = participant.startDate;
	const windowEnd = diffDays(participant.endDate, today) < 0 ? participant.endDate : today;
	const dates = listDatesInclusive(windowStart, windowEnd);
	const totalWindowDays = Math.max(diffDays(participant.startDate, participant.endDate) + 1, 0);

	const missions = await listActiveMissions(db);
	const missionMonitors: PilotMissionMonitor[] = [];

	for (const mission of missions) {
		const checkins = await listCheckinsInRange(db, participant.userId, mission.key, windowStart, windowEnd);
		const metDates = new Set(checkins.filter((c) => c.isDayMet).map((c) => c.localDate));
		const grid = dates.map((date) => {
			if (metDates.has(date)) return { date, cell: 'met' as const };
			if (date > today) return { date, cell: 'future' as const };
			return { date, cell: 'miss' as const };
		});

		const mid = dates.length > 1 ? dates[Math.floor((dates.length - 1) / 2)] : windowStart;
		const firstHalf = dates.filter((d) => d <= mid && metDates.has(d)).length;
		const secondHalf = dates.filter((d) => d > mid && metDates.has(d)).length;
		let trend: PilotMissionMonitor['trend'] = 'stabil';
		if (secondHalf > firstHalf) trend = 'membaik';
		else if (metDates.size < Math.ceil((dates.length || 1) * 0.4)) trend = 'perlu_pendampingan';

		missionMonitors.push({
			key: mission.key,
			title: mission.title,
			metDays: metDates.size,
			totalDays: dates.length,
			currentStreak: computeCurrentStreak(metDates, today),
			trend,
			grid
		});
	}

	const { results: guardianRows } = await db
		.prepare(
			`SELECT week_start as weekStart, confirmation, note
			 FROM habit_guardian_weekly
			 WHERE user_id = ?
			 ORDER BY week_start ASC`
		)
		.bind(participant.userId)
		.all<GuardianConfirmationRow>();

	return {
		windowStart,
		windowEnd,
		today,
		elapsedDays: dates.length,
		totalWindowDays,
		missions: missionMonitors,
		guardianConfirmations: (guardianRows ?? []).map((row) => ({
			weekStart: row.weekStart,
			confirmation: row.confirmation,
			note: row.note
		}))
	};
}
