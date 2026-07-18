import type { BukuBookStatus } from './library';

const ADMIN_PUBLISHABLE_STATUSES = new Set<BukuBookStatus>(['draft', 'pending', 'rejected']);
const CHAPTER_MANAGEABLE_BOOK_STATUSES = new Set<BukuBookStatus>(['draft', 'rejected', 'published']);

export const canAdminPublishBook = (status: BukuBookStatus) =>
	ADMIN_PUBLISHABLE_STATUSES.has(status);

export const adminBookPublishLabel = (status: BukuBookStatus) => {
	if (status === 'pending') return 'Approve dan Terbitkan';
	if (status === 'rejected') return 'Terbitkan Ulang';
	return 'Terbitkan Buku';
};

export const canManagePublishedBookChapters = (status: BukuBookStatus) =>
	CHAPTER_MANAGEABLE_BOOK_STATUSES.has(status);

export const defaultPublishedThrough = (
	status: BukuBookStatus,
	publishedChapterCount: number,
	totalChapterCount: number
) => {
	if (!Number.isInteger(totalChapterCount) || totalChapterCount <= 0) return 0;
	const requested = status === 'pending' ? publishedChapterCount : Math.min(3, totalChapterCount);
	return Math.max(1, Math.min(totalChapterCount, requested || 1));
};
