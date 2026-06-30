import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';

type AddonStatusFilter = 'pending' | 'active' | 'rejected' | 'all';

const STATUS_FILTERS: Record<AddonStatusFilter, string | null> = {
	pending: 'trial',
	active: 'aktif',
	rejected: 'expired',
	all: null
};

const statusFromUrl = (value: string | null): AddonStatusFilter => {
	if (value === 'active' || value === 'rejected' || value === 'all') return value;
	return 'pending';
};

const readFormString = (formData: FormData, key: string) => {
	const value = formData.get(key);
	return typeof value === 'string' ? value.trim() : '';
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const { db } = requireSuperAdmin(locals);
	const currentStatus = statusFromUrl(url.searchParams.get('status'));
	const dbStatus = STATUS_FILTERS[currentStatus];

	const whereClause = dbStatus ? 'WHERE a.status = ?' : '';
	const statement = db.prepare(
		`SELECT
			a.id,
			a.lembaga_id AS lembagaId,
			a.tipe_addon AS tipeAddon,
			a.status,
			a.berlaku_hingga AS berlakuHingga,
			a.created_at AS createdAt,
			o.name AS lembagaName,
			o.type AS lembagaType,
			o.slug AS lembagaSlug,
			o.akun_admin_id AS adminId,
			u.email AS adminEmail,
			u.username AS adminName
		 FROM addon_lembaga a
		 LEFT JOIN organizations o ON o.id = a.lembaga_id
		 LEFT JOIN users u ON u.id = o.akun_admin_id
		 ${whereClause}
		 ORDER BY a.created_at DESC
		 LIMIT 200`
	);
	const requests = dbStatus ? await statement.bind(dbStatus).all<any>() : await statement.all<any>();

	const counts = await db
		.prepare(
			`SELECT status, COUNT(*) AS count
			 FROM addon_lembaga
			 WHERE status IN ('trial', 'aktif', 'expired')
			 GROUP BY status`
		)
		.all<{ status: string; count: number }>();

	const countMap = { pending: 0, active: 0, rejected: 0, all: 0 };
	for (const item of counts.results ?? []) {
		const count = Number(item.count ?? 0);
		countMap.all += count;
		if (item.status === 'trial') countMap.pending = count;
		if (item.status === 'aktif') countMap.active = count;
		if (item.status === 'expired') countMap.rejected = count;
	}

	return {
		requests: requests.results ?? [],
		currentStatus,
		counts: countMap,
		success: url.searchParams.get('success')
	};
};

export const actions: Actions = {
	approve: async ({ locals, request }) => {
		const { db } = requireSuperAdmin(locals);
		const formData = await request.formData();
		const id = readFormString(formData, 'id');

		if (!id) {
			return fail(400, { error: 'ID request addon tidak valid.' });
		}

		const existing = await db
			.prepare("SELECT id, status FROM addon_lembaga WHERE id = ? LIMIT 1")
			.bind(id)
			.first<{ id: string; status: string }>();

		if (!existing) {
			return fail(404, { error: 'Request addon tidak ditemukan.' });
		}

		if (existing.status === 'aktif') {
			return fail(400, { error: 'Addon ini sudah aktif.' });
		}

		const now = Date.now();
		await db
			.prepare("UPDATE addon_lembaga SET status = 'aktif', berlaku_hingga = NULL, created_at = ? WHERE id = ?")
			.bind(now, id)
			.run();

		throw redirect(303, '/admin/super/addons?status=pending&success=approved');
	},

	reject: async ({ locals, request }) => {
		const { db } = requireSuperAdmin(locals);
		const formData = await request.formData();
		const id = readFormString(formData, 'id');

		if (!id) {
			return fail(400, { error: 'ID request addon tidak valid.' });
		}

		const existing = await db
			.prepare("SELECT id, status FROM addon_lembaga WHERE id = ? LIMIT 1")
			.bind(id)
			.first<{ id: string; status: string }>();

		if (!existing) {
			return fail(404, { error: 'Request addon tidak ditemukan.' });
		}

		if (existing.status === 'expired') {
			return fail(400, { error: 'Request addon ini sudah ditolak.' });
		}

		const now = Date.now();
		await db
			.prepare("UPDATE addon_lembaga SET status = 'expired', berlaku_hingga = ?, created_at = ? WHERE id = ?")
			.bind(now, now, id)
			.run();

		throw redirect(303, '/admin/super/addons?status=pending&success=rejected');
	}
};
