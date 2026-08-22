import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ensureBukuWalletSchema } from '$lib/server/domains/buku/wallet';
import {
	getCoinTopupPackageById,
	getCoinTopupPackages,
	pilihPaketMencukupi
} from '$lib/server/coin-packages';
import {
	buatPermintaanManual,
	metodeManualAktif,
	permintaanManualSaya,
	JANJI_VERIFIKASI
} from '$lib/server/coins/topup-manual';
import {
	createMidtransAuthorization,
	createMidtransOrderId,
	ensurePaymentOrdersSchema,
	getMidtransSnapScriptUrl,
	getMidtransSnapTransactionUrl
} from '$lib/server/services/payment-gateway/payments/midtrans';

type MidtransSnapResponse = {
	token?: string;
	error_messages?: string[];
};

const INVALID_PACKAGE_MESSAGE =
	'Paket top up tidak valid. Silakan pilih paket yang tersedia.';

const PESAN_MANUAL: Record<string, string> = {
	paket_tidak_sah: INVALID_PACKAGE_MESSAGE,
	metode_tidak_sah: 'Metode pembayaran tidak tersedia. Silakan pilih ulang.',
	bukti_kosong: 'Unggah bukti transfer terlebih dahulu.',
	catatan_panjang: 'Catatan pembayaran maksimal 500 karakter.'
};

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	const db = locals.db ?? platform?.env?.DB;

	// Metode manual dibaca dari database supaya rekening bisa diubah lewat
	// CMS tanpa menyentuh kode. Bila database tak tersedia, halaman tetap
	// jalan dengan Midtrans saja daripada gagal total.
	const [metodeManual, riwayatManual] = db
		? await Promise.all([
				metodeManualAktif(db).catch(() => []),
				permintaanManualSaya(db, locals.user.id).catch(() => [])
			])
		: [[], []];

	// Kalau pengguna datang dari halaman produk yang saldonya kurang,
	// `?butuh=` memberi tahu berapa coin yang dia perlukan — sehingga
	// halaman ini bisa langsung menyarankan paket yang menutupinya dalam
	// SATU kali isi, bukan membiarkannya menebak lalu kurang lagi.
	const butuhMentah = Number(url.searchParams.get('butuh'));
	const coinDibutuhkan =
		Number.isSafeInteger(butuhMentah) && butuhMentah > 0 ? butuhMentah : null;

	const semuaPaket = getCoinTopupPackages();
	const paketDisarankan = coinDibutuhkan
		? (pilihPaketMencukupi(coinDibutuhkan)?.id ?? null)
		: null;

	return {
		user: locals.user,
		packages: semuaPaket,
		coinDibutuhkan,
		paketDisarankan,
		midtransClientKey: platform?.env?.MIDTRANS_CLIENT_KEY ?? '',
		midtransSnapScriptUrl: getMidtransSnapScriptUrl(platform?.env?.MIDTRANS_IS_PRODUCTION === 'true'),
		metodeManual,
		riwayatManual,
		janjiVerifikasi: JANJI_VERIFIKASI
	};
};

