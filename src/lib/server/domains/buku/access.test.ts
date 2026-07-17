import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { Miniflare } from 'miniflare';

import { unlockBukuChapter } from './access.ts';
import { ensureBukuWalletSchema } from './wallet.ts';

test('dua unlock bab bersamaan hanya memotong satu kali dan mencatat satu royalti', async () => {
	const mf = new Miniflare({
		modules: true,
		script: 'export default { fetch() { return new Response("ok") } }',
		d1Databases: { DB: crypto.randomUUID() }
	});

	try {
		const db = await mf.getD1Database('DB');
		await db.batch([
			db.prepare('CREATE TABLE users (id TEXT PRIMARY KEY)'),
			db.prepare(`CREATE TABLE buku_books (
				id TEXT PRIMARY KEY,
				author_id TEXT NOT NULL
			)`),
			db.prepare(`CREATE TABLE buku_chapters (
				id TEXT PRIMARY KEY,
				book_id TEXT NOT NULL
			)`),
			db.prepare("INSERT INTO users (id) VALUES ('author-1'), ('reader-1')"),
			db.prepare("INSERT INTO buku_books (id, author_id) VALUES ('book-1', 'author-1')"),
			db.prepare("INSERT INTO buku_chapters (id, book_id) VALUES ('chapter-8', 'book-1')")
		]);

		const input = {
			userId: 'reader-1',
			bookId: 'book-1',
			chapterId: 'chapter-8',
			coinPrice: 300,
			description: 'Unlock bab 8'
		};

		await ensureBukuWalletSchema(db);
		await db.prepare("INSERT INTO coin_wallets (user_id, balance) VALUES ('reader-1', 1000)").run();

		const results = await Promise.all([unlockBukuChapter(db, input), unlockBukuChapter(db, input)]);
		assert.deepEqual(
			results.map((result) => result.status).sort(),
			['already_unlocked', 'unlocked']
		);
		assert.deepEqual(
			await db.prepare("SELECT balance FROM coin_wallets WHERE user_id = 'reader-1'").first(),
			{ balance: 700 }
		);
		assert.deepEqual(await db.prepare('SELECT COUNT(*) AS total FROM buku_unlocks').first(), { total: 1 });
		assert.deepEqual(await db.prepare('SELECT COUNT(*) AS total FROM coin_transactions').first(), { total: 1 });
		assert.deepEqual(await db.prepare('SELECT COUNT(*) AS total FROM buku_author_royalty_ledger').first(), {
			total: 1
		});
		assert.deepEqual(
			await db
				.prepare(
					"SELECT total_earned_coin AS totalEarned, pending_coin AS pendingCoin FROM buku_author_wallets WHERE author_id = 'author-1'"
				)
				.first(),
			{ totalEarned: 210, pendingCoin: 210 }
		);
	} finally {
		await mf.dispose();
	}
});
