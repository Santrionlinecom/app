export type BukuCoverBrief = {
	title: string;
	category: string;
	description: string;
};

export type BukuCoverImageFormat = {
	extension: 'jpg' | 'png' | 'webp';
	contentType: 'image/jpeg' | 'image/png' | 'image/webp';
};

export function detectBukuCoverImageFormat(input: ArrayBuffer | Uint8Array): BukuCoverImageFormat | null {
	const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
	if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return { extension: 'jpg', contentType: 'image/jpeg' };
	}
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
		return { extension: 'png', contentType: 'image/png' };
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
		return { extension: 'webp', contentType: 'image/webp' };
	}
	return null;
}

const normalizeText = (value: unknown, maxLength: number) =>
	(typeof value === 'string' ? value : '')
		.replace(/[\u0000-\u001f\u007f]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, maxLength);

export function normalizeBukuCoverBrief(input: {
	title?: unknown;
	category?: unknown;
	description?: unknown;
}): BukuCoverBrief {
	const title = normalizeText(input.title, 140);
	if (title.length < 3) {
		throw new Error('Judul buku wajib diisi minimal 3 karakter.');
	}

	return {
		title,
		category: normalizeText(input.category, 80),
		description: normalizeText(input.description, 1200)
	};
}

export function buildBukuCoverPrompt(input: {
	title?: unknown;
	category?: unknown;
	description?: unknown;
}) {
	const brief = normalizeBukuCoverBrief(input);
	const categoryContext = brief.category || 'Indonesian inspirational fiction';
	const synopsisContext = brief.description || 'A hopeful story about learning, character, and personal growth.';

	return [
		'Premium editorial illustrated book cover artwork, vertical 3:4 composition.',
		`Visual concept for a book titled "${brief.title}".`,
		`Genre and audience: ${categoryContext}.`,
		`Story atmosphere: ${synopsisContext}`,
		'Indonesian setting, emotionally engaging focal point, elegant cinematic lighting, rich layered depth, polished publishing quality.',
		'Family-friendly Muslim literature, modest clothing where people appear, respectful visual storytelling, no explicit imagery.',
		'Artwork only: no readable text, no title lettering, no typography, no logo, no watermark, no border, no mockup.'
	].join(' ');
}

export const BUKU_COVER_NEGATIVE_PROMPT = [
	'readable text',
	'letters',
	'typography',
	'logo',
	'watermark',
	'book mockup',
	'explicit content',
	'immodest clothing',
	'distorted face',
	'extra fingers',
	'low quality',
	'blurry'
].join(', ');
