import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkCoinBalance, deductCoins, rupiahToCoin } from '$lib/server/domains/buku/coin-operations';
import { ensureCoinWallet, getCoinBalance } from '$lib/server/domains/buku/wallet';

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

const isAddonTipe = (value: string): value is AddonTipe => value in ADDON_PRICES;

const readFormString = (formData: FormData, key: string) => {
	const value = formData.get(key);
	return typeof value === 'string' ? value.trim() : '';
};

export const load: PageServerLoad = async ({ locals, platform }) => {
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
			.prepare('SELECT id, name FROM organizations WHERE id = ? AND akun_admin_id = ?')
			.bind(lembagaId, locals.user.id)
			.first<{ id: string; name: string }>(),
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
				   AND status = 'aktif'
				   AND (
					berlaku_hingga IS NULL
					OR berlaku_hingga > ?
					OR (berlaku_hingga < 100000000000 AND berlaku_hingga > ?)
				   )
				 ORDER BY created_at DESC`
			)
			.bind(lembagaId, nowMs, nowSeconds)
			.all<AddonAktifRow>()
	]);

	return {
		addonAktif: addonResult.results ?? [],
		lembagaNama: lembaga?.name ?? null,
		lembagaId: lembaga?.id ?? null,
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
		const nominalRaw = readFormString(formData, 'nominal');
		const nominal = Number(nominalRaw);

		if (!isAddonTipe(addonTipe)) {
			return fail(400, { message: 'Tipe addon tidak valid.' });
		}

		if (!lembagaId) {
			return fail(400, { message: 'Lembaga wajib dipilih.' });
		}

		if (!Number.isInteger(nominal) || nominal <= 0 || nominal !== ADDON_PRICES[addonTipe]) {
			return fail(400, { message: 'Nominal addon tidak valid.' });
		}

		const lembaga = await db
			.prepare('SELECT id FROM organizations WHERE id = ? AND akun_admin_id = ?')
			.bind(lembagaId, locals.user.id)
			.first<{ id: string }>();

		if (!lembaga) {
			return fail(403, { message: 'Lembaga tidak ditemukan atau bukan milik akun ini.' });
		}

		// Ensure coin wallet exists
		await ensureCoinWallet(db, locals.user.id);

		// Convert rupiah to coin (1:1 conversion)
		const coinRequired = rupiahToCoin(nominal);

		// Check coin balance
		const balanceCheck = await checkCoinBalance(db, locals.user.id, coinRequired);
		if (!balanceCheck.hasEnough) {
			return fail(400, {
				type: 'insufficient_coin',
				message: 'Saldo coin tidak cukup.',
				currentBalance: balanceCheck.currentBalance,
				requiredAmount: balanceCheck.required,
				shortfall: balanceCheck.shortfall,
				productName: ADDON_NAMES[addonTipe]
			});
		}

		const orderId = crypto.randomUUID();
		const packageName = `Addon ${ADDON_NAMES[addonTipe]} Bulanan`;
		const now = Date.now();

		try {
			// Deduct coins
			const deductResult = await deductCoins(
				db,
				locals.user.id,
				coinRequired,
				`Pembelian ${packageName}`,
				'addon',
				orderId
			);

			if (!deductResult.success) {
				return fail(400, {
					type: 'deduct_failed',
					message: deductResult.error || 'Gagal memproses pembayaran coin.'
				});
			}

			// Calculate expiry (30 days from now)
			const expiryMs = now + 30 * 24 * 60 * 60 * 1000;

			// Create addon record and billing record
			await db.batch([
				db
					.prepare(
						`INSERT INTO addon_lembaga (
							id,
							lembaga_id,
							tipe_addon,
							status,
							berlaku_hingga,
							created_at
						)
						VALUES (?, ?, ?, 'aktif', ?, ?)`
					)
					.bind(orderId, lembagaId, addonTipe, expiryMs, now),
				db
					.prepare(
						`INSERT INTO billing (
							id,
							akun_admin_id,
							lembaga_id,
							addon_tipe,
							nominal,
							metode,
							status
						)
						VALUES (?, ?, ?, ?, ?, 'coin', 'lunas')`
					)
					.bind(orderId, locals.user.id, lembagaId, addonTipe, nominal)
			]);

			console.info('addon_order_success_coin', {
				order_id: orderId,
				addon_type: addonTipe,
				coin_amount: coinRequired,
				new_balance: deductResult.newBalance
			});

			return {
				type: 'success',
				message: `Berhasil mengaktifkan ${packageName}!`,
				newBalance: deductResult.newBalance,
				orderId
			};
		} catch (err: any) {
			console.error('addon_order_error', {
				order_id: orderId,
				addon_type: addonTipe,
				error: err.message
			});
			return fail(500, {
				type: 'error',
				message: 'Terjadi kesalahan saat memproses pesanan. Silakan coba lagi.'
			});
		}
	}
};