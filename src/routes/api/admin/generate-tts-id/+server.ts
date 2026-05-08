import { json } from '@sveltejs/kit';
import { canManageCms } from '$lib/server/auth/cms-access';
import { buildR2PublicUrl, getD1, requireR2Bucket } from '$lib/server/cloudflare';
import type { RequestHandler } from './$types';

const MAX_TTS_CHARS = 1400;
const CHUNK_CHARS = 180;

type GenerateIndonesianTtsBody = {
	teks?: unknown;
	post_id?: unknown;
	voice?: unknown;
};

const readString = (value: unknown, maxLength: number) =>
	typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const normalizeStorageId = (value: unknown) => {
	const id = readString(value, 80).replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-');
	return id || String(Date.now());
};

const splitText = (value: string) => {
	const chunks: string[] = [];
	let current = '';

	for (const word of value.split(/\s+/).filter(Boolean)) {
		if ((current ? `${current} ${word}` : word).length > CHUNK_CHARS) {
			if (current) chunks.push(current);
			current = word.slice(0, CHUNK_CHARS);
		} else {
			current = current ? `${current} ${word}` : word;
		}
	}

	if (current) chunks.push(current);
	return chunks;
};

const concatArrayBuffers = (buffers: ArrayBuffer[]) => {
	const totalLength = buffers.reduce((total, buffer) => total + buffer.byteLength, 0);
	const combined = new Uint8Array(totalLength);
	let offset = 0;

	for (const buffer of buffers) {
		combined.set(new Uint8Array(buffer), offset);
		offset += buffer.byteLength;
	}

	return combined.buffer;
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	if (!canManageCms(locals.user)) {
		return json({ success: false, error: 'Tidak diizinkan.' }, { status: 403 });
	}

	const body = (await request.json().catch(() => ({}))) as GenerateIndonesianTtsBody;
	const plainText = stripHtml(readString(body.teks, 6000));
	if (!plainText) {
		return json({ success: false, error: 'teks wajib diisi.' }, { status: 400 });
	}

	const ttsText = plainText.slice(0, MAX_TTS_CHARS);
	const chunks = splitText(ttsText);

	try {
		const buffers: ArrayBuffer[] = [];
		for (const chunk of chunks) {
			const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=id&client=tw-ob`;
			const audioResponse = await fetch(googleTtsUrl, {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
				}
			});

			if (!audioResponse.ok) {
				throw new Error(`TTS request failed: ${audioResponse.status}`);
			}

			buffers.push(await audioResponse.arrayBuffer());
		}

		const audioBuffer = concatArrayBuffers(buffers);
		const postId = normalizeStorageId(body.post_id);
		const filename = `audio/narasi-${postId}.mp3`;
		const bucket = requireR2Bucket(platform);

		await bucket.put(filename, audioBuffer, {
			httpMetadata: {
				contentType: 'audio/mpeg',
				cacheControl: 'public, max-age=31536000'
			}
		});
		const publicUrl = buildR2PublicUrl(filename, platform);
		const db = getD1({ locals, platform });
		if (db) {
			try {
				await db
					.prepare('UPDATE ai_generations SET audio_id_url = ? WHERE post_id = ?')
					.bind(publicUrl, postId)
					.run();
			} catch (historyErr) {
				console.warn('AI generation Indonesian audio history update failed:', historyErr);
			}
		}

		return json({
			success: true,
			url: publicUrl,
			key: filename,
			truncated: plainText.length > MAX_TTS_CHARS
		});
	} catch (err: any) {
		console.error('Indonesian TTS generation error:', err);
		return json(
			{
				success: false,
				error: 'Gagal generate narasi Indonesia.',
				detail: String(err?.message ?? err ?? '')
			},
			{ status: 500 }
		);
	}
};
