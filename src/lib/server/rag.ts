import type { Ai, VectorizeIndex } from '@cloudflare/workers-types';

export type KitabMetadata = {
	judul_kitab: string;
	halaman: string | number;
	jilid?: string | number;
	text: string;
};

type RetrievedMatch = {
	text: string;
	metadata: KitabMetadata;
	score?: number;
};

const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';
const CHAT_MODEL = '@cf/meta/llama-3-8b-instruct';

const assertBindings = (platform: App.Platform) => {
	if (!platform?.env?.AI || !platform?.env?.VECTORIZE_INDEX) {
		throw new Error('Binding AI atau VECTORIZE_INDEX tidak tersedia');
	}
	return {
		ai: platform.env.AI as Ai,
		index: platform.env.VECTORIZE_INDEX as VectorizeIndex
	};
};

const randomId = () =>
	typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

export const generateEmbedding = async (ai: Ai, text: string) => {
	const trimmed = text.trim();
	if (!trimmed) throw new Error('Teks kosong');

	const res = await ai.run(EMBEDDING_MODEL, { text: trimmed } as any);
	const vector = Array.isArray((res as any)?.data?.[0])
		? (res as any).data[0]
		: Array.isArray((res as any)?.data)
			? (res as any).data
			: null;

	if (!vector || !Array.isArray(vector)) {
		throw new Error('Gagal membuat embedding');
	}
	return vector as number[];
};

export const insertDokumen = async (
	platform: App.Platform,
	text: string,
	metadata: Omit<KitabMetadata, 'text'>
) => {
	const { ai, index } = assertBindings(platform);
	const db = platform.env.DB;
	if (!db) throw new Error('Binding DB tidak tersedia');

	const id = randomId();
	const enriched: KitabMetadata = { ...metadata, text };

	try {
		await db
			.prepare(
				`INSERT INTO kitab_referensi (id, judul, halaman, jilid, isi_teks, created_at)
                 VALUES (?, ?, ?, ?, ?, datetime('now'))`
			)
			.bind(id, enriched.judul_kitab, String(enriched.halaman ?? ''), enriched.jilid ?? null, text)
			.run();
	} catch (err) {
		console.error('Gagal simpan D1 kitab_referensi', err);
		throw new Error('Gagal menyimpan ke database');
	}

	const embedding = await generateEmbedding(ai, text);

	await index.upsert([
		{
			id,
			values: embedding,
			metadata: enriched
		}
	]);

	return enriched;
};

export const cariJawaban = async (platform: App.Platform, pertanyaan: string) => {
	const { ai, index } = assertBindings(platform);
	const queryVector = await generateEmbedding(ai, pertanyaan);

	const queryRes = await index.query({
		topK: 3,
		vector: queryVector,
		returnValues: false,
		returnMetadata: true
	} as any);

	const matches: RetrievedMatch[] =
		(queryRes.matches ?? []).map((m: any) => ({
			text: m?.metadata?.text ?? '',
			metadata: {
				judul_kitab: m?.metadata?.judul_kitab ?? 'Tidak diketahui',
				halaman: m?.metadata?.halaman ?? '-',
				jilid: m?.metadata?.jilid,
				text: m?.metadata?.text ?? ''
			},
			score: m?.score
		})) ?? [];

	if (!matches.length) {
		return {
			jawaban: 'Maaf, belum ada data kitab yang relevan untuk menjawab pertanyaan ini.',
			referensi: [] as KitabMetadata[]
		};
	}

	const context = matches
		.map(
			(m, idx) =>
				`[${idx + 1}] (${m.metadata.judul_kitab}${m.metadata.jilid ? ` jilid ${m.metadata.jilid}` : ''}, hal ${
					m.metadata.halaman
				})\n${m.text}`
		)
		.join('\n\n');

	const systemPrompt =
		'Anda adalah asisten pesantren yang sopan. Jawab dalam Bahasa Indonesia, ringkas dan jelas. ' +
		'WAJIB sertakan referensi (nama kitab & halaman/jilid) berdasarkan konteks yang diberikan. ' +
		'Jika konteks tidak cukup, katakan belum ditemukan dan minta pengguna memperjelas.';

	const userPrompt = `Pertanyaan: ${pertanyaan}\n\nKonteks:\n${context}`;

	const completion = await ai.run(CHAT_MODEL, {
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userPrompt }
		]
	} as any);

	const jawaban = (completion as any)?.response ?? (completion as any)?.result ?? '';
	return {
		jawaban,
		referensi: matches.map((m) => m.metadata)
	};
};
