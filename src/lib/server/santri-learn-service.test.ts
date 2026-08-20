import assert from 'node:assert/strict';
import test from 'node:test';
import { Miniflare } from 'miniflare';

import { listLearnModules, toPublicLearnQuestion } from './santri-learn.ts';

const createDb = async () => {
	const mf = new Miniflare({
		modules: true,
		script: 'export default { fetch() { return new Response("ok") } }',
		d1Databases: { DB: crypto.randomUUID() }
	});
	const db = await mf.getD1Database('DB');
	await db.batch([
		db.prepare(`CREATE TABLE learn_paths (
			key TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			purpose TEXT NOT NULL,
			sort_order INTEGER NOT NULL DEFAULT 0,
			is_active INTEGER NOT NULL DEFAULT 1,
			kitab_slug TEXT
		)`),
		db.prepare(`CREATE TABLE learn_modul (
			id TEXT PRIMARY KEY,
			lembaga_id TEXT,
			path_key TEXT NOT NULL DEFAULT 'arabic_nahwu',
			judul TEXT NOT NULL,
			deskripsi TEXT,
			kategori TEXT NOT NULL,
			urutan INTEGER DEFAULT 0,
			is_aktif INTEGER DEFAULT 1,
			created_at INTEGER DEFAULT 1
		)`),
		db.prepare(`CREATE TABLE learn_soal (
			id TEXT PRIMARY KEY,
			modul_id TEXT NOT NULL,
			tipe TEXT NOT NULL,
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
			user_id TEXT NOT NULL,
			modul_id TEXT NOT NULL,
			soal_selesai INTEGER DEFAULT 0,
			xp INTEGER DEFAULT 0,
			streak_hari INTEGER DEFAULT 0,
			last_belajar INTEGER,
			status TEXT DEFAULT 'belum',
			UNIQUE(user_id, modul_id)
		)`),
		db.prepare(`INSERT INTO learn_paths (key, title, purpose, sort_order)
			VALUES
			('adab', 'Adab', 'Membiasakan akhlak belajar dan keluarga.', 20),
			('arabic_nahwu', 'Bahasa Arab & Nahwu', 'Membaca teks Arab dasar.', 60)`),
		db.prepare(`INSERT INTO learn_modul (id, path_key, judul, deskripsi, kategori, urutan)
			VALUES
			('adab-01', 'adab', 'Adab 1', 'Intro adab', 'kitab', 1),
			('adab-02', 'adab', 'Adab 2', 'Lanjutan adab', 'kitab', 2),
			('arabic-01', 'arabic_nahwu', 'Nahwu 1', 'Intro nahwu', 'nahwu', 1),
			('arabic-02', 'arabic_nahwu', 'Nahwu 2', 'Lanjutan nahwu', 'nahwu', 2)`),
		db.prepare(`INSERT INTO learn_soal (id, modul_id, tipe, pertanyaan, jawaban_benar, urutan)
			VALUES
			('q-adab-01', 'adab-01', 'pilihan_ganda', 'Adab?', 'a', 1),
			('q-adab-02', 'adab-02', 'pilihan_ganda', 'Adab lanjut?', 'a', 1),
			('q-arabic-01', 'arabic-01', 'pilihan_ganda', 'Nahwu?', 'a', 1),
			('q-arabic-02', 'arabic-02', 'pilihan_ganda', 'Nahwu lanjut?', 'a', 1)`),
		db.prepare(`INSERT INTO learn_progress (id, user_id, modul_id, soal_selesai, xp, status)
			VALUES ('p-arabic-01', 'user-1', 'arabic-01', 1, 10, 'selesai')`)
	]);
	return { mf, db };
};

test('listLearnModules returns path metadata and locks modules inside each track only', async () => {
	const { mf, db } = await createDb();
	try {
		const modules = await listLearnModules(db, null, 'user-1');

		assert.deepEqual(
			modules.map((module) => [module.id, module.pathKey, module.pathTitle, module.locked]),
			[
				['adab-01', 'adab', 'Adab', false],
				['adab-02', 'adab', 'Adab', true],
				['arabic-01', 'arabic_nahwu', 'Bahasa Arab & Nahwu', false],
				['arabic-02', 'arabic_nahwu', 'Bahasa Arab & Nahwu', false]
			]
		);
		assert.equal(modules[0]?.pathPurpose, 'Membiasakan akhlak belajar dan keluarga.');
	} finally {
		await mf.dispose();
	}
});

test('public quiz payload hides answer and explanation until submission', () => {
	const publicQuestion = toPublicLearnQuestion({
		id: 'q-1',
		modulId: 'adab-01',
		tipe: 'pilihan_ganda',
		pertanyaan: 'Adab?',
		pilihan: '["Benar","Salah"]',
		options: ['Benar', 'Salah'],
		pilihanA: 'Benar',
		pilihanB: 'Salah',
		pilihanC: null,
		pilihanD: null,
		jawabanBenar: 'a',
		answerKey: 'a',
		correctAnswerText: 'Benar',
		penjelasan: 'Jawaban yang benar adalah Benar.',
		audioUrl: null,
		urutan: 1
	});

	assert.equal('jawabanBenar' in publicQuestion, false);
	assert.equal('penjelasan' in publicQuestion, false);
});
