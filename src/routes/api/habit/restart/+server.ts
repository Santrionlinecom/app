import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isHabitMissionKey } from '$lib/server/habit/types';
import { restartStreak } from '$lib/server/habit/service';
import { todayWib } from '$lib/server/habit/dates';

export const POST: RequestHandler = async ({ locals, request, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });

	if (!locals.user) {
		return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}
	if (!locals.db) {
		return json({ ok: false, error: 'Layanan data tidak tersedia.' }, { status: 500 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'JSON tidak valid.' }, { status: 400 });
	}

	const missionKey =
		body && typeof body === 'object'
			? ((body as { missionKey?: unknown; mission_key?: unknown }).missionKey ??
				(body as { mission_key?: unknown }).mission_key)
			: null;

	if (!isHabitMissionKey(missionKey)) {
		return json({ ok: false, error: 'missionKey tidak valid.' }, { status: 400 });
	}

	try {
		const streak = await restartStreak(locals.db, locals.user.id, missionKey, todayWib());
		return json({
			ok: true,
			message: 'Bismillah, kita mulai lagi hari ini. Riwayat sebelumnya tetap tersimpan.',
			streak: {
				current: streak.currentStreak,
				best: streak.bestStreak,
				lastMetDate: streak.lastMetDate,
				restartedAt: streak.restartedAt
			}
		});
	} catch (err) {
		const message = `${(err as Error)?.message ?? err}`;
		if (message.toLowerCase().includes('no such table')) {
			return json(
				{ ok: false, error: 'Tabel habit belum siap. Jalankan migrasi 0053_habit_system_pilot.' },
				{ status: 503 }
			);
		}
		throw err;
	}
};
