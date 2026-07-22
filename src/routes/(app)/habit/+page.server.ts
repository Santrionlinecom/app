import type { PageServerLoad } from './$types';
import { getHabitSummary, getTodayDashboard } from '$lib/server/habit/service';
import { todayWib } from '$lib/server/habit/dates';
import { error } from '@sveltejs/kit';
import { assertLoggedIn } from '$lib/server/auth/rbac';

export const load: PageServerLoad = async ({ locals }) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

	const localDate = todayWib();

	try {
		const [today, summary7, summary28] = await Promise.all([
			getTodayDashboard(locals.db, user.id, localDate),
			getHabitSummary(locals.db, user.id, 7, localDate),
			getHabitSummary(locals.db, user.id, 28, localDate)
		]);

		return {
			localDate,
			timezone: 'Asia/Jakarta',
			cards: today.cards,
			summary7,
			summary28,
			migrationReady: true
		};
	} catch (err) {
		const message = `${(err as Error)?.message ?? err}`.toLowerCase();
		if (message.includes('no such table') || message.includes('habit_')) {
			return {
				localDate,
				timezone: 'Asia/Jakarta',
				cards: [],
				summary7: null,
				summary28: null,
				migrationReady: false
			};
		}
		throw err;
	}
};
