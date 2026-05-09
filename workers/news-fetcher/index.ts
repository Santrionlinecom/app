import type { Ai, D1Database, R2Bucket } from '@cloudflare/workers-types';

export interface Env {
	DB: D1Database;
	R2: R2Bucket;
	AI: Ai;
	GROQ_API_KEY: string;
	GROQ_MODEL?: string;
	NEWS_FETCH_SECRET: string;
	R2_PUBLIC_BASE_URL?: string;
}

type NewsLanguage = 'en' | 'id';
type NewsPriority = 'high' | 'medium';

type NewsSource = {
	url: string;
	name: string;
	language: NewsLanguage;
	category: ProcessedNews['kategori'];
	priority: NewsPriority;
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const IMAGE_MODEL = '@cf/bytedance/stable-diffusion-xl-lightning';
const MAX_ITEMS_PER_SOURCE = 5;
const REQUEST_DELAY_MS = 2000;
const R2_PUBLIC_BASE_URL = 'https://files.santrionline.com';

const RSS_SOURCES: NewsSource[] = [
	{
		url: 'https://www.aljazeera.com/xml/rss/all.xml',
		name: 'Al Jazeera English',
		language: 'en',
		category: 'internasional',
		priority: 'high'
	},
	{
		url: 'https://www.middleeasteye.net/rss',
		name: 'Middle East Eye',
		language: 'en',
		category: 'internasional',
		priority: 'high'
	},
	{
		url: 'https://www.islam21c.com/feed/',
		name: 'Islam21c',
		language: 'en',
		category: 'dakwah',
		priority: 'medium'
	},
	{
		url: 'https://muslimmatters.org/feed/',
		name: 'Muslim Matters',
		language: 'en',
		category: 'dakwah',
		priority: 'medium'
	},
	{
		url: 'https://seekersguidance.org/feed/',
		name: 'SeekersGuidance',
		language: 'en',
		category: 'dakwah',
		priority: 'medium'
	},
	{
		url: 'https://www.nu.or.id/rss/feed.rss',
		name: 'NU Online',
		language: 'id',
		category: 'nasional',
		priority: 'high'
	},
	{
		url: 'https://www.republika.co.id/rss/khazanah/islam',
		name: 'Republika Islam',
		language: 'id',
		category: 'nasional',
		priority: 'high'
	},
	{
		url: 'https://www.hidayatullah.com/feed',
		name: 'Hidayatullah',
		language: 'id',
		category: 'nasional',
		priority: 'medium'
	},
	{
		url: 'https://www.suara-islam.com/feed',
		name: 'Suara Islam',
		language: 'id',
		category: 'nasional',
		priority: 'medium'
	},
	{
		url: 'https://www.islampos.com/feed/',
		name: 'Islampos',
		language: 'id',
		category: 'nasional',
		priority: 'medium'
	},
	{
		url: 'https://www.arabnews.com/rss.xml',
		name: 'Arab News',
		language: 'en',
		category: 'internasional',
		priority: 'medium'
	},
	{
		url: 'https://blog.muslimpro.com/feed/',
		name: 'Muslim Pro Blog',
		language: 'en',
		category: 'dakwah',
		priority: 'medium'
	}
];

const ISLAMIC_KEYWORDS = [
	'islam',
	'muslim',
	'mosque',
	'masjid',
	'quran',
	'koran',
	'hadith',
	'hadis',
	'prophet',
	'nabi',
	'rasul',
	'allah',
	'prayer',
	'salat',
	'shalat',
	'salah',
	'fiqh',
	'palestina',
	'palestine',
	'gaza',
	'al-aqsa',
	'aqsa',
	'ramadan',
	'ramadhan',
	'hajj',
	'haji',
	'umrah',
	'halal',
	'zakat',
	'ulama',
	'pesantren',
	'dakwah',
	'islamic',
	'arab',
	'saudi',
	'iran',
	'turkey',
	'erdogan',
	'ummah',
	'umat',
	'syariah',
	'sharia',
	'fatwa',
	'mufti',
	'imam'
];

const BLOCKED_KEYWORDS = [
	'terrorist',
	'extremist',
	'isis',
	'radical',
	'gambling',
	'alcohol',
	'porn',
	'nude'
];

const ALLOWED_CATEGORIES = new Set<ProcessedNews['kategori']>([
	'internasional',
	'nasional',
	'dakwah',
	'palestina',
	'teknologi'
]);

export default {
	async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(runNewsFetcher(env));
	},

	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === '/trigger' && request.method === 'POST') {
			const auth = request.headers.get('X-Secret');
			if (!env.NEWS_FETCH_SECRET || auth !== env.NEWS_FETCH_SECRET) {
				return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
			}
			if (!env.GROQ_API_KEY) {
				return jsonResponse({ success: false, error: 'GROQ_API_KEY belum dikonfigurasi.' }, 500);
			}

			ctx.waitUntil(runNewsFetcher(env));
			return jsonResponse({
				success: true,
				message: 'Pengambilan berita dimulai. Tunggu 2-3 menit.'
			});
		}

		return jsonResponse({
			success: true,
			service: 'SantriOnline News Fetcher',
			schedule: ['06:00 WIB', '12:00 WIB', '18:00 WIB']
		});
	}
};

