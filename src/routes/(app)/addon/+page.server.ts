import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { logActivity } from '$lib/server/activity-logs';
import {
	ADDON_GROUP_WA_PATH,
	ADDON_NAMES,
	ADDON_REQUEST_STATUS,
	canManageAddonForOrg,
	cancelAddonRequest,
	getActiveAddon,
	getOrganizationForAddon,
	getPendingAddon,
	isAddonActiveRow,
	isAddonTipe,
	listAddonsForLembaga,
	setAddonStatus,
	upsertAddonRequest,
	type AddonTipe
} from '$lib/server/addons';
import { isSystemAdmin } from '$lib/server/auth/rbac';
import { getCoinBalance } from '$lib/server/domains/buku/wallet';

const readFormString = (formData: FormData, key: string) => {
	const value = formData.get(key);
	return typeof value === 'string' ? value.trim() : '';
};

const resolveManagedLembaga = async (
	db: NonNullable<App.Locals['db']>,
	user: NonNullable<App.Locals['user']>,
	preferredLembagaId?: string | null
) => {
	const candidateId = preferredLembagaId || user.orgId || null;
	if (!candidateId) return null;

	const org = await getOrganizationForAddon(db, candidateId);
	if (!org) return null;
	if (!canManageAddonForOrg(user, org)) return null;
	return org;
};

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	if (!locals.db) {
		throw error(500, 'Layanan data tidak tersedia');
	}

	const coinBalance = await getCoinBalance(locals.db, locals.user.id);
	const lembaga = await resolveManagedLembaga(locals.db, locals.user, locals.user.orgId);

	if (!lembaga) {
		return {
			addonAktif: [],
			addonHistory: [],
			lembagaNama: null,
			lembagaId: null,
			lembagaSlug: null,
			lembagaType: null,
			coinBalance,
			groupWaPath: ADDON_GROUP_WA_PATH,
			canManage: false,
			isMember: Boolean(locals.user.orgId),
			isSuperAdmin: isSystemAdmin(locals.user.role)
		};
	}

	const addons = await listAddonsForLembaga(locals.db, lembaga.id);
	const nowMs = Date.now();
	const addonAktif = addons.filter(
		(item) =>
			item.status === ADDON_REQUEST_STATUS || isAddonActiveRow(item.status, item.berlakuHingga, nowMs)
	);

	return {
		addonAktif,
		addonHistory: addons,
		lembagaNama: lembaga.name,
		lembagaId: lembaga.id,
		lembagaSlug: lembaga.slug,
		lembagaType: lembaga.type,
		coinBalance,
		groupWaPath: ADDON_GROUP_WA_PATH,
		canManage: true,
		isMember: true,
		isSuperAdmin: isSystemAdmin(locals.user.role)
	};
};

