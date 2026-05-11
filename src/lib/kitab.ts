export type KitabSourceType = 'pdf' | 'drive';
export type KitabStatus = 'draft' | 'published' | 'archived';

type KitabStatusLike = {
	status?: string | null;
};

type KitabFeaturedLike = KitabStatusLike & {
	featured?: boolean | number | string | null;
};

type KitabStatsSource = KitabFeaturedLike & {
	sourceType?: KitabSourceType | string | null;
	source_type?: KitabSourceType | string | null;
};

export type KitabStats = {
	totalItems: number;
	publishedItems: number;
	draftItems: number;
	archivedItems: number;
	featuredItems: number;
	pdfItems: number;
	driveItems: number;
};

const publishedStatusAliases = new Set(['published', 'publish', 'live', 'public', 'terbit']);
const archivedStatusAliases = new Set(['archived', 'archive', 'arsip']);

export const normalizeKitabSlug = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-');

export const normalizeKitabStatus = (value: string | null | undefined): KitabStatus => {
	const normalized = (value ?? '').trim().toLowerCase();
	if (publishedStatusAliases.has(normalized)) return 'published';
	if (archivedStatusAliases.has(normalized)) return 'archived';
	return 'draft';
};

const isFeaturedValue = (value: boolean | number | string | null | undefined) =>
	value === true || value === 1 || value === '1' || value === 'true';

const sourceTypeOf = (item: KitabStatsSource) =>
	(item.sourceType ?? item.source_type ?? '').toString().trim().toLowerCase();

export const getPublishedKitabs = <T extends KitabStatusLike>(
	items: readonly T[] | null | undefined
): T[] => (items ?? []).filter((item) => normalizeKitabStatus(item.status) === 'published');

export const getFeaturedKitabs = <T extends KitabFeaturedLike>(
	items: readonly T[] | null | undefined,
	options: { publishedOnly?: boolean } = { publishedOnly: true }
): T[] => {
	const sourceItems = options.publishedOnly === false ? (items ?? []) : getPublishedKitabs(items);
	return sourceItems.filter((item) => isFeaturedValue(item.featured));
};

export const getKitabStats = (items: readonly KitabStatsSource[] | null | undefined): KitabStats => {
	const sourceItems = items ?? [];
	const publishedItems = getPublishedKitabs(sourceItems);

	return {
		totalItems: sourceItems.length,
		publishedItems: publishedItems.length,
		draftItems: sourceItems.filter((item) => normalizeKitabStatus(item.status) === 'draft').length,
		archivedItems: sourceItems.filter((item) => normalizeKitabStatus(item.status) === 'archived').length,
		featuredItems: getFeaturedKitabs(sourceItems).length,
		pdfItems: publishedItems.filter((item) => sourceTypeOf(item) === 'pdf').length,
		driveItems: publishedItems.filter((item) => sourceTypeOf(item) === 'drive').length
	};
};

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
