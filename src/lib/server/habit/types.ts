export const HABIT_MISSION_KEYS = ['shalat_wajib', 'quran_harian', 'amal_adab_harian'] as const;

export type HabitMissionKey = (typeof HABIT_MISSION_KEYS)[number];

export const isHabitMissionKey = (value: unknown): value is HabitMissionKey =>
	typeof value === 'string' && (HABIT_MISSION_KEYS as readonly string[]).includes(value);

export const SHALAT_TIMES = ['subuh', 'zuhur', 'asar', 'magrib', 'isya'] as const;
export type ShalatTime = (typeof SHALAT_TIMES)[number];

export const SHALAT_STATUSES = ['tepat_waktu', 'terlaksana', 'belum', 'uzur'] as const;
export type ShalatStatus = (typeof SHALAT_STATUSES)[number];

export const QURAN_MODES = ['membaca', 'menyimak', 'menghafal', 'murajaah'] as const;
export type QuranMode = (typeof QURAN_MODES)[number];

export const QURAN_DURATION_BUCKETS = ['5-9', '10-19', '20+'] as const;
export type QuranDurationBucket = (typeof QURAN_DURATION_BUCKETS)[number];

export const KEBAIKAN_CATEGORIES = [
	'orang_tua',
	'guru_belajar',
	'teman_lisan',
	'amanah_disiplin',
	'kebersihan_lingkungan',
	'lainnya'
] as const;
export type KebaikanCategory = (typeof KEBAIKAN_CATEGORIES)[number];

export type HabitMission = {
	key: HabitMissionKey;
	title: string;
	description: string;
	sortOrder: number;
	isActive: boolean;
};

export type ShalatDetail = {
	times: Partial<Record<ShalatTime, ShalatStatus>>;
	keptCount: number;
};

export type QuranDetail = {
	mode: QuranMode;
};

export type KebaikanDetail = {
	category: KebaikanCategory;
};

export type HabitCheckin = {
	id: string;
	userId: string;
	missionKey: HabitMissionKey;
	localDate: string;
	status: string;
	detail: Record<string, unknown> | null;
	durationBucket: QuranDurationBucket | null;
	optionalReflection: string | null;
	isDayMet: boolean;
	createdAt: number;
	updatedAt: number;
};

export type HabitStreak = {
	userId: string;
	missionKey: HabitMissionKey;
	currentStreak: number;
	bestStreak: number;
	lastMetDate: string | null;
	restartedAt: string | null;
};

export type MissionTodayCard = {
	mission: HabitMission;
	checkin: HabitCheckin | null;
	streak: HabitStreak | null;
	dayStatus: 'pending' | 'partial' | 'done';
	supportCopy: string;
};

export type WeeklyConsistency = {
	met: number;
	total: number;
	consistent: boolean;
};

export type HabitSummary = {
	rangeDays: 7 | 28;
	endDate: string;
	startDate: string;
	missions: Array<{
		key: HabitMissionKey;
		title: string;
		metDays: number;
		consistent5of7: boolean;
		currentStreak: number;
		trend: 'membaik' | 'stabil' | 'perlu_pendampingan';
	}>;
};
