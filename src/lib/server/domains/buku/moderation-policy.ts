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
	chapterNumbers: number[],
	publishedChapterNumbers: number[]
) => {
	const available = Array.from(
		new Set(chapterNumbers.filter((number) => Number.isInteger(number) && number > 0))
	).sort((a, b) => a - b);
	if (available.length === 0) return 0;
	if (status === 'pending') {
		const published = publishedChapterNumbers.filter((number) => available.includes(number));
		if (published.length > 0) return Math.max(...published);
	}
	return available[Math.min(2, available.length - 1)];
};

export const isValidPublishedThrough = (chapterNumbers: number[], publishedThrough: number) =>
	Number.isInteger(publishedThrough) && chapterNumbers.includes(publishedThrough);