async function runNewsFetcher(env: Env) {
	if (!env.GROQ_API_KEY) {
		console.error('[news-fetcher] GROQ_API_KEY belum dikonfigurasi.');
		return;
	}

	console.log('[news-fetcher] Mulai mengambil berita RSS.');
	await ensureAutoNewsColumns(env.DB);

	let totalSaved = 0;
	let totalSkipped = 0;
	let totalErrors = 0;

	for (const source of RSS_SOURCES) {
		try {
			const items = await fetchRSS(source.url);
			console.log(`[news-fetcher] ${source.name}: ${items.length} item ditemukan.`);

			for (const item of items.slice(0, MAX_ITEMS_PER_SOURCE)) {
				if (!isRelevant(item)) {
					totalSkipped++;
					continue;
				}

				const existing = await env.DB.prepare(
					'SELECT id FROM cms_posts WHERE source_url = ? LIMIT 1'
				)
					.bind(item.link)
					.first<{ id: string }>();

				if (existing) {
					totalSkipped++;
					continue;
				}

				const processed = await processWithGroq(item, source, env);
				if (!processed) {
					totalErrors++;
					continue;
				}

				const thumbnailUrl = await generateThumbnail(processed, env);
				await saveToDatabase(processed, thumbnailUrl, source, item.link, env);
				totalSaved++;

				await sleep(REQUEST_DELAY_MS);
			}
		} catch (err) {
			totalErrors++;
			console.error(`[news-fetcher] Error saat memproses ${source.name}:`, err);
		}
	}

	console.log(
		`[news-fetcher] Selesai: ${totalSaved} disimpan, ${totalSkipped} dilewati, ${totalErrors} error.`
	);
}

async function ensureAutoNewsColumns(db: D1Database) {
	const alterStatements = [
		'ALTER TABLE cms_posts ADD COLUMN source_name TEXT',
		'ALTER TABLE cms_posts ADD COLUMN source_url TEXT',
		'ALTER TABLE cms_posts ADD COLUMN is_auto_generated INTEGER DEFAULT 0',
		"ALTER TABLE cms_posts ADD COLUMN kategori TEXT DEFAULT 'umum'",
		"ALTER TABLE cms_posts ADD COLUMN tags TEXT DEFAULT '[]'"
	];

	for (const statement of alterStatements) {
		try {
			await db.prepare(statement).run();
		} catch {
			// Column already exists on migrated databases.
		}
	}

	await db.prepare('CREATE INDEX IF NOT EXISTS idx_cms_posts_auto ON cms_posts(is_auto_generated)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_cms_posts_kategori ON cms_posts(kategori)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_cms_posts_source ON cms_posts(source_url)').run();
	await db
		.prepare(
			'CREATE UNIQUE INDEX IF NOT EXISTS idx_cms_posts_source_unique ON cms_posts(source_url) WHERE source_url IS NOT NULL'
		)
		.run();
}

