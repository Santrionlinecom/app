import type { D1Database } from '@cloudflare/workers-types';

type FulfillAddonPaymentInput = {
	db: D1Database;
	orderId: string;
	lembagaId: string;
	addonType: string;
	addonId: string;
	transactionStatus: string;
	nowMs?: number;
};

export const fulfillAddonPayment = async ({
	db,
	orderId,
	lembagaId,
	addonType,
	addonId,
	transactionStatus,
	nowMs = Date.now()
}: FulfillAddonPaymentInput) => {
	const berlakuHingga = Math.floor(nowMs / 1000) + 2_592_000;
	const settlement = await db.batch([
		db
			.prepare(
				"UPDATE payment_orders SET status = 'sukses', provider_status = ?, updated_at = ? WHERE id = ? AND status <> 'refunded'"
			)
			.bind(transactionStatus, nowMs, orderId),
		db
			.prepare(
				`UPDATE billing
				 SET status = 'sukses'
				 WHERE id = ?
				   AND EXISTS (SELECT 1 FROM payment_orders WHERE id = ? AND status = 'sukses')`
			)
			.bind(orderId, orderId),
		db
			.prepare(
				`INSERT INTO addon_lembaga (
					id, lembaga_id, tipe_addon, status, berlaku_hingga, created_at
				)
				SELECT ?, ?, ?, 'aktif', ?, ?
				WHERE EXISTS (SELECT 1 FROM payment_orders WHERE id = ? AND status = 'sukses')
				ON CONFLICT(lembaga_id, tipe_addon) DO UPDATE SET
					status = 'aktif',
					berlaku_hingga = excluded.berlaku_hingga,
					created_at = excluded.created_at`
			)
			.bind(addonId, lembagaId, addonType, berlakuHingga, nowMs, orderId)
	]);

	return Number(settlement[0]?.meta?.changes ?? 0) === 1;
};

type ReverseAddonPaymentInput = {
	db: D1Database;
	orderId: string;
	lembagaId: string;
	addonType: string;
	transactionStatus: string;
	nowMs?: number;
};

export const reverseAddonPayment = async ({
	db,
	orderId,
	lembagaId,
	addonType,
	transactionStatus,
	nowMs = Date.now()
}: ReverseAddonPaymentInput) => {
	const results = await db.batch([
		db
			.prepare(
				`UPDATE addon_lembaga
				 SET status = 'expired', berlaku_hingga = ?, created_at = ?
				 WHERE lembaga_id = ? AND tipe_addon = ? AND status = 'aktif'
				   AND NOT EXISTS (
					 SELECT 1
					 FROM payment_orders newer
					 WHERE newer.purpose = 'addon'
					   AND newer.lembaga_id = ?
					   AND newer.product_slug = ?
					   AND newer.status = 'sukses'
					   AND newer.id <> ?
					   AND newer.created_at > COALESCE(
						 (SELECT original.created_at FROM payment_orders original WHERE original.id = ?),
						 0
					   )
				   )`
			)
			.bind(
				Math.floor(nowMs / 1000),
				nowMs,
				lembagaId,
				addonType,
				lembagaId,
				addonType,
				orderId,
				orderId
			),
		db.prepare("UPDATE billing SET status = 'gagal' WHERE id = ?").bind(orderId),
		db
			.prepare("UPDATE payment_orders SET status = 'refunded', provider_status = ?, updated_at = ? WHERE id = ?")
			.bind(transactionStatus, nowMs, orderId)
	]);
	return Number(results[0]?.meta?.changes ?? 0) === 1;
};
