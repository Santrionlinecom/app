import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { Miniflare } from 'miniflare';

import { createBusinessQuote, decideQuoteApproval, transitionBusinessLead } from './repository.ts';

const createTestDb = async () => {
	const mf = new Miniflare({
		modules: true,
		script: 'export default { fetch() { return new Response("ok") } }',
		d1Databases: { DB: crypto.randomUUID() }
	});
	const db = await mf.getD1Database('DB');
	await db.batch([
		db.prepare(`CREATE TABLE business_leads (
			id TEXT PRIMARY KEY, source TEXT NOT NULL, contact_name TEXT NOT NULL,
			contact_email TEXT, contact_whatsapp TEXT, organization_name TEXT, need_summary TEXT NOT NULL,
			status TEXT NOT NULL, created_by TEXT NOT NULL, assigned_to TEXT,
			created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, mutation_token TEXT
		)`),
		db.prepare(`CREATE TABLE business_quotes (
			id TEXT PRIMARY KEY, lead_id TEXT NOT NULL, version INTEGER NOT NULL, currency TEXT NOT NULL,
			subtotal INTEGER NOT NULL, discount INTEGER NOT NULL, total INTEGER NOT NULL,
			package_snapshot_json TEXT NOT NULL, assumptions_json TEXT NOT NULL, payload_hash TEXT NOT NULL,
			status TEXT NOT NULL, expires_at INTEGER NOT NULL, created_by TEXT NOT NULL,
			created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, mutation_token TEXT, UNIQUE(lead_id, version)
		)`),
		db.prepare(`CREATE TABLE business_approvals (
			id TEXT PRIMARY KEY, action_type TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT NOT NULL,
			payload_hash TEXT NOT NULL, status TEXT NOT NULL, requested_by TEXT NOT NULL,
			requested_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, decided_by TEXT,
			decided_at INTEGER, decision_note TEXT, mutation_token TEXT
		)`),
		db.prepare(`CREATE TABLE business_orders (
			id TEXT PRIMARY KEY, lead_id TEXT NOT NULL, quote_id TEXT NOT NULL UNIQUE,
			status TEXT NOT NULL, payment_order_id TEXT, license_id TEXT,
			created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
		)`),
		db.prepare(`CREATE TABLE business_state_transitions (
			id TEXT PRIMARY KEY, aggregate_type TEXT NOT NULL, aggregate_id TEXT NOT NULL,
			from_state TEXT NOT NULL, to_state TEXT NOT NULL, event_type TEXT NOT NULL,
			actor_type TEXT NOT NULL, actor_id TEXT NOT NULL, reason TEXT, created_at INTEGER NOT NULL
		)`),
		db.prepare(`CREATE TABLE business_audit_events (
			id TEXT PRIMARY KEY, event_type TEXT NOT NULL, actor_type TEXT NOT NULL, actor_id TEXT NOT NULL,
			resource_type TEXT NOT NULL, resource_id TEXT NOT NULL, payload_json TEXT NOT NULL, created_at INTEGER NOT NULL
		)`),
		db.prepare(`CREATE TABLE business_kill_switches (
			scope TEXT PRIMARY KEY, enabled INTEGER NOT NULL, reason TEXT, updated_by TEXT NOT NULL, updated_at INTEGER NOT NULL
		)`),
		db.prepare("INSERT INTO business_kill_switches VALUES ('global', 0, 'test', 'test', 1)")
	]);
	await db
		.prepare(
			`INSERT INTO business_leads (
				id, source, contact_name, contact_email, need_summary, status,
				created_by, assigned_to, created_at, updated_at
			 ) VALUES ('lead-race', 'admin', 'Race Test', 'race@example.com',
				'Qualified lead for deterministic concurrency test', 'qualified',
				'admin-maker', 'admin-maker', 1, 1)`
		)
		.run();
	return { mf, db };
};

const withBatchBarrier = <T extends { batch: (...args: any[]) => Promise<unknown> }>(db: T, parties = 2): T => {
	let waiting = 0;
	let release!: () => void;
	const barrier = new Promise<void>((resolve) => {
		release = resolve;
	});
	return new Proxy(db, {
		get(target, property, receiver) {
			if (property === 'batch') {
				return async (...args: any[]) => {
					waiting += 1;
					if (waiting >= parties) release();
					await barrier;
					return target.batch(...args);
				};
			}
			const value = Reflect.get(target, property, receiver);
			return typeof value === 'function' ? value.bind(target) : value;
		}
	}) as T;
};

test('concurrent quote creation records exactly one winning transition and audit event', async () => {
	const { mf, db } = await createTestDb();
	try {
		const coordinatedDb = withBatchBarrier(db);
		const input = {
			leadId: 'lead-race',
			subtotal: 1_000_000,
			discount: 0,
			currency: 'IDR',
			packageSnapshot: { name: 'Paket Website' },
			assumptions: [],
			expiresAt: Date.now() + 86_400_000
		};
		const results = await Promise.allSettled([
			createBusinessQuote(coordinatedDb, input, { id: 'agent-a', type: 'agent' }),
			createBusinessQuote(coordinatedDb, input, { id: 'agent-b', type: 'agent' })
		]);
		assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
		assert.deepEqual(await db.prepare('SELECT COUNT(*) AS total FROM business_quotes').first(), { total: 1 });
		assert.deepEqual(
			await db
				.prepare("SELECT COUNT(*) AS total FROM business_state_transitions WHERE event_type = 'quote_created'")
				.first(),
			{ total: 1 }
		);
		assert.deepEqual(
			await db.prepare("SELECT COUNT(*) AS total FROM business_audit_events WHERE event_type = 'quote_created'").first(),
			{ total: 1 }
		);
	} finally {
		await mf.dispose();
	}
});

