import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { Miniflare } from 'miniflare';

import { fulfillPendingCoinTopup, reverseApprovedCoinTopup } from './coin-topup-fulfillment.ts';

test('fulfillPendingCoinTopup credits a concurrently replayed order exactly once', async () => {
	const mf = new Miniflare({
		modules: true,
		script: 'export default { fetch() { return new Response("ok") } }',
		d1Databases: { DB: crypto.randomUUID() }
	});
	try {
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
				type TEXT NOT NULL,
				amount INTEGER NOT NULL,
				balance_after INTEGER,
				description TEXT,
				reference_type TEXT,
				reference_id TEXT,
				created_at TEXT NOT NULL
			)`),
			db.prepare(`CREATE TABLE coin_topup_requests (
				id TEXT PRIMARY KEY,
				user_id TEXT NOT NULL,
				coin_amount INTEGER NOT NULL,
				status TEXT NOT NULL,
				admin_note TEXT,
				reviewed_at TEXT,
				updated_at TEXT NOT NULL
			)`),
			db.prepare(`CREATE TABLE payment_orders (
				id TEXT PRIMARY KEY,
				status TEXT NOT NULL,
				provider_status TEXT,
				updated_at INTEGER NOT NULL
			)`),
			db.prepare(
				`INSERT INTO coin_topup_requests (id, user_id, coin_amount, status, updated_at)
				 VALUES ('SO-C-1', 'user-1', 100, 'pending', '2026-01-01T00:00:00.000Z')`
			),
			db.prepare("INSERT INTO payment_orders (id, status, updated_at) VALUES ('SO-C-1', 'pending', 0)")
		]);
		const input = {
			db,
			orderId: 'SO-C-1',
			userId: 'user-1',
			coinAmount: 100,
			transactionStatus: 'settlement',
			nowIso: '2026-01-01T00:01:00.000Z',
			nowMs: 1_767_225_660_000
		};

		const results = await Promise.all([
			fulfillPendingCoinTopup(input),
			fulfillPendingCoinTopup(input)
		]);
		assert.deepEqual(results.sort(), [false, true]);
		assert.deepEqual(
			await db.prepare('SELECT balance FROM coin_wallets WHERE user_id = ?').bind('user-1').first(),
			{ balance: 100 }
		);
		assert.deepEqual(
			await db.prepare('SELECT COUNT(*) AS total FROM coin_transactions').first(),
			{ total: 1 }
		);
		assert.deepEqual(
			await db.prepare('SELECT id, balance_after AS balanceAfter FROM coin_transactions').first(),
			{ id: 'coin-topup:SO-C-1', balanceAfter: 100 }
		);
		assert.deepEqual(
			await db.prepare('SELECT status FROM coin_topup_requests WHERE id = ?').bind('SO-C-1').first(),
			{ status: 'approved' }
		);
	} finally {
		await mf.dispose();
	}
});

test('reverseApprovedCoinTopup reverses a refunded order exactly once, including when coins were spent', async () => {
	const mf = new Miniflare({
		modules: true,
		script: 'export default { fetch() { return new Response("ok") } }',
		d1Databases: { DB: crypto.randomUUID() }
	});
	try {
		const db = await mf.getD1Database('DB');
		await db.batch([
			db.prepare('CREATE TABLE coin_wallets (user_id TEXT PRIMARY KEY, balance INTEGER NOT NULL, updated_at TEXT)'),
			db.prepare(`CREATE TABLE coin_transactions (
				id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, amount INTEGER NOT NULL,
				balance_after INTEGER, description TEXT, reference_type TEXT, reference_id TEXT, created_at TEXT NOT NULL
			)`),
			db.prepare(`CREATE TABLE coin_topup_requests (
				id TEXT PRIMARY KEY, user_id TEXT NOT NULL, coin_amount INTEGER NOT NULL, status TEXT NOT NULL,
				admin_note TEXT, reviewed_at TEXT, updated_at TEXT NOT NULL
			)`),
			db.prepare('CREATE TABLE payment_orders (id TEXT PRIMARY KEY, status TEXT NOT NULL, provider_status TEXT, updated_at INTEGER NOT NULL)'),
			db.prepare("INSERT INTO coin_wallets (user_id, balance) VALUES ('user-1', 40)"),
			db.prepare("INSERT INTO coin_topup_requests (id, user_id, coin_amount, status, updated_at) VALUES ('SO-C-R1', 'user-1', 100, 'approved', 'old')"),
			db.prepare("INSERT INTO payment_orders (id, status, updated_at) VALUES ('SO-C-R1', 'sukses', 0)")
		]);
		const input = {
			db,
			orderId: 'SO-C-R1',
			userId: 'user-1',
			coinAmount: 100,
			transactionStatus: 'refund',
			nowIso: '2026-07-23T13:00:00.000Z',
			nowMs: 1_767_225_660_000
		};
		const results = await Promise.all([
			reverseApprovedCoinTopup(input),
			reverseApprovedCoinTopup(input)
		]);
		assert.deepEqual(results.sort(), [false, true]);
		assert.deepEqual(await db.prepare("SELECT balance FROM coin_wallets WHERE user_id = 'user-1'").first(), { balance: -60 });
		assert.deepEqual(await db.prepare("SELECT COUNT(*) AS total FROM coin_transactions WHERE type = 'refund'").first(), { total: 1 });
		assert.deepEqual(await db.prepare("SELECT amount, balance_after AS balanceAfter FROM coin_transactions WHERE type = 'refund'").first(), { amount: -100, balanceAfter: -60 });
		assert.deepEqual(await db.prepare("SELECT status FROM coin_topup_requests WHERE id = 'SO-C-R1'").first(), { status: 'rejected' });
		assert.deepEqual(await db.prepare("SELECT status FROM payment_orders WHERE id = 'SO-C-R1'").first(), { status: 'refunded' });
	} finally {
		await mf.dispose();
	}
});

test('a terminal refund prevents a later settlement from crediting coins', async () => {
	const mf = new Miniflare({
		modules: true,
		script: 'export default { fetch() { return new Response("ok") } }',
		d1Databases: { DB: crypto.randomUUID() }
	});
	try {
		const db = await mf.getD1Database('DB');
		await db.batch([
			db.prepare('CREATE TABLE coin_wallets (user_id TEXT PRIMARY KEY, balance INTEGER NOT NULL DEFAULT 0, updated_at TEXT)'),
			db.prepare(`CREATE TABLE coin_transactions (
				id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, amount INTEGER NOT NULL,
				balance_after INTEGER, description TEXT, reference_type TEXT, reference_id TEXT, created_at TEXT NOT NULL
			)`),
			db.prepare(`CREATE TABLE coin_topup_requests (
				id TEXT PRIMARY KEY, user_id TEXT NOT NULL, coin_amount INTEGER NOT NULL, status TEXT NOT NULL,
				admin_note TEXT, reviewed_at TEXT, updated_at TEXT NOT NULL
			)`),
			db.prepare('CREATE TABLE payment_orders (id TEXT PRIMARY KEY, status TEXT NOT NULL, provider_status TEXT, updated_at INTEGER NOT NULL)'),
			db.prepare("INSERT INTO coin_topup_requests (id, user_id, coin_amount, status, updated_at) VALUES ('SO-C-R2', 'user-1', 100, 'pending', 'old')"),
			db.prepare("INSERT INTO payment_orders (id, status, updated_at) VALUES ('SO-C-R2', 'pending', 0)")
		]);

		await reverseApprovedCoinTopup({
			db,
			orderId: 'SO-C-R2',
			userId: 'user-1',
			coinAmount: 100,
			transactionStatus: 'refund',
			nowIso: '2026-07-23T13:00:00.000Z',
			nowMs: 1
		});
		const settled = await fulfillPendingCoinTopup({
			db,
			orderId: 'SO-C-R2',
			userId: 'user-1',
			coinAmount: 100,
			transactionStatus: 'settlement',
			nowIso: '2026-07-23T13:01:00.000Z',
			nowMs: 2
		});

		assert.equal(settled, false);
		assert.deepEqual(await db.prepare("SELECT balance FROM coin_wallets WHERE user_id = 'user-1'").first(), { balance: 0 });
		assert.deepEqual(await db.prepare("SELECT status FROM coin_topup_requests WHERE id = 'SO-C-R2'").first(), { status: 'rejected' });
		assert.deepEqual(await db.prepare("SELECT status FROM payment_orders WHERE id = 'SO-C-R2'").first(), { status: 'refunded' });
	} finally {
		await mf.dispose();
	}
});
