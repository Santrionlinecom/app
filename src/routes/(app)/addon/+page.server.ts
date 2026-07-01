import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getCoinBalance } from '$lib/server/domains/buku/wallet';

type AddonAktifRow = {
	id: string;
	tipeAddon: string;
	status: string;
	berlakuHingga: number | null;
	createdAt: number | null;
};

const ADDON_PRICES = {
	santri_unlimited: 20000,
	raport_premium: 15000,
	modul_masjid: 25000,
	modul_tahfidz: 20000,
	modul_musholla: 15000,
	lembaga_tambahan: 15000
} as const;

const ADDON_NAMES = {
	santri_unlimited: 'Santri Unlimited',
	raport_premium: 'Raport PDF Premium',
	modul_masjid: 'Modul Masjid',
	modul_tahfidz: 'Modul Rumah Tahfidz',
	modul_musholla: 'Modul Musholla',
	lembaga_tambahan: 'Lembaga Tambahan'
} as const;

type AddonTipe = keyof typeof ADDON_PRICES;

// Migration 0037 only allows status: aktif, expired, trial.
// Until a safe schema migration expands the CHECK constraint, trial is used as
// the request/pending state so the public "Minta Addon" button does not fail.
const ADDON_REQUEST_STATUS = 'trial';

const isAddonTipe = (value: string): value is AddonTipe => value in ADDON_PRICES;

const readFormString = (formData: FormData, key: string) => {
	const value = formData.get(key);
	return typeof value === 'string' ? value.trim() : '';
};

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	if (!locals.db) {
		throw error(500, 'Layanan data tidak tersedia');
	}

	const lembagaId = locals.user.orgId;
	if (!lembagaId) {
		return {
			addonAktif: [],
			lembagaNama: null,
			lembagaId: null,
			coinBalance: 0
		};
	}

	// Get coin balance
	const coinBalance = await getCoinBalance(locals.db, locals.user.id);

	const nowMs = Date.now();
	const nowSeconds = Math.floor(nowMs / 1000);

	const [lembaga, addonResult] = await Promise.all([
		locals.db
			.prepare('SELECT id, name, slug, type FROM organizations WHERE id = ? AND akun_admin_id = ?')
			.bind(lembagaId, locals.user.id)
			.first<{ id: string; name: string; slug: string | null; type: string | null }>(),
		locals.db
			.prepare(
				`SELECT
					id,
					tipe_addon AS tipeAddon,
					status,
					berlaku_hingga AS berlakuHingga,
					created_at AS createdAt
				 FROM addon_lembaga
				 WHERE lembaga_id = ?
				   AND (
					(status = 'aktif' AND (
						berlaku_hingga IS NULL
						OR berlaku_hingga > ?
						OR (berlaku_hingga < 100000000000 AND berlaku_hingga > ?)
					))
					OR status = ?
				   )
				 ORDER BY created_at DESC`
			)
			.bind(lembagaId, nowMs, nowSeconds, ADDON_REQUEST_STATUS)
			.all<AddonAktifRow>()
	]);

	return {
		addonAktif: addonResult.results ?? [],
		lembagaNama: lembaga?.name ?? null,
		lembagaId: lembaga?.id ?? null,
		lembagaSlug: lembaga?.slug ?? null,
		lembagaType: lembaga?.type ?? null,
		coinBalance
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

		const lembaga = await db
			.prepare('SELECT id FROM organizations WHERE id = ? AND akun_admin_id = ?')
			.bind(lembagaId, locals.user.id)
			.first<{ id: string }>();

		if (!lembaga) {
			return fail(403, { message: 'Lembaga tidak ditemukan atau bukan milik akun ini.' });
		}

		// Check if there's already a pending request for this addon.
		// Pending requests are stored as `trial` to match the existing D1 CHECK constraint.
		const existingPending = await db
			.prepare(
				`SELECT id FROM addon_lembaga
				 WHERE lembaga_id = ? AND tipe_addon = ? AND status = ?
				 LIMIT 1`
			)
			.bind(lembagaId, addonTipe, ADDON_REQUEST_STATUS)
			.first<{ id: string }>();

		if (existingPending) {
			return fail(400, {
				type: 'already_pending',
				message: 'Permintaan addon ini sedang menunggu konfirmasi admin.'
			});
		}

		// Check if addon is already active
		const existingActive = await db
			.prepare(
				`SELECT id FROM addon_lembaga
				 WHERE lembaga_id = ? AND tipe_addon = ? AND status = 'aktif'
				   AND (berlaku_hingga IS NULL OR berlaku_hingga > ?)
				 LIMIT 1`
			)
			.bind(lembagaId, addonTipe, Date.now())
			.first<{ id: string }>();

		if (existingActive) {
			return fail(400, {
				type: 'already_active',
				message: 'Addon ini sudah aktif.'
			});
		}

		const orderId = crypto.randomUUID();
		const now = Date.now();

		try {
			const existingInactive = await db
				.prepare(
					`SELECT id FROM addon_lembaga
					 WHERE lembaga_id = ? AND tipe_addon = ?
					 LIMIT 1`
				)
				.bind(lembagaId, addonTipe)
				.first<{ id: string }>();

			if (existingInactive) {
				await db
					.prepare(
						`UPDATE addon_lembaga
						 SET status = ?, berlaku_hingga = NULL, created_at = ?
						 WHERE id = ?`
					)
					.bind(ADDON_REQUEST_STATUS, now, existingInactive.id)
					.run();
			} else {
				// Create addon request with pending status (no payment needed).
				// See ADDON_REQUEST_STATUS above for why the stored value is `trial`.
				await db
					.prepare(
						`INSERT INTO addon_lembaga (
							id,
							lembaga_id,
							tipe_addon,
							status,
							berlaku_hingga,
							created_at
						)
						VALUES (?, ?, ?, ?, NULL, ?)`
					)
					.bind(orderId, lembagaId, addonTipe, ADDON_REQUEST_STATUS, now)
					.run();
			}

			console.info('addon_request_success', {
				order_id: orderId,
				addon_type: addonTipe,
				lembaga_id: lembagaId
			});

			return {
				type: 'success',
				message: `Permintaan ${ADDON_NAMES[addonTipe]} berhasil dikirim! Menunggu konfirmasi admin. Pastikan Anda sudah bergabung ke grup WhatsApp.`,
				orderId
			};
		} catch (err: any) {
			console.error('addon_request_error', {
				order_id: orderId,
				addon_type: addonTipe,
				error: err.message
			});
			return fail(500, {
				type: 'error',
				message: 'Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.'
			});
		}
	}
};