export const actions: Actions = {
	order: async ({ request, locals, platform, fetch }) => {
		if (!locals.user) {
			throw redirect(302, '/auth');
		}

		const db = locals.db ?? platform?.env?.DB;
		if (!db) {
			return fail(500, { message: 'Layanan data tidak tersedia' });
		}

		const serverKey = platform?.env?.MIDTRANS_SERVER_KEY;
		if (!serverKey) {
			return fail(500, { message: 'Konfigurasi Midtrans belum tersedia.' });
		}
		const midtransIsProduction = platform?.env?.MIDTRANS_IS_PRODUCTION === 'true';

		const formData = await request.formData();
		const packageId = formData.get('package_id');
		const userNote = formData.get('user_note');

		if (typeof packageId !== 'string') {
			return fail(400, { message: INVALID_PACKAGE_MESSAGE });
		}
		const selectedPackage = getCoinTopupPackageById(packageId);
		if (!selectedPackage) {
			return fail(400, { message: INVALID_PACKAGE_MESSAGE });
		}

		const rawNote = typeof userNote === 'string' ? userNote.trim() : '';
		if (rawNote.length > 500) {
			return fail(400, { message: 'Catatan pembayaran maksimal 500 karakter' });
		}
		const note = rawNote
			? `[MIDTRANS][PAKET: ${selectedPackage.name}] ${rawNote}`
			: `[MIDTRANS][PAKET: ${selectedPackage.name}]`;

		await ensureBukuWalletSchema(db);
		await ensurePaymentOrdersSchema(db);

		const orderId = createMidtransOrderId();
		const nowIso = new Date().toISOString();
		const nowMs = Date.now();
		const packageName = `Top Up Coin ${selectedPackage.name}`;
		const metadata = JSON.stringify({
			userId: locals.user.id,
			packageId: selectedPackage.id,
			packageName,
			coinAmount: selectedPackage.coinAmount,
			bonusCoin: selectedPackage.bonusCoin
		});

		try {
			await db.batch([
				db
					.prepare(
						`INSERT INTO payment_orders (
							id,
							provider,
							purpose,
							user_id,
							product_slug,
							package_name,
							gross_amount,
							currency,
							status,
							metadata,
							created_at,
							updated_at
						)
						VALUES (?, 'midtrans', 'coin_topup', ?, ?, ?, ?, 'IDR', 'pending', ?, ?, ?)`
					)
					.bind(
						orderId,
						locals.user.id,
						selectedPackage.id,
						packageName,
						selectedPackage.amountRupiah,
						metadata,
						nowMs,
						nowMs
					),
				db
					.prepare(
						`INSERT INTO coin_topup_requests
						(id, user_id, amount_rupiah, coin_amount, proof_url, user_note, status, created_at, updated_at)
						VALUES (?, ?, ?, ?, NULL, ?, 'pending', ?, ?)`
					)
					.bind(
						orderId,
						locals.user.id,
						selectedPackage.amountRupiah,
						selectedPackage.coinAmount,
						note,
						nowIso,
						nowIso
					)
			]);
		} catch (err) {
			console.error('Gagal membuat topup request:', err);
			return fail(500, { message: 'Gagal membuat permintaan top up' });
		}

		console.info('midtrans_snap_create_coin_topup', {
			order_id: orderId,
			gross_amount: selectedPackage.amountRupiah,
			product_slug: selectedPackage.id
		});

		const snapResponse = await fetch(getMidtransSnapTransactionUrl(midtransIsProduction), {
			method: 'POST',
			headers: {
				Authorization: createMidtransAuthorization(serverKey),
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				transaction_details: {
					order_id: orderId,
					gross_amount: selectedPackage.amountRupiah
				},
				customer_details: {
					first_name: locals.user.username ?? locals.user.email,
					email: locals.user.email
				},
				item_details: [
					{
						id: selectedPackage.id,
						price: selectedPackage.amountRupiah,
						quantity: 1,
						name: packageName
					}
				]
			})
		});

		const snapPayload = (await snapResponse.json().catch(() => ({}))) as MidtransSnapResponse;
		if (!snapResponse.ok || !snapPayload.token) {
			await db.batch([
				db.prepare("UPDATE payment_orders SET status = 'gagal', provider_status = ?, updated_at = ? WHERE id = ?").bind(
					String(snapResponse.status),
					Date.now(),
					orderId
				),
				db
					.prepare(
						"UPDATE coin_topup_requests SET status = 'rejected', admin_note = ?, updated_at = ? WHERE id = ?"
					)
					.bind('Midtrans Snap gagal membuat token pembayaran', new Date().toISOString(), orderId)
			]);

			console.warn('midtrans_snap_create_coin_topup_failed', {
				order_id: orderId,
				gross_amount: selectedPackage.amountRupiah,
				product_slug: selectedPackage.id,
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
	},

	/**
	 * Transfer manual (BCA/QRIS). Hanya MENCATAT permintaan — coin tidak
	 * bertambah di sini. Saldo baru bergerak setelah admin menyetujui
	 * lewat /admin/super/coin-topups.
	 */
	manual: async ({ request, locals, platform }) => {
		if (!locals.user) {
			throw redirect(302, '/auth');
		}

		const db = locals.db ?? platform?.env?.DB;
		if (!db) {
			return fail(500, { message: 'Layanan data tidak tersedia' });
		}

		const formData = await request.formData();
		const packageId = formData.get('package_id');
		const metodeId = formData.get('metode_id');
		const buktiUrl = formData.get('bukti_url');
		const userNote = formData.get('user_note');

		if (typeof packageId !== 'string' || typeof metodeId !== 'string') {
			return fail(400, { message: INVALID_PACKAGE_MESSAGE });
		}

		// Paket diambil dari katalog SERVER; nominal dari form tidak dipercaya.
		const selectedPackage = getCoinTopupPackageById(packageId);

		await ensureBukuWalletSchema(db);

		const hasil = await buatPermintaanManual(db, {
			userId: locals.user.id,
			paket: selectedPackage ?? null,
			metodeId,
			buktiUrl: typeof buktiUrl === 'string' ? buktiUrl : '',
			catatan: typeof userNote === 'string' ? userNote : ''
		});

		if (!hasil.ok) {
			return fail(400, {
				message: PESAN_MANUAL[hasil.alasan] ?? 'Permintaan top up tidak dapat diproses.'
			});
		}

		console.info('manual_coin_topup_created', {
			request_id: hasil.id,
			product_slug: packageId
		});

		return {
			type: 'manualDiterima',
			message: `Permintaan terkirim. ${JANJI_VERIFIKASI}, lalu coin otomatis masuk.`
		};
	}
};
