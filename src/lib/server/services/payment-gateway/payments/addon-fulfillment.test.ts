import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { Miniflare } from 'miniflare';

import { fulfillAddonPayment, reverseAddonPayment } from './addon-fulfillment.ts';

const createDb = async (withNewerRenewal: boolean) => {
	const mf = new Miniflare({
		modules: true,
		script: 'export default { fetch() { return new Response("ok") } }',
		d1Databases: { DB: crypto.randomUUID() }
	});
	const db = await mf.getD1Database('DB');
	await db.batch([
		db.prepare('CREATE TABLE addon_lembaga (id TEXT PRIMARY KEY, lembaga_id TEXT, tipe_addon TEXT, status TEXT, berlaku_hingga INTEGER, created_at INTEGER, UNIQUE(lembaga_id, tipe_addon))'),
		db.prepare('CREATE TABLE billing (id TEXT PRIMARY KEY, status TEXT)'),
		db.prepare('CREATE TABLE payment_orders (id TEXT PRIMARY KEY, purpose TEXT, lembaga_id TEXT, product_slug TEXT, status TEXT, provider_status TEXT, created_at INTEGER, updated_at INTEGER)'),
		db.prepare("INSERT INTO addon_lembaga VALUES ('addon-1', 'org-1', 'santri_unlimited', 'aktif', 9999999999, 100)"),
		db.prepare("INSERT INTO billing VALUES ('ORDER-OLD', 'sukses')"),
		db.prepare("INSERT INTO payment_orders VALUES ('ORDER-OLD', 'addon', 'org-1', 'santri_unlimited', 'sukses', 'settlement', 100, 100)"),
		...(withNewerRenewal
			? [db.prepare("INSERT INTO payment_orders VALUES ('ORDER-NEW', 'addon', 'org-1', 'santri_unlimited', 'sukses', 'settlement', 200, 200)")]
			: [])
	]);
	return { mf, db };
};

test('refund expires the addon only when no newer successful renewal exists', async () => {
	const latest = await createDb(false);
	const renewed = await createDb(true);
	try {
		await reverseAddonPayment({
			db: latest.db,
			orderId: 'ORDER-OLD',
			lembagaId: 'org-1',
			addonType: 'santri_unlimited',
			transactionStatus: 'refund',
			nowMs: 300
		});
		await reverseAddonPayment({
			db: renewed.db,
			orderId: 'ORDER-OLD',
			lembagaId: 'org-1',
			addonType: 'santri_unlimited',
			transactionStatus: 'refund',
			nowMs: 300
		});
		assert.deepEqual(await latest.db.prepare("SELECT status FROM addon_lembaga WHERE id = 'addon-1'").first(), { status: 'expired' });
		assert.deepEqual(await renewed.db.prepare("SELECT status FROM addon_lembaga WHERE id = 'addon-1'").first(), { status: 'aktif' });
		assert.deepEqual(await latest.db.prepare("SELECT status FROM payment_orders WHERE id = 'ORDER-OLD'").first(), { status: 'refunded' });
		assert.deepEqual(await latest.db.prepare("SELECT status FROM billing WHERE id = 'ORDER-OLD'").first(), { status: 'gagal' });
	} finally {
		await Promise.all([latest.mf.dispose(), renewed.mf.dispose()]);
	}
});

test('a refunded addon order cannot reactivate entitlement on a later settlement callback', async () => {
	const state = await createDb(false);
	try {
		await reverseAddonPayment({
			db: state.db,
			orderId: 'ORDER-OLD',
			lembagaId: 'org-1',
			addonType: 'santri_unlimited',
			transactionStatus: 'refund',
			nowMs: 300
		});
		const fulfilled = await fulfillAddonPayment({
			db: state.db,
			orderId: 'ORDER-OLD',
			lembagaId: 'org-1',
			addonType: 'santri_unlimited',
			addonId: 'addon-replayed',
			transactionStatus: 'settlement',
			nowMs: 400
		});

		assert.equal(fulfilled, false);
		assert.deepEqual(await state.db.prepare("SELECT status FROM addon_lembaga WHERE id = 'addon-1'").first(), { status: 'expired' });
		assert.deepEqual(await state.db.prepare("SELECT status FROM payment_orders WHERE id = 'ORDER-OLD'").first(), { status: 'refunded' });
	} finally {
		await state.mf.dispose();
	}
});
