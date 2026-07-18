import assert from 'node:assert/strict';
import test from 'node:test';
import { Miniflare } from 'miniflare';
import {
	CHAT_MODEL,
	EMBEDDING_MODEL,
	MAX_EVIDENCE_CHUNKS,
	buildKitabChunkId,
	cariJawaban,
	ensureKitabReferenceSchema,
	findActiveKitabSlugs,
	filterRelevantMatches,
	generateEmbeddings,
	insertDokumenBatch,
	reconcileIndexingKitabRows
} from './rag.ts';

test('ID chunk kitab stabil, membedakan volume, dan maksimal 64 byte', () => {
	const first = buildKitabChunkId({
		kitabSlug: 'Terjemah Bidayatul Hidayah yang judul slug-nya sangat panjang sekali',
		corpusKey: 'edisi-a:jilid-1',
		pageNumber: 12,
		chunkIndex: 3
	});
	const retry = buildKitabChunkId({
		kitabSlug: 'Terjemah Bidayatul Hidayah yang judul slug-nya sangat panjang sekali',
		corpusKey: 'edisi-a:jilid-1',
		pageNumber: 12,
		chunkIndex: 3
	});
	const secondVolume = buildKitabChunkId({
		kitabSlug: 'Terjemah Bidayatul Hidayah yang judul slug-nya sangat panjang sekali',
		corpusKey: 'edisi-a:jilid-2',
		pageNumber: 12,
		chunkIndex: 3
	});
	assert.equal(first, retry);
	assert.notEqual(first, secondVolume);
	assert.ok(new TextEncoder().encode(first).byteLength <= 64);
});

test('embedding kitab memakai model multilingual dan satu payload batch', async () => {
	const calls: Array<{ model: string; input: unknown }> = [];
	const ai = {
		run: async (model: string, input: unknown) => {
			calls.push({ model, input });
			return { data: [[0.1, 0.2], [0.3, 0.4]], shape: [2, 2] };
		}
	};

	const result = await generateEmbeddings(ai as never, ['Apa itu iman?', 'ما هو الإيمان؟']);

	assert.equal(CHAT_MODEL, '@cf/meta/llama-3.2-3b-instruct');
	assert.equal(MAX_EVIDENCE_CHUNKS, 4);
	assert.equal(EMBEDDING_MODEL, '@cf/google/embeddinggemma-300m');
	assert.deepEqual(calls, [
		{
			model: EMBEDDING_MODEL,
			input: { text: ['Apa itu iman?', 'ما هو الإيمان؟'] }
		}
	]);
	assert.deepEqual(result, [[0.1, 0.2], [0.3, 0.4]]);
});

const createPlatform = async (
	options: { failVector?: boolean; visibilityChecksBeforeReady?: number } = {}
) => {
	const mf = new Miniflare({
		modules: true,
		script: 'export default { fetch() { return new Response("ok") } }',
		d1Databases: { DB: crypto.randomUUID() }
	});
	const db = await mf.getD1Database('DB');
	const statusesDuringUpsert: string[][] = [];
	const vectorMetadata: Array<Record<string, unknown>> = [];
	const upsertedIds: string[] = [];
	let visibilityChecks = 0;
	const aiCalls: unknown[] = [];
	const ai = {
		run: async (_model: string, input: unknown) => {
			aiCalls.push(input);
			const texts = (input as { text: string[] }).text;
			return { data: texts.map((_, index) => [index + 0.1, index + 0.2]) };
		}
	};
	const index = {
		upsert: async (vectors: Array<{ id: string; metadata: Record<string, unknown> }>) => {
			vectorMetadata.push(...vectors.map((vector) => vector.metadata));
			const placeholders = vectors.map(() => '?').join(',');
			const rows = await db
				.prepare(`SELECT status FROM kitab_referensi WHERE id IN (${placeholders}) ORDER BY id`)
				.bind(...vectors.map((vector) => vector.id))
				.all<{ status: string }>();
			statusesDuringUpsert.push((rows.results ?? []).map((row) => row.status));
			if (options.failVector) throw new Error('Vectorize gagal');
			upsertedIds.push(...vectors.map((vector) => vector.id));
			return { mutationId: 'mutation-test' };
		},
		getByIds: async (ids: string[]) => {
			visibilityChecks += 1;
			if (visibilityChecks <= (options.visibilityChecksBeforeReady ?? 0)) return [];
			return ids.filter((id) => upsertedIds.includes(id)).map((id) => ({ id, values: [] }));
		}
	};
	return {
		mf,
		db,
		aiCalls,
		vectorMetadata,
		statusesDuringUpsert,
		platform: { env: { DB: db, AI: ai, VECTORIZE_INDEX: index } } as never
	};
};

