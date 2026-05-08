import { json } from '@sveltejs/kit';
import type { Ai } from '@cloudflare/workers-types';
import { canManageCms } from '$lib/server/auth/cms-access';
import { getD1 } from '$lib/server/cloudflare';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';
import type { RequestHandler } from './$types';

const AI_MODEL = '@cf/meta/llama-3.1-8b-instruct';
const RATE_LIMIT_MAX = 12;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const generatedDraftSchema = {
	type: 'object',
	properties: {
		title: { type: 'string' },
		slug: { type: 'string' },
		excerpt: { type: 'string' },
		content: { type: 'string' },
		seo_keyword: { type: 'string' },
		meta_description: { type: 'string' },
		warnings: {
			type: 'array',
			items: { type: 'string' }
		}
	},
	required: ['title', 'slug', 'excerpt', 'content', 'seo_keyword', 'meta_description', 'warnings']
};

type GenerateBody = {
	mode?: unknown;
	topic?: unknown;
	keyword?: unknown;
	audience?: unknown;
	tone?: unknown;
	length?: unknown;
	contentType?: unknown;
	referenceNotes?: unknown;
	currentTitle?: unknown;
	currentSlug?: unknown;
	currentContent?: unknown;
	currentExcerpt?: unknown;
	currentMetaDescription?: unknown;
	currentSeoScore?: unknown;
	failedChecks?: unknown;
};

type GeneratedDraft = {
	title: string;
	slug: string;
	excerpt: string;
	content: string;
	seo_keyword: string;
	meta_description: string;
	warnings: string[];
};

const readString = (value: unknown, maxLength: number) =>
	typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const slugify = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '')
		.replace(/-{2,}/g, '-');

const stripDangerousHtml = (value: string) =>
	value
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
		.replace(/\son\w+="[^"]*"/gi, '')
		.replace(/\son\w+='[^']*'/gi, '')
		.replace(/\sjavascript:/gi, '');

