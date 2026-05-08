import { json } from '@sveltejs/kit';
import type { Ai } from '@cloudflare/workers-types';
import { canManageCms } from '$lib/server/auth/cms-access';
import { buildR2PublicUrl, getD1, requireR2Bucket } from '$lib/server/cloudflare';
import type { RequestHandler } from './$types';

const IMAGE_MODEL = '@cf/bytedance/stable-diffusion-xl-lightning';

type GenerateThumbnailBody = {
	image_prompt?: unknown;
	post_id?: unknown;
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

	const ai = (platform?.env?.AI ?? null) as Ai | null;
	if (!ai) {
		return json({ success: false, error: 'Binding Cloudflare Workers AI belum tersedia.' }, { status: 500 });
	}

	const body = (await request.json().catch(() => ({}))) as GenerateThumbnailBody;
	const imagePrompt = readString(body.image_prompt, 260);
	if (!imagePrompt) {
		return json({ success: false, error: 'image_prompt wajib diisi.' }, { status: 400 });
	}

	const finalPrompt = `${imagePrompt}, Islamic art style, arabesque geometric pattern, mosque architecture, warm golden tones, professional blog thumbnail, vertical 9:16 composition, cinematic lighting, high quality, no human faces, no text overlay`;
	const negativePrompt = 'human face, person, portrait, readable text, watermark, logo, low quality, blurry';

	try {
		const bucket = requireR2Bucket(platform);
		const imageResponse = await ai.run(IMAGE_MODEL as any, {
			prompt: finalPrompt,
			negative_prompt: negativePrompt,
			width: 1024,
			height: 1792,
			num_steps: 4
		} as any);

		const imageBuffer = await new Response(imageResponse as BodyInit).arrayBuffer();
		const postId = normalizeStorageId(body.post_id);
		const filename = `thumbnails/post-${postId}.jpg`;

		await bucket.put(filename, imageBuffer, {
			httpMetadata: {
				contentType: 'image/jpeg',
				cacheControl: 'public, max-age=31536000'
			}
		});
		const publicUrl = buildR2PublicUrl(filename, platform);
		const db = getD1({ locals, platform });
		if (db) {
			try {
				await db
					.prepare('UPDATE ai_generations SET thumbnail_url = ? WHERE post_id = ?')
					.bind(publicUrl, postId)
					.run();
			} catch (historyErr) {
				console.warn('AI generation thumbnail history update failed:', historyErr);
			}
		}

		return json({
			success: true,
			url: publicUrl,
			key: filename,
			model: IMAGE_MODEL
		});
	} catch (err: any) {
		console.error('Thumbnail generation error:', err);
		return json(
			{
				success: false,
				error: 'Gagal generate thumbnail.',
				detail: String(err?.message ?? err ?? '')
			},
			{ status: 500 }
		);
	}
};
