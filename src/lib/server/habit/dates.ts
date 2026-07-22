/** WIB-first date helpers for Habit System pilot. */

export const HABIT_TIME_ZONE = 'Asia/Jakarta';

const pad2 = (value: number) => String(value).padStart(2, '0');

/** Format a Date as YYYY-MM-DD in the given IANA timezone (default WIB). */
export const formatLocalDate = (date: Date = new Date(), timeZone = HABIT_TIME_ZONE): string => {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(date);

	const year = parts.find((part) => part.type === 'year')?.value;
	const month = parts.find((part) => part.type === 'month')?.value;
	const day = parts.find((part) => part.type === 'day')?.value;
	if (!year || !month || !day) {
		throw new Error('Gagal menghitung tanggal lokal habit.');
	}
	return `${year}-${month}-${day}`;
};

export const todayWib = (now: Date = new Date()) => formatLocalDate(now, HABIT_TIME_ZONE);

export const isValidLocalDate = (value: string): boolean => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const [y, m, d] = value.split('-').map(Number);
	if (!y || !m || !d) return false;
	const probe = new Date(Date.UTC(y, m - 1, d));
	return (
		probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d
	);
};

/** Add days to a YYYY-MM-DD calendar date (date-only arithmetic). */
export const addDays = (localDate: string, days: number): string => {
	const [y, m, d] = localDate.split('-').map(Number);
	const date = new Date(Date.UTC(y, m - 1, d));
	date.setUTCDate(date.getUTCDate() + days);
	return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
};

export const diffDays = (from: string, to: string): number => {
	const [y1, m1, d1] = from.split('-').map(Number);
	const [y2, m2, d2] = to.split('-').map(Number);
	const a = Date.UTC(y1, m1 - 1, d1);
	const b = Date.UTC(y2, m2 - 1, d2);
	return Math.round((b - a) / 86_400_000);
};

/** Monday (WIB calendar) of the week containing localDate. */
export const weekStartMonday = (localDate: string): string => {
	const [y, m, d] = localDate.split('-').map(Number);
	const date = new Date(Date.UTC(y, m - 1, d));
	// 0=Sun ... 6=Sat in UTC calendar for this date-only value
	const day = date.getUTCDay();
	const offset = day === 0 ? -6 : 1 - day;
	return addDays(localDate, offset);
};

export const listDatesInclusive = (start: string, end: string): string[] => {
	if (diffDays(start, end) < 0) return [];
	const out: string[] = [];
	let cursor = start;
	while (true) {
		out.push(cursor);
		if (cursor === end) break;
		cursor = addDays(cursor, 1);
	}
	return out;
};

/** Default pilot window: start today, end = start + 27 days (28 calendar days). */
export const defaultPilotWindow = (startDate = todayWib()) => ({
	startDate,
	endDate: addDays(startDate, 27)
});

/**
 * Count how many of the last `windowDays` ending at `endDate` are "met".
 * Used for weekly 5/7 style checks when windowDays=7.
 */
export const countMetInWindow = (
	metDates: Set<string> | string[],
	endDate: string,
	windowDays: number
): { met: number; total: number; dates: string[] } => {
	const set = metDates instanceof Set ? metDates : new Set(metDates);
	const start = addDays(endDate, -(windowDays - 1));
	const dates = listDatesInclusive(start, endDate);
	let met = 0;
	for (const date of dates) {
		if (set.has(date)) met += 1;
	}
	return { met, total: dates.length, dates };
};

export const isConsistent5of7 = (metDates: Set<string> | string[], endDate: string): boolean =>
	countMetInWindow(metDates, endDate, 7).met >= 5;

/**
 * Recompute current streak of consecutive met days ending at `endDate`.
 * Broken days reset count; history is not deleted by this function.
 */
export const computeCurrentStreak = (
	metDates: Set<string> | string[],
	endDate: string,
	lookback = 120
): number => {
	const set = metDates instanceof Set ? metDates : new Set(metDates);
	let streak = 0;
	let cursor = endDate;
	for (let i = 0; i < lookback; i += 1) {
		if (!set.has(cursor)) break;
		streak += 1;
		cursor = addDays(cursor, -1);
	}
	return streak;
};