async function fetchRSS(url: string): Promise<RSSItem[]> {
	const response = await fetch(url, {
		headers: {
			'User-Agent': 'SantriOnline NewsBot/1.0 (+https://santrionline.com)',
			Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml'
		},
		cf: { cacheTtl: 300 }
	} as RequestInit & { cf: { cacheTtl: number } });

	if (!response.ok) {
		throw new Error(`RSS fetch failed with HTTP ${response.status}`);
	}

	const xml = await response.text();
	return parseRSS(xml);
}

function parseRSS(xml: string): RSSItem[] {
	const rssItems = parseNodes(xml, 'item');
	const atomItems = parseNodes(xml, 'entry');
	return [...rssItems, ...atomItems].filter((item) => item.title && item.link);
}

function parseNodes(xml: string, nodeName: 'item' | 'entry'): RSSItem[] {
	const items: RSSItem[] = [];
	const itemRegex = new RegExp(`<${nodeName}\\b[^>]*>([\\s\\S]*?)</${nodeName}>`, 'gi');
	let match: RegExpExecArray | null;

	while ((match = itemRegex.exec(xml)) !== null) {
		const rawItem = match[1];
		const link = extractLink(rawItem);
		items.push({
			title: cleanXmlText(extractTag(rawItem, 'title')),
			description: cleanXmlText(
				extractTag(rawItem, 'description') ||
					extractTag(rawItem, 'summary') ||
					extractTag(rawItem, 'content:encoded') ||
					extractTag(rawItem, 'content')
			),
			link,
			pubDate: cleanXmlText(extractTag(rawItem, 'pubDate') || extractTag(rawItem, 'updated')),
			category: cleanXmlText(extractTag(rawItem, 'category'))
		});
	}

	return items;
}

function extractTag(xml: string, tag: string): string {
	const escapedTag = escapeRegExp(tag);
	const regex = new RegExp(
		`<${escapedTag}\\b[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${escapedTag}>|<${escapedTag}\\b[^>]*>([\\s\\S]*?)</${escapedTag}>`,
		'i'
	);
	const match = xml.match(regex);
	return (match?.[1] || match?.[2] || '').trim();
}

function extractLink(xml: string): string {
	const atomHref = xml.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1];
	const rssLink = extractTag(xml, 'link');
	return cleanXmlText(atomHref || rssLink || extractTag(xml, 'guid'));
}

