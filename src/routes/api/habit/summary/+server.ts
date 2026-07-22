import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getHabitSummary } from '$lib/server/habit/service';
import { todayWib } from '$lib/server/habit/dates';

export const GET: RequestHandler = async ({ locals, url, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });

	if (!locals.user) {
		return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}
	if (!locals.db) {
		return json({ ok: false, error: 'Layanan data tidak tersedia.' }, { status: 500 });
	}

	const rangeRaw = url.searchParams.get('range') ?? '7';
	const rangeDays = rangeRaw === '28' ? 28 : 7;

	try {
		const summary = await getHabitSummary(locals.db, locals.user.id, rangeDays, todayWib());
		return json({ ok: true, summary });
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
