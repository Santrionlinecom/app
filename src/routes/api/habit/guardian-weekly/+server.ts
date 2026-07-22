import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { normalizeRole } from '$lib/server/auth/rbac';
import { assertSameOrgUsers, upsertGuardianWeekly } from '$lib/server/habit/service';
import { todayWib } from '$lib/server/habit/dates';

const allowedRoles = new Set(['wali', 'admin', 'kepala_tpq', 'koordinator', 'wali_kelas']);

export const POST: RequestHandler = async ({ locals, request, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });

	if (!locals.user) {
		return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}
	if (!locals.db) {
		return json({ ok: false, error: 'Layanan data tidak tersedia.' }, { status: 500 });
	}

	const role = normalizeRole(locals.user.role);
	if (!role || !allowedRoles.has(role)) {
		return json({ ok: false, error: 'Hanya orang tua/wali atau pengurus yang berwenang.' }, { status: 403 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'JSON tidak valid.' }, { status: 400 });
	}

	const data = (body ?? {}) as Record<string, unknown>;
	const childUserId = String(data.childUserId ?? data.user_id ?? '').trim();
	const confirmation = String(data.confirmation ?? '').trim();
	if (!childUserId) {
		return json({ ok: false, error: 'childUserId wajib.' }, { status: 400 });
	}

	try {
		await assertSameOrgUsers(locals.db, locals.user.id, childUserId);
		const result = await upsertGuardianWeekly(locals.db, {
			childUserId,
			guardianUserId: locals.user.id,
			confirmation: confirmation as 'sesuai_pantauan' | 'perlu_dibicarakan' | 'belum_sempat',
			note: (data.note as string | null) ?? null,
			asOfDate: todayWib()
		});
		return json({ ok: true, ...result });
	} catch (err) {
		const status =
			typeof (err as { status?: number })?.status === 'number' ? (err as { status: number }).status : 500;
		const message = `${(err as Error)?.message ?? err}`.replace(/^Error:\s*/, '');
		if (message.toLowerCase().includes('no such table')) {
			return json(
				{ ok: false, error: 'Tabel habit belum siap. Jalankan migrasi 0053_habit_system_pilot.' },
				{ status: 503 }
			);
		}
		if (status >= 400 && status < 500) {
			return json({ ok: false, error: message }, { status });
		}
		throw err;
	}
};
