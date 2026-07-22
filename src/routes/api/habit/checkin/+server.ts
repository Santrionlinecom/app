import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseCheckinBody, upsertCheckin } from '$lib/server/habit/service';
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

	try {
		const input = parseCheckinBody(body);
		const localDate =
			body && typeof body === 'object' && 'localDate' in body && typeof (body as { localDate?: unknown }).localDate === 'string'
				? (body as { localDate: string }).localDate
				: todayWib();

		// Pilot: only allow "today" check-in from client to reduce backdating abuse.
		if (localDate !== todayWib()) {
			return json({ ok: false, error: 'Check-in pilot hanya untuk hari ini (WIB).' }, { status: 400 });
		}

		const result = await upsertCheckin(locals.db, {
			userId: locals.user.id,
			input,
			localDate
		});

		return json({
			ok: true,
			localDate,
			checkin: {
				missionKey: result.checkin.missionKey,
				status: result.checkin.status,
				detail: result.checkin.detail,
				durationBucket: result.checkin.durationBucket,
				optionalReflection: result.checkin.optionalReflection,
				isDayMet: result.checkin.isDayMet
			},
			streak: {
				current: result.streak.currentStreak,
				best: result.streak.bestStreak,
				lastMetDate: result.streak.lastMetDate,
				restartedAt: result.streak.restartedAt
			}
		});
	} catch (err) {
		const status = typeof (err as { status?: number })?.status === 'number' ? (err as { status: number }).status : 500;
		const message = `${(err as Error)?.message ?? err}`;
		if (message.toLowerCase().includes('no such table')) {
			return json(
				{ ok: false, error: 'Tabel habit belum siap. Jalankan migrasi 0053_habit_system_pilot.' },
				{ status: 503 }
			);
		}
		if (status >= 400 && status < 500) {
			return json({ ok: false, error: message.replace(/^Error:\s*/, '') }, { status });
		}
		throw err;
	}
};
