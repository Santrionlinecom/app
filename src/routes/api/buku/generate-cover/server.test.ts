import { strict as assert } from 'node:assert';
import { after, before, test } from 'node:test';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { Miniflare } from 'miniflare';

import { POST } from './+server.ts';

let mf: Miniflare;
let db: D1Database;
let bucket: R2Bucket;
let aiCalls = 0;

const user = { id: 'writer-1' };
const ai = {
	run: async () => {
		aiCalls += 1;
		const bytes = new Uint8Array(1500);
		bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
		return bytes;
	}
};

const callPost = (body: unknown, currentUser: { id: string } | null = user) =>
	POST({
		request: new Request('http://localhost/api/buku/generate-cover', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		}),
		locals: { user: currentUser, db },
		platform: {
			env: {
				DB: db,
				BUCKET: bucket,
				AI: ai,
				R2_PUBLIC_BASE_URL: 'https://files.test'
			}
		}
	} as any);

before(async () => {
	mf = new Miniflare({
		modules: true,
		script: 'export default { fetch() { return new Response("ok") } }',
		d1Databases: { DB: 'cover-test-db' },
		r2Buckets: { BUCKET: 'cover-test-bucket' }
	});
	db = (await mf.getD1Database('DB')) as unknown as D1Database;
	bucket = (await mf.getR2Bucket('BUCKET')) as unknown as R2Bucket;
	await db
		.prepare(
			`CREATE TABLE buku_books (
				id TEXT PRIMARY KEY,
				author_id TEXT NOT NULL,
				status TEXT NOT NULL
			)`
		)
		.run();
	await db
		.prepare("INSERT INTO buku_books (id, author_id, status) VALUES ('book-1', 'other-writer', 'draft')")
		.run();
});

after(async () => {
	await mf.dispose();
});

test('generator cover mewajibkan login', async () => {
	const response = await callPost({ title: 'Novel Santri' }, null);
	assert.equal(response.status, 401);
});

test('generator cover menolak buku milik penulis lain sebelum memanggil AI', async () => {
	const callsBefore = aiCalls;
	const response = await callPost({ book_id: 'book-1', title: 'Novel Santri' });
	assert.equal(response.status, 404);
	assert.equal(aiCalls, callsBefore);
});

test('generator cover menyimpan hasil AI ke R2 dengan URL publik', async () => {
	const response = await callPost({
		title: 'Cahaya dari Pesantren',
		category: 'Novel Santri',
		description: 'Perjalanan seorang santri menjaga amanah dan persahabatan.'
	});
	assert.equal(response.status, 200);
	const result = (await response.json()) as { success: boolean; key: string; url: string };
	assert.equal(result.success, true);
	assert.match(result.key, /^buku\/covers\/writer-1\/ai-.+\.png$/);
	assert.equal(result.url, `https://files.test/${result.key}`);
	const stored = await bucket.get(result.key);
	assert.ok(stored);
	assert.equal(stored?.httpMetadata?.contentType, 'image/png');
});

test('generator cover membatasi akun maksimal empat permintaan per sepuluh menit', async () => {
	const rateLimitUser = { id: 'writer-rate-limit' };
	for (let index = 0; index < 4; index += 1) {
		const response = await callPost({ title: `Novel Santri ${index}` }, rateLimitUser);
		assert.equal(response.status, 200);
	}
	const limited = await callPost({ title: 'Novel Santri Terakhir' }, rateLimitUser);
	assert.equal(limited.status, 429);
	assert.equal(limited.headers.get('X-RateLimit-Limit'), '4');
});

test('generator cover membatasi biaya dengan jatah harian per akun', async () => {
	const user = { id: 'writer-daily-limit' };
	const dayMs = 24 * 60 * 60 * 1000;
	const windowStart = Math.floor(Date.now() / dayMs) * dayMs;
	await db
		.prepare(
			`INSERT INTO api_rate_limits (scope, limiter_key, window_start, request_count, updated_at)
			 VALUES (?, ?, ?, 12, ?)`
		)
		.bind('buku:generate-cover:daily', `user:${user.id}`, windowStart, Date.now())
		.run();

	const blocked = await callPost({ title: 'Cover Ketiga Belas Hari Ini' }, user);
	assert.equal(blocked.status, 429);
	assert.match((await blocked.json()).error, /jatah cover AI hari ini/i);
});
