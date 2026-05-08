import { json } from '@sveltejs/kit';
import { canManageCms } from '$lib/server/auth/cms-access';
import { getD1 } from '$lib/server/cloudflare';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';
import type { RequestHandler } from './$types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_ARTICLE_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

type GenerateArtikelBody = {
	topik?: unknown;
	jenis?: unknown;
	panjang?: unknown;
	target?: unknown;
	gaya?: unknown;
	catatan?: unknown;
	post_id?: unknown;
};

type GeneratedArticle = {
	judul: string;
	ringkasan: string;
	meta_description: string;
	focus_keyword: string;
	isi: string;
	image_prompt: string;
};

const readString = (value: unknown, maxLength: number) =>
	typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const stripDangerousHtml = (value: string) =>
	value
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
		.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
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
		throw new Error('Respons Groq tidak berisi JSON valid.');
	}
	return JSON.parse(cleaned.slice(start, end + 1)) as Partial<GeneratedArticle>;
};

const normalizeWordTarget = (panjang: string) => {
	const normalized = panjang.toLowerCase();
	if (normalized.includes('pendek') || normalized.includes('ringkas')) return 300;
	if (normalized.includes('sedang')) return 600;
	return 1000;
};

const normalizeStorageId = (value: unknown) =>
	readString(value, 80).replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-') || null;