function cleanXmlText(value: string): string {
	return decodeEntities(value)
		.replace(/<br\s*\/?>/gi, ' ')
		.replace(/<\/p>/gi, ' ')
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function decodeEntities(value: string): string {
	return value
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
		.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
}

function isRelevant(item: RSSItem): boolean {
	const text = `${item.title} ${item.description} ${item.category}`.toLowerCase();

	const hasBlocked = BLOCKED_KEYWORDS.some((keyword) =>
		new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i').test(text)
	);
	if (hasBlocked) return false;

	return ISLAMIC_KEYWORDS.some((keyword) => text.includes(keyword));
}

async function processWithGroq(
	item: RSSItem,
	source: NewsSource,
	env: Env
): Promise<ProcessedNews | null> {
	const isEnglish = source.language === 'en';
	const sourceText = stripDangerousText(`${item.title}\n\n${item.description}`).slice(0, 5000);

	const systemPrompt = `Kamu adalah jurnalis Islam Ahlus Sunnah wal Jamaah (Aswaja) untuk SantriOnline News.
Tulis ulang berita dengan bahasa Indonesia yang lugas, informatif, edukatif, tidak sensasional, dan tidak menyerang kelompok lain.
Jangan mengarang fakta baru di luar judul/deskripsi sumber. Jika informasi sumber terbatas, tulis ringkas dan nyatakan konteks secara hati-hati.
Tambahkan perspektif Islam Aswaja di akhir secara proporsional.

Balas hanya JSON valid tanpa markdown:
{
  "judul": "judul berita menarik dalam bahasa Indonesia, 50-70 karakter",
  "ringkasan": "ringkasan 2 kalimat bahasa Indonesia",
  "isi": "isi berita 300-500 kata dalam HTML sederhana dengan tag <p> dan <h3>",
  "meta_description": "deskripsi SEO 140-160 karakter",
  "focus_keyword": "kata kunci utama 2-4 kata",
  "image_prompt": "prompt bahasa Inggris untuk generate gambar, Islamic editorial style, no faces, max 30 kata",
  "kategori": "internasional|nasional|dakwah|palestina|teknologi",
  "tags": ["tag1", "tag2", "tag3"]
}`;

	const userPrompt = isEnglish
		? `Terjemahkan dan tulis ulang berita ini ke Bahasa Indonesia.\n\nSumber: ${source.name}\nKategori default: ${source.category}\n\n${sourceText}`
		: `Tulis ulang berita ini dengan perspektif Islam Aswaja.\n\nSumber: ${source.name}\nKategori default: ${source.category}\n\n${sourceText}`;

	try {
		const response = await fetch(GROQ_API_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.GROQ_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				temperature: 0.6,
				max_tokens: 1800,
				response_format: { type: 'json_object' }
			})
		});

		const data = (await response.json().catch(() => ({}))) as GroqResponse;
		if (!response.ok) {
			console.error('[news-fetcher] Groq API error:', response.status, data.error?.message || 'unknown');
			return null;
		}

		const content = data.choices?.[0]?.message?.content;
		if (!content) return null;

		const parsed = extractJson(content) as Partial<ProcessedNews>;
		return normalizeProcessedNews(parsed, item, source);
	} catch (err) {
		console.error('[news-fetcher] Groq processing failed:', err);
		return null;
	}
}

