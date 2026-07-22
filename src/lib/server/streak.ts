import type { D1Database } from '@cloudflare/workers-types';
import { getHabitDailyStreakSummary } from '$lib/server/habit/service';
import { todayWib } from '$lib/server/habit/dates';

/**
 * Daily streak for dashboard widget.
 * Prefers Habit System pilot data; falls back to zeros if tables not migrated yet.
 */
export const getDailyStreak = async (db: D1Database, userId: string) => {
	return getHabitDailyStreakSummary(db, userId, todayWib());
};