const extractJson = (value: string) => {
	const cleaned = value
		.trim()
		.replace(/^```json\s*/i, '')
		.replace(/^```\s*/i, '')
		.replace(/```$/i, '')
		.trim();
	const start = cleaned.indexOf('{');
	const end = cleaned.lastIndexOf('}');
	if (start === -1 || end === -1 || end <= start) {
		throw new Error('Respons AI tidak berisi JSON yang valid.');
	}
	return JSON.parse(cleaned.slice(start, end + 1)) as Partial<GeneratedDraft>;
};

const parseAiDraft = (completion: unknown) => {
	const payload =
		typeof completion === 'object' && completion !== null
			? ((completion as any).response ?? (completion as any).result ?? completion)
			: completion;

	if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
		return payload as Partial<GeneratedDraft>;
	}

	if (typeof payload === 'string') {
		return extractJson(payload);
	}

	throw new Error('Respons AI tidak sesuai format draft artikel.');
};

const normalizeDraft = (draft: Partial<GeneratedDraft>, fallbackTopic: string): GeneratedDraft => {
	const title = readString(draft.title, 90) || fallbackTopic;
	const content = stripDangerousHtml(readString(draft.content, 24000));
	const plainContent = stripHtml(content);
	const excerpt = readString(draft.excerpt, 320) || plainContent.slice(0, 220);
	const metaDescription = readString(draft.meta_description, 180) || excerpt.slice(0, 160);
	const keyword = readString(draft.seo_keyword, 120);
	const warnings = Array.isArray(draft.warnings)
		? draft.warnings
				.map((item) => readString(item, 180))
				.filter(Boolean)
				.slice(0, 5)
		: [];

	return {
		title,
		slug: slugify(readString(draft.slug, 120) || title),
		excerpt,
		content,
		seo_keyword: keyword,
		meta_description: metaDescription,
		warnings
	};
};

const readFailedChecks = (value: unknown) =>
	Array.isArray(value)
		? value
				.map((item) => readString(item, 140))
				.filter(Boolean)
				.slice(0, 8)
		: [];

const buildGeneratePrompt = (body: GenerateBody) => {
	const topic = readString(body.topic, 180);
	const keyword = readString(body.keyword, 120);
	const audience = readString(body.audience, 120) || 'santri dan pembaca muslim umum';
	const tone = readString(body.tone, 120) || 'edukatif, santun, profesional';
	const length = readString(body.length, 40) || 'sedang';
	const contentType = readString(body.contentType, 80) || 'artikel edukasi';
	const referenceNotes = readString(body.referenceNotes, 1200);
	const currentTitle = readString(body.currentTitle, 180);
	const currentContent = readString(body.currentContent, 1800);

	return {
		topic: topic || currentTitle || keyword,
		prompt: `Buat draft artikel CMS Santri Online dalam Bahasa Indonesia.

Konteks:
- Jenis konten: ${contentType}
- Topik utama: ${topic || currentTitle || keyword}
- Focus keyword SEO: ${keyword || '-'}
- Target pembaca: ${audience}
- Gaya bahasa: ${tone}
- Panjang artikel: ${length}
- Catatan referensi dari editor: ${referenceNotes || '-'}
- Judul yang sudah ada: ${currentTitle || '-'}
- Ringkasan konten yang sudah ada: ${currentContent || '-'}

Aturan mutu:
- Tulis dengan nada edukatif, hati-hati, dan tidak provokatif.
- Jangan mengarang nomor hadis, kitab, halaman, asbabun nuzul, atau kutipan ulama.
- Jika butuh rujukan tetapi tidak tersedia di catatan editor, tulis secara umum dan tambahkan peringatan verifikasi.
- Untuk tema fikih/akidah/tafsir, hindari fatwa final yang tidak disertai rujukan.
- Konten harus siap masuk rich text editor sebagai HTML sederhana.
- Gunakan tag HTML: <h2>, <p>, <ul>, <ol>, <li>, <strong>. Jangan gunakan <script>, style inline, iframe, atau link palsu.
- Output wajib JSON valid saja, tanpa markdown, tanpa teks pembuka.

Skema JSON:
{
  "title": "40-60 karakter, jelas dan SEO-friendly",
  "slug": "slug-url",
  "excerpt": "ringkasan 1-2 kalimat",
  "content": "HTML artikel lengkap",
  "seo_keyword": "focus keyword",
  "meta_description": "maksimal 160 karakter",
  "warnings": ["hal yang perlu diverifikasi editor"]
}`
	};
};

const buildSeoPrompt = (body: GenerateBody) => {
	const keyword = readString(body.keyword, 120);
	const topic = readString(body.topic, 180);
	const currentTitle = readString(body.currentTitle, 180);
	const currentSlug = readString(body.currentSlug, 140);
	const currentContent = readString(body.currentContent, 24000);
	const currentExcerpt = readString(body.currentExcerpt, 600);
	const currentMetaDescription = readString(body.currentMetaDescription, 260);
	const currentSeoScore = Number(body.currentSeoScore);
	const failedChecks = readFailedChecks(body.failedChecks);
	const effectiveKeyword = keyword || topic || currentTitle;

	return {
		topic: currentTitle || topic || effectiveKeyword,
		prompt: `Optimalkan draft artikel CMS Santri Online agar skor SEO internal menjadi 100/100.

Skor saat ini: ${Number.isFinite(currentSeoScore) ? currentSeoScore : '-'}
Checklist yang belum lolos:
${failedChecks.length ? failedChecks.map((item) => `- ${item}`).join('\n') : '- Tidak dikirim, tetap optimalkan semua aturan.'}

Target wajib:
- Judul harus 40-60 karakter.
- Focus keyword harus ada persis di judul.
- Focus keyword harus muncul natural pada 300 karakter pertama konten.
- Konten minimal 300 kata setelah tag HTML dibersihkan.
- Meta description maksimal 160 karakter dan mengandung focus keyword jika natural.
- Slug bersih, pendek, dan sesuai judul.
- Pertahankan maksud artikel, jangan mengarang dalil, nomor hadis, halaman kitab, atau kutipan ulama.
- Konten harus tetap HTML sederhana untuk rich text editor.
- Gunakan tag HTML: <h2>, <p>, <ul>, <ol>, <li>, <strong>. Jangan gunakan <script>, style inline, iframe, atau link palsu.
- Output wajib JSON valid saja, tanpa markdown, tanpa teks pembuka.

Data artikel saat ini:
- Focus keyword: ${effectiveKeyword || '-'}
- Judul: ${currentTitle || '-'}
- Slug: ${currentSlug || '-'}
- Excerpt: ${currentExcerpt || '-'}
- Meta description: ${currentMetaDescription || '-'}
- Konten HTML:
${currentContent || '-'}

Skema JSON:
{
  "title": "40-60 karakter dan mengandung focus keyword",
  "slug": "slug-url",
  "excerpt": "ringkasan 1-2 kalimat",
  "content": "HTML artikel hasil optimasi",
  "seo_keyword": "focus keyword final",
  "meta_description": "maksimal 160 karakter",
  "warnings": ["hal yang perlu diverifikasi editor"]
}`
	};
};

const buildPrompt = (body: GenerateBody) => {
	const mode = readString(body.mode, 40);
	return mode === 'optimize_seo' ? buildSeoPrompt(body) : buildGeneratePrompt(body);
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	if (!canManageCms(locals.user)) {
		return json({ ok: false, error: 'Tidak diizinkan.' }, { status: 403 });
	}

	const ai = (platform?.env?.AI ?? null) as Ai | null;
	if (!ai) {
		return json(
			{
				ok: false,
				error:
					'Cloudflare Workers AI belum tersedia. Jalankan dengan Wrangler/Pages binding dan pastikan binding AI aktif.'
			},
			{ status: 500 }
		);
	}

	const db = getD1({ locals, platform });
	if (db) {
		try {
			const rateLimit = await consumeApiRateLimit({
				db,
				scope: 'admin:posts:ai-generate',
				key: `user:${locals.user.id}`,
				limit: RATE_LIMIT_MAX,
				windowMs: RATE_LIMIT_WINDOW_MS
			});

			if (!rateLimit.allowed) {
				return json(
					{
						ok: false,
						error: 'Terlalu banyak generate AI. Coba lagi sebentar lagi.',
						limit: rateLimit.limit,
						resetAt: rateLimit.resetAt
					},
					{ status: 429, headers: buildRateLimitHeaders(rateLimit) }
				);
			}
		} catch (err) {
			console.warn('AI post generation rate limit check failed:', err);
		}
	}

	const body = (await request.json().catch(() => ({}))) as GenerateBody;
	const { topic, prompt } = buildPrompt(body);

	if (!topic) {
		return json({ ok: false, error: 'Topik atau keyword artikel wajib diisi.' }, { status: 400 });
	}

	try {
		const completion = await ai.run(AI_MODEL as any, {
			messages: [
				{
					role: 'system',
					content:
						'Anda adalah editor senior media Islam. Jawab hanya dengan JSON valid sesuai skema yang diminta.'
				},
				{ role: 'user', content: prompt }
			],
			temperature: 0.45,
			max_tokens: 2600,
			response_format: {
				type: 'json_schema',
				json_schema: generatedDraftSchema
			}
		} as any);

		const parsed = parseAiDraft(completion);
		const draft = normalizeDraft(parsed, topic);

		return json({ ok: true, draft, model: AI_MODEL });
	} catch (err: any) {
		console.error('AI post generation failed:', err);
		return json(
			{
				ok: false,
				error: 'Gagal menghasilkan konten AI. Coba lagi atau perjelas topik.',
				detail: String(err?.message ?? err ?? '')
			},
			{ status: 500 }
		);
	}
};
