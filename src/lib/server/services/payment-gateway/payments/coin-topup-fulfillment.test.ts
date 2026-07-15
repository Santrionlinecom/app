import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { Miniflare } from 'miniflare';

import { fulfillPendingCoinTopup } from './coin-topup-fulfillment.ts';

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
