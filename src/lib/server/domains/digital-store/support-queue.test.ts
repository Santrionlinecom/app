import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { Miniflare } from 'miniflare';
import { listSupportRequests, transitionSupportRequest } from './support-queue.ts';

const setup = async () => {
	const mf = new Miniflare({ modules: true, script: 'export default { fetch(){ return new Response("ok") } }', d1Databases: { DB: crypto.randomUUID() } });
	const db = await mf.getD1Database('DB');
	await db.exec(`CREATE TABLE digital_products(id TEXT PRIMARY KEY,title TEXT,license_package TEXT); CREATE TABLE digital_product_sales(id TEXT PRIMARY KEY,product_id TEXT,buyer_user_id TEXT,reference_code TEXT); CREATE TABLE digital_support_requests(id TEXT PRIMARY KEY,sale_id TEXT UNIQUE,user_id TEXT,status TEXT,requested_at INTEGER,updated_at INTEGER,updated_by TEXT); CREATE TABLE digital_support_request_transitions(id TEXT PRIMARY KEY,support_request_id TEXT,from_status TEXT,to_status TEXT,actor_user_id TEXT,created_at INTEGER); INSERT INTO digital_products VALUES('p','Bantuan','bantuan'); INSERT INTO digital_product_sales VALUES('s','p','u','REF-1'); INSERT INTO digital_support_requests VALUES('r','s','u','pending_contact',1,1,NULL);`);
	return { mf, db };
};

test('queue is minimal and transition flow is audited', async () => {
	const { mf, db } = await setup(); try {
		assert.deepEqual(await listSupportRequests(db, 'pending_contact'), [{ id:'r', referenceCode:'REF-1', productTitle:'Bantuan', status:'pending_contact', requestedAt:1, updatedAt:1, updatedBy:null }]);
		await transitionSupportRequest(db, { id:'r', expectedStatus:'pending_contact', nextStatus:'contacted', actorUserId:'admin', nowMs:2 });
		assert.deepEqual(await db.prepare("SELECT status,updated_by updatedBy FROM digital_support_requests WHERE id='r'").first(), { status:'contacted', updatedBy:'admin' });
		assert.equal((await db.prepare('SELECT COUNT(*) total FROM digital_support_request_transitions').first<{total:number}>())?.total, 1);
	} finally { await mf.dispose(); }
});

test('invalid and stale transitions fail closed', async () => {
	const { mf, db } = await setup(); try {
		await assert.rejects(() => transitionSupportRequest(db, { id:'r', expectedStatus:'pending_contact', nextStatus:'completed', actorUserId:'admin' }), /Transisi/);
		await transitionSupportRequest(db, { id:'r', expectedStatus:'pending_contact', nextStatus:'contacted', actorUserId:'admin' });
		await db.prepare("UPDATE digital_support_requests SET status='scheduled' WHERE id='r'").run();
		await assert.rejects(() => transitionSupportRequest(db, { id:'r', expectedStatus:'contacted', nextStatus:'scheduled', actorUserId:'admin' }), /berubah/);
	} finally { await mf.dispose(); }
});