import type { D1Database } from '@cloudflare/workers-types';

export const getDailyStreak = async (db: D1Database, userId: string) => {
	// Simple streak logic: check if user had activity today or yesterday
	// and count consecutive days of activity in the last N days.
	// For now, we return a mock value until the 'activity_logs' schema is finalized.
	// TODO: Replace with real SQL query against activity/setoran tables
	return {
		count: 5,
		isCheckedToday: true
	};
};
