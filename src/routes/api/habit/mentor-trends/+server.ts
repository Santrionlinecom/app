import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { normalizeRole } from '$lib/server/auth/rbac';
import { getMentorTrends } from '$lib/server/habit/service';
import { todayWib } from '$lib/server/habit/dates';

const allowedRoles = new Set([
	'admin',
	'kepala_tpq',
	'kepala_tahfidz',
	'koordinator',
	'wali_kelas',
	'ustadz',
	'ustadzah',
	'musyrif',
	'pengasuh',
	'SUPER_ADMIN'
]);

export const GET: RequestHandler = async ({ locals, url, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });

	if (!locals.user) {
		return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}
	if (!locals.db) {
		return json({ ok: false, error: 'Layanan data tidak tersedia.' }, { status: 500 });
	}

	const role = normalizeRole(locals.user.role);
	if (!role || !allowedRoles.has(role)) {
		return json({ ok: false, error: 'Hanya mentor/pengurus yang berwenang.' }, { status: 403 });
	}

	const idsParam = url.searchParams.get('userIds') ?? url.searchParams.get('user_ids') ?? '';
	const childUserIds = idsParam
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean)
		.slice(0, 50);

	if (childUserIds.length === 0) {
		return json({
			ok: true,
			message: 'Kirim ?userIds=id1,id2 untuk tren privat. Tidak ada leaderboard ibadah.',
			endDate: todayWib(),
			children: []
		});
	}

	try {
		// Enforce same-org when actor has org
		const actorOrg = locals.user.orgId ?? null;
		if (actorOrg) {
			const placeholders = childUserIds.map(() => '?').join(',');
			const { results } = await locals.db
				.prepare(`SELECT id, org_id as orgId FROM users WHERE id IN (${placeholders})`)
				.bind(...childUserIds)
				.all<{ id: string; orgId: string | null }>();
			const allowed = new Set(
				(results ?? []).filter((row) => row.orgId === actorOrg).map((row) => row.id)
			);
			const filtered = childUserIds.filter((id) => allowed.has(id));
			const trends = await getMentorTrends(locals.db, filtered, todayWib());
			return json({ ok: true, ...trends });
		}

		const trends = await getMentorTrends(locals.db, childUserIds, todayWib());
		return json({ ok: true, ...trends });
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
