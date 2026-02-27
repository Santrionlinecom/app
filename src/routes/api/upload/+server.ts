import { json } from '@sveltejs/kit';
import { buildR2PublicUrl, getD1, requireR2Bucket } from '$lib/server/cloudflare';
import { recordMedia } from '$lib/server/media';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
const allowedMimeToExt: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif'
};
const UPLOAD_RATE_LIMIT_MAX = 20;
const UPLOAD_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export async function POST({ request, locals, platform }) {
  if (!locals.user) {
    return json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const db = getD1({ locals, platform });
  if (db) {
    try {
      const rateLimit = await consumeApiRateLimit({
        db,
        scope: 'upload:image',
        key: `user:${locals.user.id}`,
        limit: UPLOAD_RATE_LIMIT_MAX,
        windowMs: UPLOAD_RATE_LIMIT_WINDOW_MS
      });
      if (!rateLimit.allowed) {
        return json(
          {
            error: 'Terlalu banyak upload. Coba lagi sebentar lagi.',
            limit: rateLimit.limit,
            resetAt: rateLimit.resetAt
          },
          { status: 429, headers: buildRateLimitHeaders(rateLimit) }
        );
      }
    } catch (err) {
      console.warn('Upload rate limit check failed:', err);
    }
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return json({ error: 'No file provided.' }, { status: 400 });
  }
  if (file.size <= 0) {
    return json({ error: 'File is empty.' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return json({ error: 'File too large. Max 10MB.' }, { status: 413 });
  }
  if (!(file.type in allowedMimeToExt)) {
    return json({ error: 'Only image files are allowed.' }, { status: 415 });
  }

  const fileExtension = allowedMimeToExt[file.type];
  const filename = `uploads/${locals.user.id}/${crypto.randomUUID()}.${fileExtension}`;

  try {
    const bucket = requireR2Bucket(platform);

    await bucket.put(filename, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type
      }
    });

    const publicUrl = buildR2PublicUrl(filename, platform);

    // Simpan metadata ke D1 (jika tersedia) agar muncul di galeri
    if (db) {
      try {
        await recordMedia(db, {
          filename,
          url: publicUrl,
          mime_type: file.type || null,
          size: file.size ?? null
        });
      } catch (err) {
        console.warn('Gagal menyimpan metadata media:', err);
      }
    }

    return json({ key: filename, url: publicUrl });
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return json({ error: 'Failed to upload file.' }, { status: 500 });
  }
}