const normalizeArticle = (draft: Partial<GeneratedArticle>, fallbackTopic: string): GeneratedArticle => {
	const judul = readString(draft.judul, 90) || fallbackTopic;
	const isi = stripDangerousHtml(readString(draft.isi, 32000));
	const plain = stripHtml(isi);
	const ringkasan = readString(draft.ringkasan, 320) || plain.slice(0, 220);
	const metaDescription = readString(draft.meta_description, 180) || ringkasan.slice(0, 160);
	const focusKeyword = readString(draft.focus_keyword, 120) || fallbackTopic.slice(0, 80);
	const imagePrompt =
		readString(draft.image_prompt, 260) ||
		`Islamic educational blog thumbnail about ${fallbackTopic}, mosque architecture, geometric pattern, warm light, no people, no text`;

	return {
		judul,
		ringkasan,
		meta_description: metaDescription,
		focus_keyword: focusKeyword,
		isi,
		image_prompt: imagePrompt
	};
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	if (!canManageCms(locals.user)) {
		return json({ success: false, error: 'Tidak diizinkan.' }, { status: 403 });
	}

	const groqApiKey = platform?.env?.GROQ_API_KEY;
	if (!groqApiKey) {
		return json(
			{
				success: false,
				error: 'GROQ_API_KEY belum tersedia. Set sebagai Cloudflare secret, bukan di wrangler.toml.'
			},
			{ status: 500 }
		);
	}

	const db = getD1({ locals, platform });
	if (db) {
		try {
			const rateLimit = await consumeApiRateLimit({
				db,
				scope: 'admin:generate-artikel',
				key: `user:${locals.user.id}`,
				limit: RATE_LIMIT_MAX,
				windowMs: RATE_LIMIT_WINDOW_MS
			});

			if (!rateLimit.allowed) {
				return json(
					{
						success: false,
						error: 'Terlalu banyak generate artikel. Coba lagi sebentar lagi.',
						limit: rateLimit.limit,
						resetAt: rateLimit.resetAt
					},
					{ status: 429, headers: buildRateLimitHeaders(rateLimit) }
				);
			}
		} catch (err) {
			console.warn('Groq article rate limit check failed:', err);
		}
	}

	const body = (await request.json().catch(() => ({}))) as GenerateArtikelBody;
	const topik = readString(body.topik, 180);
	const jenis = readString(body.jenis, 80) || 'Artikel edukasi';
	const panjang = readString(body.panjang, 40) || 'Sedang';
	const target = readString(body.target, 140) || 'santri dan pembaca muslim umum';
	const gaya = readString(body.gaya, 140) || 'edukatif, santun, profesional';
	const catatan = readString(body.catatan, 1400);
	const postId = normalizeStorageId(body.post_id);

	if (!topik) {
		return json({ success: false, error: 'Topik artikel wajib diisi.' }, { status: 400 });
	}

	const wordTarget = normalizeWordTarget(panjang);
	const systemPrompt = `Kamu adalah penulis konten Islam Ahlus Sunnah wal Jamaah (Aswaja) yang ahli menulis artikel dakwah berkualitas tinggi untuk platform SantriOnline.

Aturan penulisan:
- Sesuai aqidah Aswaja, 4 mazhab (Hanafi, Maliki, Syafi'i, Hambali), dan tasawuf
- Tidak memuat pandangan Wahabi atau Syiah
- Referensi ulama: Imam Ghazali, Buya Hamka, Imam Nawawi, dan ulama Aswaja terpercaya
- Bahasa Indonesia yang ${gaya}
- Target pembaca: ${target}
- Sertakan dalil Al-Quran atau Hadits jika relevan, dengan teks Arab dan terjemahan
- Jangan mengarang nomor hadis, halaman kitab, atau kutipan ulama spesifik jika tidak ada rujukan
- Akhiri dengan kesimpulan dan ajakan amal

Format output wajib JSON valid saja, tanpa markdown dan tanpa teks di luar JSON. Isi artikel harus HTML sederhana memakai tag <h2>, <p>, <strong>, <blockquote>, <ul>, <ol>, dan <li>. Jangan gunakan script, style inline, iframe, atau link palsu.

Skema JSON:
{
  "judul": "judul artikel 40-60 karakter mengandung keyword",
  "ringkasan": "ringkasan 1-2 kalimat untuk preview",
  "meta_description": "deskripsi SEO 140-160 karakter",
  "focus_keyword": "kata kunci utama 2-4 kata",
  "isi": "isi artikel HTML lengkap",
  "image_prompt": "prompt bahasa Inggris untuk generate gambar thumbnail, Islamic style, no human faces, max 50 kata"
}`;

	const userPrompt = `Tulis ${jenis} tentang: "${topik}"
Panjang: sekitar ${wordTarget} kata
${catatan ? `Catatan rujukan: ${catatan}` : ''}`;

	try {
		const response = await fetch(GROQ_API_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${groqApiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: GROQ_ARTICLE_MODEL,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				temperature: 0.65,
				max_tokens: 4200,
				response_format: { type: 'json_object' }
			})
		});

		const data = (await response.json().catch(() => ({}))) as {
			choices?: Array<{ message?: { content?: string } }>;
			error?: { message?: string };
			usage?: { total_tokens?: number };
		};

		if (!response.ok) {
			return json(
				{
					success: false,
					error: 'Groq API menolak permintaan generate artikel.',
					detail: data.error?.message || response.statusText
				},
				{ status: response.status }
			);
		}

		const content = data.choices?.[0]?.message?.content;
		if (!content) {
			return json({ success: false, error: 'Respons Groq kosong.' }, { status: 500 });
		}

		const parsed = extractJson(content);
		const article = normalizeArticle(parsed, topik);
		if (db) {
			try {
				await db
					.prepare(
						`INSERT INTO ai_generations (post_id, user_id, topik, model_used, tokens_used)
						 VALUES (?, ?, ?, ?, ?)`
					)
					.bind(postId, locals.user.id, topik, GROQ_ARTICLE_MODEL, Number(data.usage?.total_tokens ?? 0) || 0)
					.run();
			} catch (err) {
				console.warn('AI generation history insert failed:', err);
			}
		}

		return json({ success: true, data: article, model: GROQ_ARTICLE_MODEL });
	} catch (err: any) {
		console.error('Groq article generation failed:', err);
		return json(
			{
				success: false,
				error: 'Gagal menghubungi Groq API.',
				detail: String(err?.message ?? err ?? '')
			},
			{ status: 500 }
		);
	}
};