test('concurrent lead transition attributes history only to the winning actor', async () => {
	const { mf, db } = await createTestDb();
	const originalNow = Date.now;
	Date.now = () => 1_777_777_777_777;
	try {
		const coordinatedDb = withBatchBarrier(db);
		const results = await Promise.allSettled([
			transitionBusinessLead(
				coordinatedDb,
				{ leadId: 'lead-race', to: 'lost', event: 'lead_lost', reason: 'actor-a' },
				{ id: 'agent-a', type: 'agent' }
			),
			transitionBusinessLead(
				coordinatedDb,
				{ leadId: 'lead-race', to: 'lost', event: 'lead_lost', reason: 'actor-b' },
				{ id: 'agent-b', type: 'agent' }
			)
		]);
		assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
		assert.deepEqual(
			await db.prepare("SELECT COUNT(*) AS total FROM business_state_transitions WHERE event_type = 'lead_lost'").first(),
			{ total: 1 }
		);
		assert.deepEqual(
			await db.prepare("SELECT COUNT(*) AS total FROM business_audit_events WHERE event_type = 'lead_transitioned'").first(),
			{ total: 1 }
		);
	} finally {
		Date.now = originalNow;
		await mf.dispose();
	}
});

test('concurrent duplicate rejection records one decision transition and audit event', async () => {
	const { mf, db } = await createTestDb();
	const originalNow = Date.now;
	Date.now = () => 1_777_777_777_777;
	try {
		const hash = 'a'.repeat(64);
		await db.batch([
			db.prepare(`INSERT INTO business_quotes (
				id, lead_id, version, currency, subtotal, discount, total,
				package_snapshot_json, assumptions_json, payload_hash, status,
				expires_at, created_by, created_at, updated_at
			) VALUES ('quote-decision', 'lead-race', 1, 'IDR', 1000, 0, 1000,
				'{"name":"test"}', '[]', ?, 'awaiting_approval', ?, 'maker', 1, 1)`).bind(hash, Date.now() + 60_000),
			db.prepare(`INSERT INTO business_approvals (
				id, action_type, resource_type, resource_id, payload_hash, status,
				requested_by, requested_at, expires_at
			) VALUES ('approval-race', 'quote_approval', 'quote', 'quote-decision', ?, 'pending', 'maker', 1, ?)`).bind(
				hash,
				Date.now() + 60_000
			)
		]);
		const coordinatedDb = withBatchBarrier(db);
		const results = await Promise.allSettled([
			decideQuoteApproval(
				coordinatedDb,
				{ approvalId: 'approval-race', decision: 'reject', note: 'duplicate' },
				{ id: 'admin-reviewer', type: 'admin' }
			),
			decideQuoteApproval(
				coordinatedDb,
				{ approvalId: 'approval-race', decision: 'reject', note: 'duplicate' },
				{ id: 'admin-reviewer', type: 'admin' }
			)
		]);
		assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
		assert.deepEqual(
			await db.prepare("SELECT COUNT(*) AS total FROM business_state_transitions WHERE event_type = 'approval_rejected'").first(),
			{ total: 1 }
		);
		assert.deepEqual(
			await db.prepare("SELECT COUNT(*) AS total FROM business_audit_events WHERE event_type = 'approval_rejected'").first(),
			{ total: 1 }
		);
	} finally {
		Date.now = originalNow;
		await mf.dispose();
	}
});

test('expired approval atomically returns quote to draft for a fresh approval request', async () => {
	const { mf, db } = await createTestDb();
	try {
		const hash = 'b'.repeat(64);
		await db.batch([
			db.prepare(`INSERT INTO business_quotes (
				id, lead_id, version, currency, subtotal, discount, total,
				package_snapshot_json, assumptions_json, payload_hash, status,
				expires_at, created_by, created_at, updated_at
			) VALUES ('quote-expired', 'lead-race', 1, 'IDR', 1000, 0, 1000,
				'{"name":"test"}', '[]', ?, 'awaiting_approval', ?, 'maker', 1, 1)`).bind(hash, Date.now() + 60_000),
			db.prepare(`INSERT INTO business_approvals (
				id, action_type, resource_type, resource_id, payload_hash, status,
				requested_by, requested_at, expires_at
			) VALUES ('approval-expired', 'quote_approval', 'quote', 'quote-expired', ?, 'pending', 'maker', 1, 2)`).bind(hash)
		]);
		await assert.rejects(
			decideQuoteApproval(
				db,
				{ approvalId: 'approval-expired', decision: 'reject', note: 'expired' },
				{ id: 'admin-reviewer', type: 'admin' }
			),
			/Approval bisnis sudah kedaluwarsa/
		);
		assert.deepEqual(await db.prepare("SELECT status FROM business_approvals WHERE id = 'approval-expired'").first(), {
			status: 'expired'
		});
		assert.deepEqual(await db.prepare("SELECT status FROM business_quotes WHERE id = 'quote-expired'").first(), {
			status: 'draft'
		});
		assert.deepEqual(
			await db.prepare("SELECT COUNT(*) AS total FROM business_state_transitions WHERE event_type = 'approval_expired'").first(),
			{ total: 1 }
		);
	} finally {
		await mf.dispose();
	}
});
