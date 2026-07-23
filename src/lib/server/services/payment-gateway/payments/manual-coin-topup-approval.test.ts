import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { Miniflare } from 'miniflare';

import {
	approveManualCoinTopup,
	rejectManualCoinTopup
} from './manual-coin-topup-approval.ts';

const setup = async () => {
	const mf = new Miniflare({
		modules: true,
		script: 'export default { fetch() { return new Response("ok") } }',
		d1Databases: { DB: crypto.randomUUID() }
	});
	const db = await mf.getD1Database('DB');
	await db.batch([
		db.prepare(`CREATE TABLE coin_wallets (user_id TEXT PRIMARY KEY, balance INTEGER NOT NULL DEFAULT 0, updated_at TEXT)`),
		db.prepare(`CREATE TABLE coin_transactions (
			id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, amount INTEGER NOT NULL,
			balance_after INTEGER, description TEXT, reference_type TEXT, reference_id TEXT, created_at TEXT
		)`),
		db.prepare(`CREATE TABLE coin_topup_requests (
			id TEXT PRIMARY KEY, user_id TEXT NOT NULL, coin_amount INTEGER NOT NULL, proof_url TEXT,
			status TEXT NOT NULL, admin_note TEXT, reviewed_by TEXT, reviewed_at TEXT, updated_at TEXT
		)`),
		db.prepare(`CREATE TABLE payment_orders (id TEXT PRIMARY KEY, provider TEXT NOT NULL, purpose TEXT NOT NULL, status TEXT NOT NULL)`),
		db.prepare("INSERT INTO coin_topup_requests (id, user_id, coin_amount, status) VALUES ('MID-1', 'user-1', 100, 'pending')"),
		db.prepare("INSERT INTO payment_orders (id, provider, purpose, status) VALUES ('MID-1', 'midtrans', 'coin_topup', 'pending')")
	]);
	return { mf, db };
};

test('admin route delegates approval to the guarded manual settlement helper', async () => {
	const route = await readFile(
		new URL('../../../../../routes/(app)/admin/super/coin-topups/[id]/+page.server.ts', import.meta.url),
		'utf8'
	);
	assert.match(route, /approveManualCoinTopup/);
	assert.doesNotMatch(route, /UPDATE coin_wallets SET balance/);
	assert.doesNotMatch(route, /generateId/);
});

test('approve and reject race has exactly one terminal winner', async () => {
	const { mf, db } = await setup();
	try {
		await db
			.prepare(
				"INSERT INTO coin_topup_requests (id, user_id, coin_amount, status, proof_url) VALUES ('manual-race', 'user-1', 75, 'pending', 'https://example.test/proof.jpg')"
			)
			.run();

		await Promise.all([
			approveManualCoinTopup({ db, orderId: 'manual-race', adminUserId: 'admin-1' }),
			rejectManualCoinTopup({
				db,
				orderId: 'manual-race',
				adminUserId: 'admin-2',
				adminNote: 'Bukti tidak sah'
			})
		]);

		const request = await db
			.prepare("SELECT status FROM coin_topup_requests WHERE id = 'manual-race'")
			.first<{ status: string }>();
		const wallet = await db
			.prepare("SELECT balance FROM coin_wallets WHERE user_id = 'user-1'")
			.first<{ balance: number }>();
		assert.ok(request?.status === 'approved' || request?.status === 'rejected');
		assert.equal(wallet?.balance ?? 0, request?.status === 'approved' ? 75 : 0);
	} finally {
		await mf.dispose();
	}
});

test('manual approval credits a proof-backed request exactly once under concurrent replay', async () => {
	const { mf, db } = await setup();
	try {
		await db
			.prepare(
				"INSERT INTO coin_topup_requests (id, user_id, coin_amount, proof_url, status) VALUES ('MAN-1', 'user-1', 250, 'https://files.test/proof.jpg', 'pending')"
			)
			.run();
		const input = {
			db,
			orderId: 'MAN-1',
			adminUserId: 'admin-1',
			nowIso: '2026-07-23T12:00:00.000Z'
		};
		const results = await Promise.all([
			approveManualCoinTopup(input),
			approveManualCoinTopup(input)
		]);
		assert.equal(results.filter((result) => result.status === 'approved').length, 1);
		assert.equal(results.filter((result) => result.status === 'already_processed').length, 1);
		assert.deepEqual(
			await db.prepare("SELECT balance FROM coin_wallets WHERE user_id = 'user-1'").first(),
			{ balance: 250 }
		);
		assert.deepEqual(
			await db.prepare("SELECT COUNT(*) AS total FROM coin_transactions WHERE reference_id = 'MAN-1'").first(),
			{ total: 1 }
		);
		assert.deepEqual(
			await db.prepare("SELECT status FROM coin_topup_requests WHERE id = 'MAN-1'").first(),
			{ status: 'approved' }
		);
	} finally {
		await mf.dispose();
	}
});

test('manual approval rejects provider-managed Midtrans topups without crediting coins', async () => {
	const { mf, db } = await setup();
	try {
		const result = await approveManualCoinTopup({
			db,
			orderId: 'MID-1',
			adminUserId: 'admin-1',
			nowIso: '2026-07-23T12:00:00.000Z'
		});
		assert.deepEqual(result, { status: 'provider_managed' });
		assert.deepEqual(
			await db.prepare("SELECT COUNT(*) AS total FROM coin_transactions").first(),
			{ total: 0 }
		);
		assert.deepEqual(
			await db.prepare("SELECT status FROM coin_topup_requests WHERE id = 'MID-1'").first(),
			{ status: 'pending' }
		);
	} finally {
		await mf.dispose();
	}
});