const pilotChunks = [
	{
		text: 'Segala puji bagi Allah yang memberi petunjuk kepada hamba-Nya.',
		metadata: {
			judul_kitab: 'Terjemah Bidayatul Hidayah',
			kitab_slug: 'terjemah-bidayatul-hidayah',
			halaman: 12,
			chunk_index: 0,
			source_type: 'pdf',
			source_ref: 'halaman 12'
		}
	},
	{
		text: 'Adab seorang hamba dimulai dengan menjaga perintah Allah.',
		metadata: {
			judul_kitab: 'Terjemah Bidayatul Hidayah',
			kitab_slug: 'terjemah-bidayatul-hidayah',
			halaman: 12,
			chunk_index: 1,
			source_type: 'pdf',
			source_ref: 'halaman 12'
		}
	}
];

test('batch ingestion idempoten tetap indexing sampai vector terlihat saat reconciliation', async () => {
	const fixture = await createPlatform();
	try {
		const result = await insertDokumenBatch(fixture.platform, pilotChunks);
		assert.equal(result.length, 2);
		assert.ok(result.every((item) => new TextEncoder().encode(item.id).byteLength <= 64));
		assert.deepEqual(fixture.statusesDuringUpsert, [['indexing', 'indexing']]);
		assert.ok(fixture.vectorMetadata.every((metadata) => !('text' in metadata)));
		assert.ok(fixture.vectorMetadata.every((metadata) => metadata.embedding_model === EMBEDDING_MODEL));
		assert.equal(fixture.aiCalls.length, 1);
		const pendingRows = await fixture.db
			.prepare('SELECT status FROM kitab_referensi ORDER BY id')
			.all<{ status: string }>();
		assert.deepEqual((pendingRows.results ?? []).map((row) => row.status), ['indexing', 'indexing']);
		assert.equal(await reconcileIndexingKitabRows(fixture.platform, { ensureSchema: false }), 2);
		const rows = await fixture.db
			.prepare('SELECT id, status, embedding_model AS embeddingModel FROM kitab_referensi ORDER BY id')
			.all<{ id: string; status: string; embeddingModel: string }>();
		assert.equal(rows.results?.length, 2);
		assert.ok(rows.results?.every((row) => row.status === 'indexed'));
		assert.ok(rows.results?.every((row) => row.embeddingModel === EMBEDDING_MODEL));
		assert.deepEqual(
			[...(await findActiveKitabSlugs(fixture.db as never, ['terjemah-bidayatul-hidayah']))],
			['terjemah-bidayatul-hidayah']
		);
	} finally {
		await fixture.mf.dispose();
	}
});

test('batch ingestion dibatasi 16 chunk untuk anggaran query Workers Free', async () => {
	await assert.rejects(
		() => insertDokumenBatch({} as never, Array.from({ length: 17 }, () => pilotChunks[0]!)),
		/Maksimal 16 chunk/
	);
});

test('kegagalan Vectorize menandai seluruh batch failed', async () => {
	const fixture = await createPlatform({ failVector: true });
	try {
		await assert.rejects(() => insertDokumenBatch(fixture.platform, pilotChunks), /Vectorize gagal/);
		const rows = await fixture.db
			.prepare('SELECT status, index_error AS indexError FROM kitab_referensi ORDER BY id')
			.all<{ status: string; indexError: string }>();
		assert.deepEqual((rows.results ?? []).map((row) => row.status), ['failed', 'failed']);
		assert.ok((rows.results ?? []).every((row) => row.indexError.includes('Vectorize gagal')));
	} finally {
		await fixture.mf.dispose();
	}
});

test('mutasi V2 yang diterima tetapi belum terlihat tetap berstatus indexing dan bisa diretry', async () => {
	const fixture = await createPlatform({ visibilityChecksBeforeReady: 99 });
	try {
		await insertDokumenBatch(fixture.platform, pilotChunks);
		assert.equal(await reconcileIndexingKitabRows(fixture.platform, { ensureSchema: false }), 0);
		const rows = await fixture.db
			.prepare('SELECT status FROM kitab_referensi ORDER BY id')
			.all<{ status: string }>();
		assert.deepEqual((rows.results ?? []).map((row) => row.status), ['indexing', 'indexing']);
		assert.equal(
			(await findActiveKitabSlugs(fixture.db as never, ['terjemah-bidayatul-hidayah'])).size,
			0
		);
	} finally {
		await fixture.mf.dispose();
	}
});

