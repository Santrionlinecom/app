import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { Miniflare } from 'miniflare';
import type { D1Database } from '@cloudflare/workers-types';

const executeSqlFile = async (db: D1Database, sql: string) => {
	const statements = sql
		.split('\n')
		.filter((line) => !line.trimStart().startsWith('--'))
		.join('\n')
		.split(';')
		.map((statement) => statement.trim())
		.filter(Boolean);

	for (const statement of statements) {
		await db.prepare(statement).run();
	}
};

const createLegacyLearnDb = async () => {
	const mf = new Miniflare({
		modules: true,
		script: 'export default { fetch() { return new Response("ok") } }',
		d1Databases: { DB: crypto.randomUUID() }
	});
	const db = await mf.getD1Database('DB');

	await db.batch([
		db.prepare(`CREATE TABLE users (
			id TEXT PRIMARY KEY,
			email TEXT UNIQUE NOT NULL,
			role TEXT NOT NULL DEFAULT 'santri',
			org_id TEXT
		)`),

		db.prepare(`CREATE TABLE learn_modul (
			id TEXT PRIMARY KEY,
			lembaga_id TEXT,
			judul TEXT NOT NULL,
			deskripsi TEXT,
			kategori TEXT NOT NULL CHECK(kategori IN ('hijaiyah','mufrodat','nahwu','shorof','kitab','percakapan')),
			urutan INTEGER DEFAULT 0,
			is_aktif INTEGER DEFAULT 1,
			created_at INTEGER DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
		)`),

		db.prepare(`CREATE TABLE learn_soal (
			id TEXT PRIMARY KEY,
			modul_id TEXT NOT NULL REFERENCES learn_modul(id) ON DELETE CASCADE,
			tipe TEXT NOT NULL CHECK(tipe IN ('pilihan_ganda','cocokkan','isi_titik','susun_kata','dengar_pilih')),
			pertanyaan TEXT NOT NULL,
			pilihan TEXT,
			pilihan_a TEXT,
			pilihan_b TEXT,
			pilihan_c TEXT,
			pilihan_d TEXT,
			jawaban_benar TEXT NOT NULL,
			penjelasan TEXT,
			audio_url TEXT,
			urutan INTEGER DEFAULT 0
		)`),

		db.prepare(`CREATE TABLE learn_progress (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			modul_id TEXT NOT NULL REFERENCES learn_modul(id) ON DELETE CASCADE,
			soal_selesai INTEGER DEFAULT 0,
			xp INTEGER DEFAULT 0,
			streak_hari INTEGER DEFAULT 0,
			last_belajar INTEGER,
			status TEXT DEFAULT 'belum' CHECK(status IN ('belum','proses','selesai')),
			UNIQUE(user_id, modul_id)
		)`),

		db.prepare(`CREATE TABLE learn_jawaban (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			soal_id TEXT NOT NULL REFERENCES learn_soal(id) ON DELETE CASCADE,
			jawaban TEXT NOT NULL,
			is_benar INTEGER DEFAULT 0,
			waktu_jawab INTEGER DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
		)`),

		db.prepare(`CREATE TABLE learn_badge (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			lembaga_id TEXT,
			tipe TEXT NOT NULL,
			diraih_at INTEGER DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
		)`),

		db.prepare("INSERT INTO users (id, email, role) VALUES ('user-1', 'santri@example.test', 'santri')"),
		db.prepare(`INSERT INTO learn_modul (id, judul, deskripsi, kategori, urutan, is_aktif)
		VALUES ('learn-nahwu-level-01', 'Nahwu Dasar', 'Legacy populated module', 'nahwu', 1, 1)`),
		db.prepare(`INSERT INTO learn_soal (
			id, modul_id, tipe, pertanyaan, pilihan, pilihan_a, pilihan_b, pilihan_c, pilihan_d,
			jawaban_benar, penjelasan, urutan
		)
		VALUES (
			'legacy-q01', 'learn-nahwu-level-01', 'pilihan_ganda', 'Legacy question',
			'["A","B","C","D"]', 'A', 'B', 'C', 'D', 'a', 'Legacy explanation', 1
		)`),
		db.prepare(`INSERT INTO learn_progress (id, user_id, modul_id, soal_selesai, xp, status)
		VALUES ('progress-1', 'user-1', 'learn-nahwu-level-01', 1, 10, 'selesai')`)
	]);

	return { mf, db };
};

test('0059 learning path migration preserves legacy rows and seeds safe intro tracks', async () => {
	const { mf, db } = await createLegacyLearnDb();
	try {
		const migration = await readFile('migrations/0059_santri_learn_paths.sql', 'utf8');
		await executeSqlFile(db, migration);

		const columns = await db.prepare('PRAGMA table_info(learn_modul)').all<{ name: string }>();
		assert.ok((columns.results ?? []).some((column) => column.name === 'path_key'));

		assert.deepEqual(
			await db
				.prepare("SELECT path_key AS pathKey FROM learn_modul WHERE id = 'learn-nahwu-level-01'")
				.first(),
			{ pathKey: 'arabic_nahwu' }
		);
		assert.deepEqual(
			await db
				.prepare("SELECT soal_selesai AS soalSelesai, xp, status FROM learn_progress WHERE id = 'progress-1'")
				.first(),
			{ soalSelesai: 1, xp: 10, status: 'selesai' }
		);

		const paths = await db.prepare('SELECT key FROM learn_paths WHERE is_active = 1').all<{ key: string }>();
		assert.deepEqual(
			(paths.results ?? []).map((row) => row.key).sort(),
			['adab', 'aqidah_aswaja', 'arabic_nahwu', 'fikih_praktis', 'sirah', 'skill_masa_depan'].sort()
		);

		const introRows = await db
			.prepare(
				`SELECT m.path_key AS pathKey, COUNT(s.id) AS total, SUM(CASE WHEN s.penjelasan IS NOT NULL AND s.penjelasan <> '' THEN 1 ELSE 0 END) AS explained
				 FROM learn_modul m
				 JOIN learn_soal s ON s.modul_id = m.id
				 WHERE m.path_key IN ('aqidah_aswaja','adab','fikih_praktis','sirah','skill_masa_depan')
				 GROUP BY m.path_key`
			)
			.all<{ pathKey: string; total: number; explained: number }>();

		assert.equal(introRows.results?.length, 5);
		for (const row of introRows.results ?? []) {
			assert.ok(row.total >= 3, `${row.pathKey} has at least 3 questions`);
			assert.equal(row.explained, row.total, `${row.pathKey} questions include explanations`);
		}
	} finally {
		await mf.dispose();
	}
});