export const actions: Actions = {
	order: async ({ locals, platform, request }) => {
		if (!locals.user) {
			return fail(401, { message: 'Silakan login terlebih dahulu.' });
		}

		const db = locals.db ?? platform?.env?.DB;
		if (!db) {
			return fail(500, { message: 'Layanan data tidak tersedia.' });
		}

		const formData = await request.formData();
		const addonTipe = readFormString(formData, 'addon_tipe');
		const lembagaId = readFormString(formData, 'lembaga_id');

		if (!isAddonTipe(addonTipe)) {
			return fail(400, { message: 'Tipe addon tidak valid.' });
		}
		if (!lembagaId) {
			return fail(400, { message: 'Lembaga wajib dipilih.' });
		}

		const lembaga = await resolveManagedLembaga(db, locals.user, lembagaId);
		if (!lembaga) {
			return fail(403, {
				message: 'Anda belum menjadi pengelola lembaga ini. Masuk sebagai admin lembaga terlebih dahulu.'
			});
		}

		const existingPending = await getPendingAddon(db, lembaga.id, addonTipe);
		if (existingPending) {
			return fail(400, {
				type: 'already_pending',
				message: 'Permintaan addon ini sedang menunggu konfirmasi admin.'
			});
		}

		const existingActive = await getActiveAddon(db, lembaga.id, addonTipe);
		if (existingActive) {
			return fail(400, {
				type: 'already_active',
				message: 'Addon ini sudah aktif.'
			});
		}

		try {
			const result = await upsertAddonRequest(db, {
				lembagaId: lembaga.id,
				tipeAddon: addonTipe,
				requestedBy: locals.user.id
			});

			await logActivity(db, {
				userId: locals.user.id,
				action: 'ADDON_REQUEST',
				metadata: {
					addonId: result.id,
					addonType: addonTipe,
					lembagaId: lembaga.id,
					lembagaName: lembaga.name
				}
			});

			return {
				type: 'success',
				message: `Permintaan ${ADDON_NAMES[addonTipe]} berhasil dikirim! Menunggu konfirmasi admin. Pastikan Anda sudah bergabung ke grup WhatsApp.`,
				orderId: result.id,
				groupWaPath: ADDON_GROUP_WA_PATH
			};
		} catch (err: any) {
			console.error('addon_request_error', {
				addon_type: addonTipe,
				lembaga_id: lembaga.id,
				error: err?.message
			});
			return fail(500, {
				type: 'error',
				message: 'Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.'
			});
		}
	},

	cancel: async ({ locals, platform, request }) => {
		if (!locals.user) {
			return fail(401, { message: 'Silakan login terlebih dahulu.' });
		}
		const db = locals.db ?? platform?.env?.DB;
		if (!db) return fail(500, { message: 'Layanan data tidak tersedia.' });

		const formData = await request.formData();
		const addonId = readFormString(formData, 'addon_id');
		const lembagaId = readFormString(formData, 'lembaga_id');
		if (!addonId || !lembagaId) {
			return fail(400, { message: 'Permintaan tidak valid.' });
		}

		const lembaga = await resolveManagedLembaga(db, locals.user, lembagaId);
		if (!lembaga) {
			return fail(403, { message: 'Tidak memiliki akses ke lembaga ini.' });
		}

		const row = await db
			.prepare(
				`SELECT id, status, tipe_addon AS tipeAddon
				 FROM addon_lembaga
				 WHERE id = ? AND lembaga_id = ?
				 LIMIT 1`
			)
			.bind(addonId, lembaga.id)
			.first<{ id: string; status: string; tipeAddon: string }>();

		if (!row) {
			return fail(404, { message: 'Permintaan addon tidak ditemukan.' });
		}
		if (row.status !== ADDON_REQUEST_STATUS) {
			return fail(400, { message: 'Hanya permintaan menunggu yang bisa dibatalkan.' });
		}

		await cancelAddonRequest(db, row.id);
		await logActivity(db, {
			userId: locals.user.id,
			action: 'ADDON_CANCEL',
			metadata: {
				addonId: row.id,
				addonType: row.tipeAddon,
				lembagaId: lembaga.id
			}
		});

		return {
			type: 'success',
			message: `Permintaan ${ADDON_NAMES[row.tipeAddon as AddonTipe] ?? row.tipeAddon} dibatalkan.`
		};
	},

	deactivate: async ({ locals, platform, request }) => {
		if (!locals.user) {
			return fail(401, { message: 'Silakan login terlebih dahulu.' });
		}
		const db = locals.db ?? platform?.env?.DB;
		if (!db) return fail(500, { message: 'Layanan data tidak tersedia.' });

		const formData = await request.formData();
		const addonId = readFormString(formData, 'addon_id');
		const lembagaId = readFormString(formData, 'lembaga_id');
		if (!addonId || !lembagaId) {
			return fail(400, { message: 'Permintaan tidak valid.' });
		}

		const lembaga = await resolveManagedLembaga(db, locals.user, lembagaId);
		if (!lembaga) {
			return fail(403, { message: 'Tidak memiliki akses ke lembaga ini.' });
		}

		const row = await db
			.prepare(
				`SELECT id, status, tipe_addon AS tipeAddon, berlaku_hingga AS berlakuHingga
				 FROM addon_lembaga
				 WHERE id = ? AND lembaga_id = ?
				 LIMIT 1`
			)
			.bind(addonId, lembaga.id)
			.first<{ id: string; status: string; tipeAddon: string; berlakuHingga: number | null }>();

		if (!row) {
			return fail(404, { message: 'Addon tidak ditemukan.' });
		}
		if (!isAddonActiveRow(row.status, row.berlakuHingga)) {
			return fail(400, { message: 'Addon ini tidak sedang aktif.' });
		}

		await setAddonStatus(db, { id: row.id, status: 'expired', berlakuHingga: Date.now() });
		await logActivity(db, {
			userId: locals.user.id,
			action: 'ADDON_DEACTIVATE',
			metadata: {
				addonId: row.id,
				addonType: row.tipeAddon,
				lembagaId: lembaga.id
			}
		});

		return {
			type: 'success',
			message: `${ADDON_NAMES[row.tipeAddon as AddonTipe] ?? row.tipeAddon} dinonaktifkan.`
		};
	}
};
