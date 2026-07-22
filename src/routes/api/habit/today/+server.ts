import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTodayDashboard } from '$lib/server/habit/service';
import { todayWib } from '$lib/server/habit/dates';

export const GET: RequestHandler = async ({ locals, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });

	if (!locals.user) {
		return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}
	if (!locals.db) {
		return json({ ok: false, error: 'Layanan data tidak tersedia.' }, { status: 500 });
	}

	try {
		const dashboard = await getTodayDashboard(locals.db, locals.user.id, todayWib());
		return json({
			ok: true,
			localDate: dashboard.localDate,
			timezone: 'Asia/Jakarta',
			missions: dashboard.cards.map((card) => ({
				key: card.mission.key,
				title: card.mission.title,
				description: card.mission.description,
				dayStatus: card.dayStatus,
				supportCopy: card.supportCopy,
				checkin: card.checkin
					? {
							status: card.checkin.status,
							detail: card.checkin.detail,
							durationBucket: card.checkin.durationBucket,
							optionalReflection: card.checkin.optionalReflection,
							isDayMet: card.checkin.isDayMet
						}
					: null,
				streak: card.streak
					? {
							current: card.streak.currentStreak,
							best: card.streak.bestStreak,
							lastMetDate: card.streak.lastMetDate
						}
					: { current: 0, best: 0, lastMetDate: null }
			}))
		});
	} catch (err) {
		const message = `${(err as Error)?.message ?? err}`;
		if (message.toLowerCase().includes('no such table')) {
			return json(
				{
					ok: false,
					error: 'Tabel habit belum siap. Jalankan migrasi 0053_habit_system_pilot.'
				},
				{ status: 503 }
			);
		}
		throw err;
	}
};
