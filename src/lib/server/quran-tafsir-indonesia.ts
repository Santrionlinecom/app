import type { D1Database } from '@cloudflare/workers-types';

export type QuranTafsirStatus = 'draft' | 'review' | 'published';

export type QuranTafsirSource = {
	id: number;
	source_key: string;
	title: string;
	author: string | null;
	publisher: string | null;
	language: string | null;
	source_type: string | null;
	source_url: string | null;
	license_note: string | null;
	priority: number;
	is_active: number;
};

export type QuranTafsirEntry = {
	id: number;
	source_key: string;
	source_title: string;
	source_author: string | null;
	source_publisher: string | null;
	source_priority: number;
	surah_number: number;
	ayah_number: number;
	title: string | null;
	content: string;
	summary: string | null;
	page_ref: string | null;
	status: QuranTafsirStatus | string;
	verified_by: string | null;
};

export type QuranTafsirIndexEntry = Omit<QuranTafsirEntry, 'content' | 'verified_by'>;

type GetTafsirOptions = {
	includeDraft?: boolean;
};

type GetTafsirIndexOptions = GetTafsirOptions & {
	limit?: number | null;
};

export const TAFSIR_INDONESIA_EMPTY_MESSAGE =
	'Data tafsir ayat ini masih perlu dimuat. Tunggu sebentar, lalu coba muat ulang atau pilih ayat lain yang sudah tersedia.';
export const TAFSIR_INDONESIA_PREVIEW_LIMIT = 520;

export const buildTafsirIndonesiaPreview = (
	content: string,
	limit = TAFSIR_INDONESIA_PREVIEW_LIMIT
) => {
	const text = `${content ?? ''}`.replace(/\s+/g, ' ').trim();
	if (text.length <= limit) {
		return {
			content: text,
			is_truncated: false
		};
	}

	const slice = text.slice(0, limit);
	const lastSpace = slice.lastIndexOf(' ');
	const preview = `${slice.slice(0, lastSpace > 300 ? lastSpace : limit).trim()}...`;
	return {
		content: preview,
		is_truncated: true
	};
};

const isMissingTableError = (err: unknown) =>
	`${(err as Error)?.message ?? err}`.toLowerCase().includes('no such table');

const publishedStatusSql = (options: GetTafsirOptions) =>
	options.includeDraft ? '' : "AND e.status = 'published'";

export async function getTafsirIndonesiaForAyah(
	db: D1Database,
	surahNumber: number,
	ayahNumber: number,
	options: GetTafsirOptions = {}
): Promise<QuranTafsirEntry[]> {
	if (!Number.isInteger(surahNumber) || !Number.isInteger(ayahNumber)) return [];

	try {
		const { results } = await db
			.prepare(
				`SELECT
					e.id,
					e.source_key,
					s.title AS source_title,
					s.author AS source_author,
					s.publisher AS source_publisher,
					COALESCE(s.priority, 100) AS source_priority,
					e.surah_number,
					e.ayah_number,
					e.title,
					e.content,
					e.summary,
					e.page_ref,
					e.status,
					e.verified_by
				FROM quran_tafsir_entries e
				JOIN quran_tafsir_sources s ON s.source_key = e.source_key
				WHERE e.surah_number = ?
					AND e.ayah_number = ?
					AND s.is_active = 1
					${publishedStatusSql(options)}
				ORDER BY COALESCE(s.priority, 100) ASC, e.id ASC`
			)
			.bind(surahNumber, ayahNumber)
			.all<QuranTafsirEntry>();

		return results ?? [];
	} catch (err) {
		if (isMissingTableError(err)) return [];
		throw err;
	}
}

export async function getTafsirIndonesiaForSurah(
	db: D1Database,
	surahNumber: number,
	options: GetTafsirOptions = {}
): Promise<QuranTafsirEntry[]> {
	if (!Number.isInteger(surahNumber)) return [];

	try {
		const { results } = await db
			.prepare(
				`SELECT
					e.id,
					e.source_key,
					s.title AS source_title,
					s.author AS source_author,
					s.publisher AS source_publisher,
					COALESCE(s.priority, 100) AS source_priority,
					e.surah_number,
					e.ayah_number,
					e.title,
					e.content,
					e.summary,
					e.page_ref,
					e.status,
					e.verified_by
				FROM quran_tafsir_entries e
				JOIN quran_tafsir_sources s ON s.source_key = e.source_key
				WHERE e.surah_number = ?
					AND s.is_active = 1
					${publishedStatusSql(options)}
				ORDER BY e.ayah_number ASC, COALESCE(s.priority, 100) ASC, e.id ASC`
			)
			.bind(surahNumber)
			.all<QuranTafsirEntry>();

		return results ?? [];
	} catch (err) {
		if (isMissingTableError(err)) return [];
		throw err;
	}
}

export async function getTafsirIndonesiaIndex(
	db: D1Database,
	options: GetTafsirIndexOptions = {}
): Promise<QuranTafsirIndexEntry[]> {
	const safeLimit =
		typeof options.limit === 'number' && Number.isInteger(options.limit) && options.limit > 0
			? Math.min(options.limit, 20_000)
			: null;
	const limitSql = safeLimit ? 'LIMIT ?' : '';

	try {
		const statement = db.prepare(
			`SELECT
					e.id,
					e.source_key,
					s.title AS source_title,
					s.author AS source_author,
					s.publisher AS source_publisher,
					COALESCE(s.priority, 100) AS source_priority,
					e.surah_number,
					e.ayah_number,
					e.title,
					e.summary,
					e.page_ref,
					e.status
				FROM quran_tafsir_entries e
				JOIN quran_tafsir_sources s ON s.source_key = e.source_key
				WHERE 1 = 1
					${publishedStatusSql(options)}
					AND s.is_active = 1
				ORDER BY e.surah_number ASC, e.ayah_number ASC, COALESCE(s.priority, 100) ASC, e.id ASC
				${limitSql}`
		);

		const { results } = safeLimit
			? await statement.bind(safeLimit).all<QuranTafsirIndexEntry>()
			: await statement.all<QuranTafsirIndexEntry>();

		return results ?? [];
	} catch (err) {
		if (isMissingTableError(err)) return [];
		throw err;
	}
}

export async function getPublishedTafsirIndonesiaIndex(
	db: D1Database,
	limit = 500
): Promise<QuranTafsirIndexEntry[]> {
	return getTafsirIndonesiaIndex(db, { limit });
}