function extractJson(value: string) {
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
	return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizeProcessedNews(
	draft: Partial<ProcessedNews>,
	item: RSSItem,
	source: NewsSource
): ProcessedNews {
	const title = readString(draft.judul, 90) || readString(item.title, 90) || 'Berita Islam Terkini';
	const content = stripDangerousHtml(readString(draft.isi, 24000));
	const plainContent = cleanXmlText(content);
	const summary = readString(draft.ringkasan, 340) || readString(item.description, 240);
	const category = inferCategory(readString(draft.kategori, 40), title, summary, source.category);
	const tags = Array.isArray(draft.tags)
		? draft.tags.map((tag) => readString(tag, 40)).filter(Boolean).slice(0, 6)
		: [category, source.name].filter(Boolean);

	return {
		judul: title,
		ringkasan: summary || plainContent.slice(0, 220),
		isi: content || `<p>${escapeHtml(summary || item.description || item.title)}</p>`,
		meta_description:
			readString(draft.meta_description, 180) || (summary || plainContent || title).slice(0, 160),
		focus_keyword: readString(draft.focus_keyword, 120) || title.split(/\s+/).slice(0, 4).join(' '),
		image_prompt:
			readString(draft.image_prompt, 220) ||
			`Islamic editorial illustration about ${title}, mosque geometry, warm light, no faces, no text`,
		kategori: category,
		tags
	};
}

function inferCategory(
	value: string,
	title: string,
	summary: string,
	fallback: ProcessedNews['kategori']
): ProcessedNews['kategori'] {
	const normalized = value.toLowerCase() as ProcessedNews['kategori'];
	if (ALLOWED_CATEGORIES.has(normalized)) return normalized;

	const text = `${title} ${summary}`.toLowerCase();
	if (text.includes('palestina') || text.includes('palestine') || text.includes('gaza') || text.includes('aqsa')) {
		return 'palestina';
	}
	return fallback;
}

async function generateThumbnail(news: ProcessedNews, env: Env): Promise<string> {
	try {
		const prompt = `${news.image_prompt}, Islamic news illustration, arabesque pattern, professional editorial style, warm tones, no human faces, no text`;
		const result = await env.AI.run(IMAGE_MODEL as any, {
			prompt,
			negative_prompt: 'human face, person, portrait, text, watermark, logo, low quality',
			width: 1024,
			height: 576,
			num_steps: 4
		} as any);

		const buffer = await aiResultToArrayBuffer(result);
		const filename = `news/auto-${Date.now()}-${slugify(news.judul).slice(0, 32) || 'berita'}.png`;

		await env.R2.put(filename, buffer, {
			httpMetadata: {
				contentType: 'image/png',
				cacheControl: 'public, max-age=31536000'
			}
		});

		return buildR2PublicUrl(filename, env);
	} catch (err) {
		console.error('[news-fetcher] Thumbnail generation failed:', err);
		return buildR2PublicUrl(`news/default-${news.kategori}.png`, env);
	}
}

async function aiResultToArrayBuffer(result: unknown): Promise<ArrayBuffer> {
	if (result instanceof ArrayBuffer) return result;
	if (result instanceof Response) return result.arrayBuffer();
	if (result instanceof ReadableStream) return new Response(result).arrayBuffer();

	if (typeof result === 'object' && result) {
		const maybeImage = (result as { image?: unknown }).image;
		if (maybeImage instanceof ArrayBuffer) return maybeImage;
		if (typeof maybeImage === 'string') {
			const binary = atob(maybeImage.replace(/^data:image\/\w+;base64,/, ''));
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
			return bytes.buffer;
		}
	}

	return new Response(result as BodyInit).arrayBuffer();
}

async function saveToDatabase(
	news: ProcessedNews,
	thumbnailUrl: string,
	source: NewsSource,
	sourceUrl: string,
	env: Env
) {
	const now = Date.now();
	const id = crypto.randomUUID();
	const slug = `${slugify(news.judul) || 'berita-islam'}-${now.toString(36)}`;

	await env.DB.prepare(
		`INSERT INTO cms_posts (
			id, title, slug, content, excerpt, status,
			thumbnail_url, seo_keyword, meta_description,
			source_name, source_url, is_auto_generated, kategori, tags,
			scheduled_at, created_at, updated_at
		) VALUES (
			?, ?, ?, ?, ?, 'published',
			?, ?, ?,
			?, ?, 1, ?, ?,
			NULL, ?, ?
		)`
	)
		.bind(
			id,
			news.judul,
			slug,
			news.isi,
			news.ringkasan,
			thumbnailUrl,
			news.focus_keyword,
			news.meta_description,
			source.name,
			sourceUrl,
			news.kategori,
			JSON.stringify(news.tags),
			now,
			now
		)
		.run();
}

function buildR2PublicUrl(key: string, env: Env) {
	const base = (env.R2_PUBLIC_BASE_URL || R2_PUBLIC_BASE_URL).replace(/\/+$/, '');
	const encodedKey = key
		.split('/')
		.filter(Boolean)
		.map((segment) => encodeURIComponent(segment))
		.join('/');
	return `${base}/${encodedKey}`;
}

function jsonResponse(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' }
	});
}

function slugify(text: string): string {
	return text
		.normalize('NFKD')
		.toLowerCase()
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '')
		.substring(0, 60);
}

function readString(value: unknown, maxLength: number): string {
	return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function stripDangerousText(value: string) {
	return cleanXmlText(value).replace(/[\u0000-\u001f\u007f]/g, ' ');
}

function stripDangerousHtml(value: string) {
	return value
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
		.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
		.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
		.replace(/\son\w+="[^"]*"/gi, '')
		.replace(/\son\w+='[^']*'/gi, '')
		.replace(/\sjavascript:/gi, '');
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RSSItem {
	title: string;
	description: string;
	link: string;
	pubDate: string;
	category: string;
}

interface ProcessedNews {
	judul: string;
	ringkasan: string;
	isi: string;
	meta_description: string;
	focus_keyword: string;
	image_prompt: string;
	kategori: 'internasional' | 'nasional' | 'dakwah' | 'palestina' | 'teknologi';
	tags: string[];
}

type GroqResponse = {
	choices?: Array<{ message?: { content?: string } }>;
	error?: { message?: string };
};
