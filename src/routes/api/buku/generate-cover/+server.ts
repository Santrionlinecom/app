import { json } from '@sveltejs/kit';
import type { Ai } from '@cloudflare/workers-types';
import {
	BUKU_COVER_NEGATIVE_PROMPT,
	buildBukuCoverPrompt,
	detectBukuCoverImageFormat,
	normalizeBukuCoverBrief
} from '$lib/server/domains/buku/ai-cover';
import { buildR2PublicUrl, getD1, requireR2Bucket } from '$lib/server/cloudflare';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';
import type { RequestHandler } from './$types';

const IMAGE_MODEL = '@cf/bytedance/stable-diffusion-xl-lightning';
const RATE_LIMIT_MAX = 4;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const DAILY_RATE_LIMIT_MAX = 12;
const DAILY_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

type GenerateCoverBody = {
	title?: unknown;
	category?: unknown;
	description?: unknown;
	book_id?: unknown;
};

const normalizeId = (value: unknown) =>
	typeof value === 'string' ? value.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100) : '';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	const db = getD1({ locals, platform });
	if (!db) {
		return json({ success: false, error: 'Layanan data belum tersedia.' }, { status: 500 });
	}

	const body = (await request.json().catch(() => ({}))) as GenerateCoverBody;
	let brief;
	try {
		brief = normalizeBukuCoverBrief(body);
	} catch (err) {
		return json(
			{ success: false, error: err instanceof Error ? err.message : 'Data cover belum lengkap.' },
			{ status: 400 }
		);
	}

	const bookId = normalizeId(body.book_id);
	if (bookId) {
		const book = await db
			.prepare('SELECT author_id AS authorId, status FROM buku_books WHERE id = ? LIMIT 1')
			.bind(bookId)
			.first<{ authorId: string; status: string }>();

		if (!book || book.authorId !== locals.user.id) {
			return json({ success: false, error: 'Buku tidak ditemukan.' }, { status: 404 });
		}
		if (!['draft', 'rejected'].includes(book.status)) {
			return json(
				{ success: false, error: 'Cover hanya dapat dibuat saat buku masih berupa draft atau perlu revisi.' },
				{ status: 409 }
			);
		}
	}

	try {
		const rateLimit = await consumeApiRateLimit({
			db,
			scope: 'buku:generate-cover',
			key: `user:${locals.user.id}`,
			limit: RATE_LIMIT_MAX,
			windowMs: RATE_LIMIT_WINDOW_MS
		});
		if (!rateLimit.allowed) {
			return json(
				{
					success: false,
					error: 'Batas pembuatan cover tercapai. Silakan coba lagi beberapa saat nanti.',
					resetAt: rateLimit.resetAt
				},
				{ status: 429, headers: buildRateLimitHeaders(rateLimit) }
			);
		}

		const dailyRateLimit = await consumeApiRateLimit({
			db,
			scope: 'buku:generate-cover:daily',
			key: `user:${locals.user.id}`,
			limit: DAILY_RATE_LIMIT_MAX,
			windowMs: DAILY_RATE_LIMIT_WINDOW_MS
		});
		if (!dailyRateLimit.allowed) {
			return json(
				{
					success: false,
					error: 'Jatah cover AI hari ini sudah habis. Silakan coba lagi besok.',
					resetAt: dailyRateLimit.resetAt
				},
				{ status: 429, headers: buildRateLimitHeaders(dailyRateLimit) }
			);
		}
	} catch (err) {
		console.error('buku:generate-cover rate limit check failed:', err);
		return json(
			{ success: false, error: 'Layanan pembuat cover sedang sibuk. Silakan coba lagi.' },
			{ status: 503 }
		);
	}

	const ai = (platform?.env?.AI ?? null) as Ai | null;
	if (!ai) {
		return json({ success: false, error: 'Layanan pembuat cover AI belum tersedia.' }, { status: 503 });
	}

	try {
		const bucket = requireR2Bucket(platform);
		const imageResponse = await ai.run(IMAGE_MODEL as any, {
			prompt: buildBukuCoverPrompt(brief),
			negative_prompt: BUKU_COVER_NEGATIVE_PROMPT,
			width: 768,
			height: 1024,
			num_steps: 4
		} as any);
		const imageBuffer = await new Response(imageResponse as BodyInit).arrayBuffer();
		if (imageBuffer.byteLength < 1000) {
			throw new Error('AI mengembalikan gambar kosong.');
		}
		const imageFormat = detectBukuCoverImageFormat(imageBuffer);
		if (!imageFormat) {
			throw new Error('AI mengembalikan format gambar yang tidak dikenali.');
		}

		const safeUserId = locals.user.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
		const key = `buku/covers/${safeUserId}/ai-${Date.now()}-${crypto.randomUUID()}.${imageFormat.extension}`;
		await bucket.put(key, imageBuffer, {
			httpMetadata: {
				contentType: imageFormat.contentType,
				cacheControl: 'public, max-age=31536000, immutable'
			},
			customMetadata: {
				source: 'workers-ai',
				bookId: bookId || 'draft-new'
			}
		});

		return json({ success: true, key, url: buildR2PublicUrl(key, platform) });
	} catch (err) {
		console.error('Buku cover generation failed:', err);
		return json(
			{ success: false, error: 'Cover belum berhasil dibuat. Silakan coba lagi atau upload gambar sendiri.' },
			{ status: 500 }
		);
	}
};
