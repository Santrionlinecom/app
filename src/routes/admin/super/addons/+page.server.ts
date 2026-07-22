import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { logActivity } from '$lib/server/activity-logs';
import {
	ADDON_NAMES,
	ADDON_REQUEST_STATUS,
	addonLabel,
	isAddonActiveRow,
	setAddonStatus,
	type AddonDbStatus
} from '$lib/server/addons';
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

const loadAddonById = async (db: App.Locals['db'], id: string) => {
	if (!db) return null;
	return db
		.prepare(
			`SELECT
				a.id,
				a.lembaga_id AS lembagaId,
				a.tipe_addon AS tipeAddon,
				a.status,
				a.berlaku_hingga AS berlakuHingga,
				o.name AS lembagaName
			 FROM addon_lembaga a
			 LEFT JOIN organizations o ON o.id = a.lembaga_id
			 WHERE a.id = ?
			 LIMIT 1`
		)
		.bind(id)
		.first<{
			id: string;
			lembagaId: string;
			tipeAddon: string;
			status: string;
			berlakuHingga: number | null;
			lembagaName: string | null;
		}>();
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

const mutateAddon = async (params: {
	locals: App.Locals;
	request: Request;
	nextStatus: AddonDbStatus;
	successKey: string;
	action: string;
	allowedFrom: string[];
	invalidMessage: string;
}) => {
	const { db, user } = requireSuperAdmin(params.locals);
	const formData = await params.request.formData();
	const id = readFormString(formData, 'id');

	if (!id) {
		return fail(400, { error: 'ID request addon tidak valid.' });
	}

	const existing = await loadAddonById(db, id);
	if (!existing) {
		return fail(404, { error: 'Request addon tidak ditemukan.' });
	}

	if (!params.allowedFrom.includes(existing.status)) {
		return fail(400, { error: params.invalidMessage });
	}

	if (
		params.nextStatus === 'aktif' &&
		isAddonActiveRow(existing.status, existing.berlakuHingga)
	) {
		return fail(400, { error: 'Addon ini sudah aktif.' });
	}

	await setAddonStatus(db, {
		id: existing.id,
		status: params.nextStatus,
		berlakuHingga: params.nextStatus === 'expired' ? Date.now() : null
	});

	await logActivity(db, {
		userId: user.id,
		action: params.action,
		metadata: {
			addonId: existing.id,
			addonType: existing.tipeAddon,
			addonName: ADDON_NAMES[existing.tipeAddon as keyof typeof ADDON_NAMES] ?? existing.tipeAddon,
			lembagaId: existing.lembagaId,
			lembagaName: existing.lembagaName,
			fromStatus: existing.status,
			toStatus: params.nextStatus
		}
	});

	throw redirect(303, `/admin/super/addons?status=${params.successKey.includes('approved') || params.successKey.includes('reactivated') ? 'active' : params.successKey.includes('rejected') || params.successKey.includes('revoked') ? 'rejected' : 'pending'}&success=${params.successKey}`);
};

export const actions: Actions = {
	approve: async ({ locals, request }) =>
		mutateAddon({
			locals,
			request,
			nextStatus: 'aktif',
			successKey: 'approved',
			action: 'ADDON_APPROVE',
			allowedFrom: [ADDON_REQUEST_STATUS, 'expired'],
			invalidMessage: 'Hanya request menunggu/ditolak yang bisa disetujui.'
		}),
	reject: async ({ locals, request }) =>
		mutateAddon({
			locals,
			request,
			nextStatus: 'expired',
			successKey: 'rejected',
			action: 'ADDON_REJECT',
			allowedFrom: [ADDON_REQUEST_STATUS],
			invalidMessage: 'Hanya request menunggu yang bisa ditolak.'
		}),
	revoke: async ({ locals, request }) =>
		mutateAddon({
			locals,
			request,
			nextStatus: 'expired',
			successKey: 'revoked',
			action: 'ADDON_REVOKE',
			allowedFrom: ['aktif'],
			invalidMessage: 'Hanya addon aktif yang bisa dicabut.'
		}),
	reactivate: async ({ locals, request }) =>
		mutateAddon({
			locals,
			request,
			nextStatus: 'aktif',
			successKey: 'reactivated',
			action: 'ADDON_REACTIVATE',
			allowedFrom: ['expired'],
			invalidMessage: 'Hanya addon ditolak/nonaktif yang bisa diaktifkan ulang.'
		})
};
