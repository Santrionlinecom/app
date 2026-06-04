import { error, fail, redirect } from '@sveltejs/kit';
import {
	createMidtransAuthorization,
	createMidtransOrderId,
	ensurePaymentOrdersSchema,
	MIDTRANS_SNAP_TRANSACTION_URL
} from '$lib/server/services/payment-gateway/payments/midtrans';
import type { Actions, PageServerLoad } from './$types';

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

type MidtransSnapResponse = {
	token?: string;
	error_messages?: string[];
};

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
			midtransClientKey: platform?.env?.MIDTRANS_CLIENT_KEY ?? ''
		};
	}

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
		midtransClientKey: platform?.env?.MIDTRANS_CLIENT_KEY ?? ''
	};
};

export const actions: Actions = {
	order: async ({ locals, platform, request, fetch }) => {
		if (!locals.user) {
			return fail(401, { message: 'Silakan login terlebih dahulu.' });
		}

		const db = locals.db ?? platform?.env?.DB;
		if (!db) {
			return fail(500, { message: 'Layanan data tidak tersedia.' });
		}

		const serverKey = platform?.env?.MIDTRANS_SERVER_KEY;
		if (!serverKey) {
			return fail(500, { message: 'Konfigurasi Midtrans belum tersedia.' });
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

		await ensurePaymentOrdersSchema(db);

		const orderId = createMidtransOrderId();
		const packageName = `Addon ${ADDON_NAMES[addonTipe]} Bulanan`;
		const now = Date.now();
		const metadata = JSON.stringify({
			userId: locals.user.id,
			lembagaId,
			addonSlug: addonTipe,
			packageName
		});

		await db.batch([
			db
				.prepare(
					`INSERT INTO payment_orders (
						id,
						provider,
						purpose,
						user_id,
						lembaga_id,
						product_slug,
						package_name,
						gross_amount,
						currency,
						status,
						metadata,
						created_at,
						updated_at
					)
					VALUES (?, 'midtrans', 'addon', ?, ?, ?, ?, ?, 'IDR', 'pending', ?, ?, ?)`
				)
				.bind(orderId, locals.user.id, lembagaId, addonTipe, packageName, nominal, metadata, now, now),
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
					VALUES (?, ?, ?, ?, ?, 'midtrans', 'pending')`
				)
				.bind(orderId, locals.user.id, lembagaId, addonTipe, nominal)
		]);

		console.info('midtrans_snap_create_addon', {
			order_id: orderId,
			gross_amount: nominal,
			product_slug: addonTipe
		});

		const snapResponse = await fetch(MIDTRANS_SNAP_TRANSACTION_URL, {
			method: 'POST',
			headers: {
				Authorization: createMidtransAuthorization(serverKey),
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				transaction_details: {
					order_id: orderId,
					gross_amount: nominal
				},
				customer_details: {
					first_name: locals.user.username ?? locals.user.email,
					email: locals.user.email
				},
				item_details: [
					{
						id: addonTipe,
						price: nominal,
						quantity: 1,
						name: packageName
					}
				]
			})
		});

		const snapPayload = (await snapResponse.json().catch(() => ({}))) as MidtransSnapResponse;
		if (!snapResponse.ok || !snapPayload.token) {
			await db.batch([
				db.prepare("UPDATE billing SET status = 'gagal' WHERE id = ?").bind(orderId),
				db
					.prepare(
						"UPDATE payment_orders SET status = 'gagal', provider_status = ?, updated_at = ? WHERE id = ?"
					)
					.bind(String(snapResponse.status), Date.now(), orderId)
			]);
			console.warn('midtrans_snap_create_addon_failed', {
				order_id: orderId,
				gross_amount: nominal,
				product_slug: addonTipe,
				status: snapResponse.status
			});
			const midtransMessage = Array.isArray(snapPayload.error_messages)
				? snapPayload.error_messages.join(', ')
				: 'Midtrans Snap tidak mengembalikan token.';
			return fail(502, { message: midtransMessage });
		}

		await db
			.prepare('UPDATE payment_orders SET provider_token = ?, updated_at = ? WHERE id = ?')
			.bind(snapPayload.token, Date.now(), orderId)
			.run();

		return {
			type: 'snapToken',
			snapToken: snapPayload.token
		};
	}
};
