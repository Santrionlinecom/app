import { json } from '@sveltejs/kit';
import { buildR2PublicUrl, getD1, requireR2Bucket } from '$lib/server/cloudflare';
import { canManageCms } from '$lib/server/auth/cms-access';
import { recordMedia } from '$lib/server/media';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB
const allowedMimeToExt: Record<string, string> = {
	'application/pdf': 'pdf',
	'application/zip': 'zip',
	'application/x-zip-compressed': 'zip',
	'application/epub+zip': 'epub',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
	'audio/mpeg': 'mp3',
	'audio/mp4': 'm4a',
	'audio/wav': 'wav',
	'video/mp4': 'mp4'
};
const allowedExtensions = new Set(Object.values(allowedMimeToExt));
const UPLOAD_RATE_LIMIT_MAX = 10;
const UPLOAD_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

const getExtensionFromName = (filename?: string | null) => {
	const value = filename?.trim().toLowerCase() ?? '';
	if (!value.includes('.')) return '';
	return value.split('.').pop() ?? '';
};

export async function POST({ request, locals, platform }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}
	if (!canManageCms(locals.user)) {
		return json({ error: 'Forbidden.' }, { status: 403 });
	}

	const db = getD1({ locals, platform });
	if (db) {
		try {
			const rateLimit = await consumeApiRateLimit({
				db,
				scope: 'upload:digital',
				key: `user:${locals.user.id}`,
				limit: UPLOAD_RATE_LIMIT_MAX,
				windowMs: UPLOAD_RATE_LIMIT_WINDOW_MS
			});
			if (!rateLimit.allowed) {
				return json(
					{
						error: 'Terlalu banyak upload file digital. Coba lagi sebentar lagi.',
						limit: rateLimit.limit,
						resetAt: rateLimit.resetAt
					},
					{ status: 429, headers: buildRateLimitHeaders(rateLimit) }
				);
			}
		} catch (err) {
			console.warn('Digital upload rate limit check failed:', err);
		}
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;

	if (!file) {
		return json({ error: 'No file provided.' }, { status: 400 });
	}
	if (file.size <= 0) {
		return json({ error: 'File is empty.' }, { status: 400 });
	}
	if (file.size > MAX_UPLOAD_BYTES) {
		return json({ error: 'File too large. Max 50MB.' }, { status: 413 });
	}

	const fileExtension = allowedMimeToExt[file.type] ?? getExtensionFromName(file.name);
	if (!allowedExtensions.has(fileExtension)) {
		return json(
			{ error: 'Format file belum didukung. Gunakan PDF, ZIP, EPUB, DOCX, XLSX, PPTX, MP3, M4A, WAV, atau MP4.' },
			{ status: 415 }
		);
	}

	const key = `digital-products/${locals.user.id}/${crypto.randomUUID()}.${fileExtension}`;

	try {
		const bucket = requireR2Bucket(platform);
		await bucket.put(key, await file.arrayBuffer(), {
			httpMetadata: {
				contentType: file.type || undefined
			}
		});

		const publicUrl = buildR2PublicUrl(key, platform);

		if (db) {
			try {
				await recordMedia(db, {
					filename: key,
					url: publicUrl,
					mime_type: file.type || null,
					size: file.size ?? null
				});
			} catch (err) {
				console.warn('Gagal menyimpan metadata digital asset:', err);
			}
		}

		return json({ key, url: publicUrl });
	} catch (err) {
		console.error('Error uploading digital file to R2:', err);
		return json({ error: 'Failed to upload digital file.' }, { status: 500 });
	}
}
