import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { Miniflare } from 'miniflare';

import { runIdempotentAdminBusinessMutation } from './admin-idempotency.ts';

const createDb = async () => {
	const mf = new Miniflare({ modules: true, script: 'export default {}', d1Databases: ['DB'] });
	const db = await mf.getD1Database('DB');
	await db
		.prepare(`CREATE TABLE business_idempotency_keys (
			scope TEXT NOT NULL,
			idempotency_key TEXT NOT NULL,
			request_hash TEXT NOT NULL,
			resource_id TEXT NOT NULL,
			response_json TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			expires_at INTEGER NOT NULL,
			PRIMARY KEY (scope, idempotency_key)
		)`)
		.run();
	return { mf, db };
};

test('admin mutation retries replay once and reject payload mismatch', async () => {
	const { mf, db } = await createDb();
	const headers = { 'Idempotency-Key': 'admin-retry-key-0001' };
	let executions = 0;
	try {
		const execute = async () => {
			executions += 1;
			return { response: { ok: true, resource: { id: 'lead-1' } }, resourceId: 'lead-1', status: 201 };
		};
		const first = await runIdempotentAdminBusinessMutation({
			db,
			request: new Request('https://example.test', { method: 'POST', headers }),
			actorId: 'admin-1',
			scope: 'admin_create_lead',
			payload: { need: 'website' },
			execute
		});
		assert.equal(first.status, 201);

		const replay = await runIdempotentAdminBusinessMutation({
			db,
			request: new Request('https://example.test', { method: 'POST', headers }),
			actorId: 'admin-1',
			scope: 'admin_create_lead',
			payload: { need: 'website' },
			execute
		});
		assert.equal(replay.status, 200);
		assert.equal((await replay.json()).replayed, true);
		assert.equal(executions, 1);

		const mismatch = await runIdempotentAdminBusinessMutation({
			db,
			request: new Request('https://example.test', { method: 'POST', headers }),
			actorId: 'admin-1',
			scope: 'admin_create_lead',
			payload: { need: 'different' },
			execute
		});
		assert.equal(mismatch.status, 409);
		assert.equal(executions, 1);
	} finally {
		await mf.dispose();
	}
});