test('retrieval membuang chunk belum indexed dan skor rendah tanpa mempercayai metadata teks', () => {
	const matches = [
		{ id: 'ready', score: 0.82, metadata: { text: 'Dalil yang relevan' } },
		{ id: 'pending', score: 0.95, metadata: { text: 'Belum selesai diindeks' } },
		{ id: 'weak', score: 0.2, metadata: { text: 'Terlalu lemah' } },
		{ id: 'without-metadata', score: 0.9, metadata: {} }
	];
	assert.deepEqual(
		filterRelevantMatches(matches, new Set(['ready', 'weak', 'without-metadata']), 0.35).map(
			(match) => match.id
		),
		['ready', 'without-metadata']
	);
});

test('cariJawaban hanya mengirim bukti indexed dan relevan ke model jawaban', async () => {
	const mf = new Miniflare({
		modules: true,
		script: 'export default { fetch() { return new Response("ok") } }',
		d1Databases: { DB: crypto.randomUUID() }
	});
	try {
		const db = await mf.getD1Database('DB');
		await ensureKitabReferenceSchema(db as never);
		await db.batch([
			db
				.prepare(
					"INSERT INTO kitab_referensi (id, judul, halaman, isi_teks, source_ref, status, embedding_model) VALUES (?, 'Bidayatul Hidayah', '10', 'Bukti sah', 'OpenITI baris 120-140', 'indexed', ?)"
				)
				.bind('ready', EMBEDDING_MODEL),
			db
				.prepare(
					"INSERT INTO kitab_referensi (id, judul, isi_teks, status, embedding_model) VALUES (?, 'Bidayatul Hidayah', 'Belum siap', 'indexing', ?)"
				)
				.bind('pending', EMBEDDING_MODEL),
			db
				.prepare(
					"INSERT INTO kitab_referensi (id, judul, isi_teks, status, embedding_model) VALUES (?, 'Bidayatul Hidayah', 'Skor lemah', 'indexed', ?)"
				)
				.bind('weak', EMBEDDING_MODEL)
		]);

		const aiCalls: Array<{ model: string; input: any }> = [];
		const queryCalls: any[] = [];
		const ai = {
			run: async (model: string, input: any) => {
				aiCalls.push({ model, input });
				if (model === EMBEDDING_MODEL) return { data: [[0.1, 0.2]] };
				return { response: 'Jawaban berbasis bukti sah.' };
			}
		};
		const index = {
			getByIds: async () => [],
			query: async (vector: number[], options: any) => {
				queryCalls.push({ vector, options });
				return {
					matches: [
						{
							id: 'ready',
							score: 0.82,
							metadata: { text: 'TEKS PALSU DARI VECTORIZE', halaman: 999 }
						},
						{
							id: 'pending',
							score: 0.95,
							metadata: { judul_kitab: 'Bidayatul Hidayah', halaman: 11, text: 'Belum siap' }
						},
						{
							id: 'weak',
							score: 0.2,
							metadata: { judul_kitab: 'Bidayatul Hidayah', halaman: 12, text: 'Skor lemah' }
						}
					]
				};
			}
		};

		const result = await cariJawaban({ env: { DB: db, AI: ai, VECTORIZE_INDEX: index } } as never, 'Apa adab seorang hamba?');
		assert.deepEqual(queryCalls[0]?.vector, [0.1, 0.2]);
		assert.equal(queryCalls[0]?.options?.topK, 8);
		assert.equal(result.referensi.length, 1);
		assert.equal(result.referensi[0]?.text, 'Bukti sah');
		const completionPrompt = aiCalls[1]?.input?.messages?.[1]?.content ?? '';
		const systemPrompt = aiCalls[1]?.input?.messages?.[0]?.content ?? '';
		assert.equal(aiCalls[1]?.input?.max_tokens, 400);
		assert.match(systemPrompt, /Jangan menulis baris sumber/);
		assert.match(completionPrompt, /Bukti sah/);
		assert.doesNotMatch(completionPrompt, /Belum siap|Skor lemah/);
		assert.match(result.jawaban, /Sumber: Bidayatul Hidayah, OpenITI baris 120-140\.$/);
	} finally {
		await mf.dispose();
	}
});
