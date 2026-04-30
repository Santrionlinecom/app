import { json } from '@sveltejs/kit';
import { buildR2PublicUrl, requireR2Bucket } from '$lib/server/cloudflare';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
};

const sanitizeFilename = (filename: string, fallback: string) => {
	const withoutExtension = filename.replace(/\.[^.]+$/, '');
	const safe = withoutExtension
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-')
		.slice(0, 80);

	return safe || fallback;
};

const hasValidImageSignature = (mimeType: string, bytes: Uint8Array) => {
	if (mimeType === 'image/jpeg') {
		return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
	}

	if (mimeType === 'image/png') {
		return (
			bytes.length >= 8 &&
			bytes[0] === 0x89 &&
			bytes[1] === 0x50 &&
			bytes[2] === 0x4e &&
			bytes[3] === 0x47 &&
			bytes[4] === 0x0d &&
			bytes[5] === 0x0a &&
			bytes[6] === 0x1a &&
			bytes[7] === 0x0a
		);
	}

	if (mimeType === 'image/webp') {
		return (
			bytes.length >= 12 &&
			bytes[0] === 0x52 &&
			bytes[1] === 0x49 &&
			bytes[2] === 0x46 &&
			bytes[3] === 0x46 &&
			bytes[8] === 0x57 &&
			bytes[9] === 0x45 &&
			bytes[10] === 0x42 &&
			bytes[11] === 0x50
		);
	}

	return false;
};

export async function POST({ request, locals, platform }) {
	if (!locals.user) {
		return json({ error: 'Silakan login terlebih dahulu untuk upload cover.' }, { status: 401 });
	}

	const formData = await request.formData();
	const file = formData.get('file');

	if (!(file instanceof File)) {
		return json({ error: 'File cover wajib dipilih.' }, { status: 400 });
	}
	if (file.size <= 0) {
		return json({ error: 'File cover kosong.' }, { status: 400 });
	}
	if (file.size > MAX_UPLOAD_BYTES) {
		return json({ error: 'Ukuran cover maksimal 2MB.' }, { status: 413 });
	}
	if (!(file.type in ALLOWED_MIME_TO_EXT)) {
		return json({ error: 'Format cover harus JPG, PNG, atau WebP.' }, { status: 415 });
	}

	const buffer = await file.arrayBuffer();
	const bytes = new Uint8Array(buffer);
	if (!hasValidImageSignature(file.type, bytes)) {
		return json({ error: 'File cover tidak valid. Gunakan gambar JPG, PNG, atau WebP.' }, { status: 415 });
	}

	const extension = ALLOWED_MIME_TO_EXT[file.type];
	const timestamp = Date.now();
	const safeName = sanitizeFilename(file.name, 'cover');
	const key = `buku/covers/${locals.user.id}/${timestamp}-${crypto.randomUUID()}-${safeName}.${extension}`;

	try {
		const bucket = requireR2Bucket(platform);
		await bucket.put(key, buffer, {
			httpMetadata: {
				cacheControl: 'public, max-age=31536000, immutable',
				contentType: file.type
			}
		});

		return json({ key, url: buildR2PublicUrl(key, platform) });
	} catch (err) {
		console.error('Gagal upload cover buku ke R2:', err);
		return json({ error: 'Gagal upload cover. Coba lagi sebentar lagi.' }, { status: 500 });
	}
}
