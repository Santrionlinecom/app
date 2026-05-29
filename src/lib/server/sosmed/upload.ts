import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

export const DEFAULT_MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
export const DEFAULT_MAX_STORAGE_PER_USER_BYTES = 50 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
};

export const getMaxPhotoSize = (value?: string) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_PHOTO_SIZE_BYTES;
};

export const getMaxStoragePerUser = (value?: string) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_STORAGE_PER_USER_BYTES;
};

export const getPublicMediaBaseUrl = (env?: App.Platform['env']) =>
	(env?.R2_PUBLIC_URL ?? env?.R2_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '') || null;

export const getMediaBucket = (env?: App.Platform['env']) => env?.MEDIA_BUCKET ?? env?.BUCKET ?? null;

export const detectImageMime = (bytes: Uint8Array) => {
	if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
	if (
		bytes.length >= 8 &&
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47 &&
		bytes[4] === 0x0d &&
		bytes[5] === 0x0a &&
		bytes[6] === 0x1a &&
		bytes[7] === 0x0a
	) {
		return 'image/png';
	}
	if (
		bytes.length >= 12 &&
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		return 'image/webp';
	}
	return null;
};

export const getUsedBytes = async (db: D1Database, userId: string) => {
	const row = await db
		.prepare('SELECT used_bytes FROM user_storage_usage WHERE user_id = ?')
		.bind(userId)
		.first<{ used_bytes: number }>();
	return Number(row?.used_bytes ?? 0);
};

export const uploadSosmedImage = async (
	db: D1Database,
	bucket: R2Bucket,
	params: {
		file: File;
		lembagaId: string;
		userId: string;
		publicBaseUrl: string;
		maxPhotoSizeBytes: number;
		maxStorageBytes: number;
	}
) => {
	if (params.file.size > params.maxPhotoSizeBytes) {
		return { ok: false as const, status: 413, error: 'Ukuran file melebihi 5MB' };
	}

	const headerBytes = new Uint8Array(await params.file.slice(0, 16).arrayBuffer());
	const mime = detectImageMime(headerBytes);
	if (!mime || params.file.type !== mime || !(mime in MIME_TO_EXT)) {
		return { ok: false as const, status: 400, error: 'Format foto harus JPG, PNG, atau WEBP.' };
	}

	const usedBytes = await getUsedBytes(db, params.userId);
	const nextUsedBytes = usedBytes + params.file.size;
	if (nextUsedBytes > params.maxStorageBytes) {
		return {
			ok: false as const,
			status: 507,
			error: 'Kuota penyimpanan 50MB penuh. Hapus post lama untuk upload baru.'
		};
	}

	const ext = MIME_TO_EXT[mime];
	const key = `sosmed/${params.lembagaId}/${params.userId}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
	await bucket.put(key, await params.file.arrayBuffer(), {
		httpMetadata: { contentType: mime },
		customMetadata: {
			userId: params.userId,
			lembagaId: params.lembagaId,
			uploadedAt: new Date().toISOString()
		}
	});

	await db
		.prepare(
			`INSERT INTO user_storage_usage (user_id, lembaga_id, used_bytes, updated_at)
			 VALUES (?, ?, ?, unixepoch())
			 ON CONFLICT(user_id) DO UPDATE SET
				lembaga_id = excluded.lembaga_id,
				used_bytes = excluded.used_bytes,
				updated_at = unixepoch()`
		)
		.bind(params.userId, params.lembagaId, nextUsedBytes)
		.run();

	return {
		ok: true as const,
		url: `${params.publicBaseUrl.replace(/\/+$/, '')}/${key}`,
		size_bytes: params.file.size,
		used_bytes: nextUsedBytes
	};
};
