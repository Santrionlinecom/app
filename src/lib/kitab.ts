export type KitabSourceType = 'pdf' | 'drive';
export type KitabStatus = 'draft' | 'published' | 'archived';

export const normalizeKitabSlug = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-');

export const extractGoogleDriveFileId = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) return null;

	try {
		const url = new URL(trimmed);
		if (!url.hostname.includes('drive.google.com')) return null;

		const directMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
		if (directMatch?.[1]) return directMatch[1];

		const foldersMatch = url.pathname.match(/\/open$/);
		if (foldersMatch) {
			const id = url.searchParams.get('id');
			return id?.trim() || null;
		}

		const id = url.searchParams.get('id');
		return id?.trim() || null;
	} catch {
		return null;
	}
};

export const isGoogleDriveUrl = (value: string) => Boolean(extractGoogleDriveFileId(value));

export const toGoogleDrivePreviewUrl = (value: string) => {
	const id = extractGoogleDriveFileId(value);
	return id ? `https://drive.google.com/file/d/${id}/preview` : null;
};

export const toGoogleDriveDownloadUrl = (value: string) => {
	const id = extractGoogleDriveFileId(value);
	return id ? `https://drive.google.com/uc?export=download&id=${id}` : null;
};

export const toKitabReaderUrl = (sourceType: KitabSourceType, sourceUrl: string | null | undefined) => {
	const normalizedUrl = sourceUrl?.trim() ?? '';
	if (!normalizedUrl) return null;
	if (sourceType === 'drive') {
		return toGoogleDrivePreviewUrl(normalizedUrl) ?? normalizedUrl;
	}
	return normalizedUrl;
};

export const toKitabDownloadUrl = (sourceType: KitabSourceType, sourceUrl: string | null | undefined) => {
	const normalizedUrl = sourceUrl?.trim() ?? '';
	if (!normalizedUrl) return null;
	if (sourceType === 'drive') {
		return toGoogleDriveDownloadUrl(normalizedUrl) ?? normalizedUrl;
	}
	return normalizedUrl;
};
