import { json } from '@sveltejs/kit';
import { canManageCms } from '$lib/server/auth/cms-access';
import { enforceAdminAiRateLimit } from '$lib/server/admin-ai-rate-limit';
import { buildR2PublicUrl, getD1, requireR2Bucket } from '$lib/server/cloudflare';
import type { RequestHandler } from './$types';

const GROQ_TTS_URL = 'https://api.groq.com/openai/v1/audio/speech';
const GROQ_ARABIC_TTS_MODEL = 'canopylabs/orpheus-arabic-saudi';
const ARABIC_VOICES = new Set(['abdullah', 'fahad', 'sultan', 'lulwa', 'noura', 'aisha']);
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

type GenerateArabicTtsBody = {
	teks_arab?: unknown;
	post_id?: unknown;
	voice?: unknown;
};

const readString = (value: unknown, maxLength: number) =>
	typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const normalizeStorageId = (value: unknown) => {
	const id = readString(value, 80).replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-');
	return id || String(Date.now());
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
		return json({ success: false, error: 'Layanan audio AI belum tersedia. Hubungi super admin.' }, { status: 500 });
	}

	const db = getD1({ locals, platform });
	const rateLimited = await enforceAdminAiRateLimit({
		db,
		user: locals.user,
		scope: 'admin:generate-tts-ar',
		limit: RATE_LIMIT_MAX,
		windowMs: RATE_LIMIT_WINDOW_MS
	});
	if (rateLimited) return rateLimited;

	const body = (await request.json().catch(() => ({}))) as GenerateArabicTtsBody;
	const teksArab = readString(body.teks_arab, 200);
	if (!teksArab) {
		return json({ success: false, error: 'teks_arab wajib diisi.' }, { status: 400 });
	}

	const requestedVoice = readString(body.voice, 40).toLowerCase();
	const voice = ARABIC_VOICES.has(requestedVoice) ? requestedVoice : 'fahad';

	try {
		const response = await fetch(GROQ_TTS_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${groqApiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: GROQ_ARABIC_TTS_MODEL,
				input: teksArab,
				voice,
				response_format: 'wav'
			})
		});

		if (!response.ok) {
			await response.text().catch(() => response.statusText);
			return json(
				{
					success: false,
					error: 'Layanan audio AI menolak permintaan.'
				},
				{ status: response.status }
			);
		}

		const audioBuffer = await response.arrayBuffer();
		const postId = normalizeStorageId(body.post_id);
		const filename = `audio/arab-${postId}.wav`;
		const bucket = requireR2Bucket(platform);

		await bucket.put(filename, audioBuffer, {
			httpMetadata: {
				contentType: 'audio/wav',
				cacheControl: 'public, max-age=31536000'
			}
		});
		const publicUrl = buildR2PublicUrl(filename, platform);
		if (db) {
			try {
				await db
					.prepare('UPDATE ai_generations SET audio_ar_url = ? WHERE post_id = ?')
					.bind(publicUrl, postId)
					.run();
			} catch (historyErr) {
				console.warn('AI generation Arabic audio history update failed:', historyErr);
			}
		}

		return json({
			success: true,
			url: publicUrl,
			key: filename,
			voice
		});
	} catch (err: any) {
		console.error('Arabic TTS generation error:', err);
		return json(
			{
				success: false,
				error: 'Gagal generate audio Arab.'
			},
			{ status: 500 }
		);
	}
};
