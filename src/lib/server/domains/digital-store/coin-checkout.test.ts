import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { Miniflare } from 'miniflare';

import { checkoutDigitalProductWithCoins } from './coin-checkout.ts';

const createDb = async () => {
	const mf = new Miniflare({
		modules: true,
		script: 'export default { fetch() { return new Response("ok") } }',
		d1Databases: { DB: crypto.randomUUID() }
	});
	const db = await mf.getD1Database('DB');
	await db.batch([
		db.prepare(`CREATE TABLE coin_wallets (
			user_id TEXT PRIMARY KEY,
			balance INTEGER NOT NULL DEFAULT 0,
			updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`),
		db.prepare(`CREATE TABLE coin_transactions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			type TEXT NOT NULL CHECK (type IN ('topup', 'unlock_chapter', 'purchase', 'adjustment', 'refund')),
			amount INTEGER NOT NULL,
			balance_before INTEGER,
			balance_after INTEGER,
			order_id TEXT,
			description TEXT,
			reference_type TEXT,
			reference_id TEXT,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`),
		db.prepare(`CREATE TABLE digital_product_sales (
			id TEXT PRIMARY KEY,
			product_id TEXT NOT NULL,
			buyer_user_id TEXT,
			buyer_name TEXT,
			buyer_contact TEXT,
			amount INTEGER NOT NULL,
			reference_code TEXT UNIQUE,
			payment_method_id TEXT,
			payment_method_name TEXT,
			status TEXT NOT NULL,
			access_token TEXT,
			purchase_key TEXT UNIQUE,
			paid_at INTEGER,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		)`),
		db.prepare("INSERT INTO coin_wallets (user_id, balance) VALUES ('user-1', 1000)")
	]);
	return { mf, db };
};

test('concurrent replay creates one paid digital sale and debits coins exactly once', async () => {
	const { mf, db } = await createDb();
	try {
		const input = {
			db,
			userId: 'user-1',
			productId: 'product-1',
			productTitle: 'Paket Desain TPQ',
			coinAmount: 600,
			buyerName: 'Pembeli Uji',
			buyerContact: '08123456789',
			purchaseKey: 'checkout-product-1-user-1-abcdef',
			nowMs: 1_767_225_660_000
		};

		const results = await Promise.all([
			checkoutDigitalProductWithCoins(input),
			checkoutDigitalProductWithCoins(input)
		]);

		assert.equal(results.filter((result) => result.status === 'purchased').length, 1);
		assert.equal(results.filter((result) => result.status === 'already_purchased').length, 1);
		assert.deepEqual(
			await db.prepare("SELECT balance FROM coin_wallets WHERE user_id = 'user-1'").first(),
			{ balance: 400 }
		);
		assert.deepEqual(
			await db.prepare('SELECT COUNT(*) AS total FROM digital_product_sales').first(),
			{ total: 1 }
		);
		assert.deepEqual(
			await db.prepare('SELECT COUNT(*) AS total FROM coin_transactions').first(),
			{ total: 1 }
		);
		const purchased = results.find((result) => result.status === 'purchased');
		assert.ok(purchased && purchased.status !== 'insufficient_coin');
		assert.deepEqual(
			await db.prepare('SELECT amount, balance_before AS balanceBefore, balance_after AS balanceAfter, order_id AS orderId FROM coin_transactions').first(),
			{ amount: -600, balanceBefore: 1000, balanceAfter: 400, orderId: purchased.orderId }
		);
	} finally {
		await mf.dispose();
	}
});

test('a user cannot be charged twice for the same one-time product with different purchase keys', async () => {
	const { mf, db } = await createDb();
	try {
		const common = {
			db,
			userId: 'user-1',
			productId: 'product-1',
			productTitle: 'SantriPrint Pro',
			coinAmount: 600,
			buyerName: 'Pembeli Uji',
			buyerContact: '08123456789',
			nowMs: 1_767_225_660_000
		};
		const first = await checkoutDigitalProductWithCoins({
			...common,
			purchaseKey: 'checkout-product-1-user-1-first'
		});
		const second = await checkoutDigitalProductWithCoins({
			...common,
			purchaseKey: 'checkout-product-1-user-1-second'
		});
		assert.equal(first.status, 'purchased');
		assert.equal(second.status, 'already_purchased');
		assert.deepEqual(await db.prepare("SELECT balance FROM coin_wallets WHERE user_id = 'user-1'").first(), { balance: 400 });
		assert.deepEqual(await db.prepare('SELECT COUNT(*) AS total FROM digital_product_sales').first(), { total: 1 });
		assert.deepEqual(await db.prepare('SELECT COUNT(*) AS total FROM coin_transactions').first(), { total: 1 });
	} finally {
		await mf.dispose();
	}
});
