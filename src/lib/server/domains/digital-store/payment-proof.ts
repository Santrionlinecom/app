import type { D1Database } from '@cloudflare/workers-types';
import { buildR2PublicUrl, requireR2Bucket } from '$lib/server/cloudflare';
import { recordMedia } from '$lib/server/media';

const MAX_PROOF_BYTES = 8 * 1024 * 1024;

const allowedMimeToExt: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'application/pdf': 'pdf'
};

const getExtensionFromName = (filename?: string | null) => {
	const value = filename?.trim().toLowerCase() ?? '';
	if (!value.includes('.')) return '';
	return value.split('.').pop() ?? '';
};

export async function uploadDigitalPaymentProof(
	db: D1Database,
	platform: App.Platform | null | undefined,
	file: File,
	referenceCode: string
) {
	if (!file || file.size <= 0) {
		throw new Error('File bukti bayar tidak valid.');
	}
	if (file.size > MAX_PROOF_BYTES) {
		throw new Error('Ukuran bukti bayar melebihi 8MB.');
	}

	const extension = allowedMimeToExt[file.type] ?? getExtensionFromName(file.name);
	if (!extension || !Object.values(allowedMimeToExt).includes(extension)) {
		throw new Error('Format bukti bayar harus JPG, PNG, WEBP, atau PDF.');
	}

	const bucket = requireR2Bucket(platform);
	const key = `payment-proofs/${referenceCode}/${crypto.randomUUID()}.${extension}`;

	await bucket.put(key, await file.arrayBuffer(), {
		httpMetadata: {
			contentType: file.type || undefined
		}
	});

	const url = buildR2PublicUrl(key, platform);

	try {
		await recordMedia(db, {
			filename: key,
			url,
			mime_type: file.type || null,
			size: file.size ?? null
		});
	} catch (err) {
		console.warn('Gagal mencatat media bukti bayar:', err);
	}

	return {
		key,
		url,
		mimeType: file.type || null,
		size: file.size ?? null
	};
}
