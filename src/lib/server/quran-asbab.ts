import type { D1Database } from '@cloudflare/workers-types';

export type QuranAsbabStatus = 'draft' | 'review' | 'published';

export type QuranAsbabSource = {
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

export type QuranAsbabEntry = {
	id: number;
	source_key: string;
	source_title: string;
	source_author: string | null;
	source_publisher: string | null;
	source_priority: number;
	surah_number: number;
	ayah_start: number;
	ayah_end: number;
	title: string | null;
	content: string;
	riwayat: string | null;
	takhrij: string | null;
	grade: string | null;
	page_ref: string | null;
	status: QuranAsbabStatus | string;
	verified_by: string | null;
};

export type QuranAsbabEntryInput = {
	source_key?: unknown;
	surah_number?: unknown;
	ayah_start?: unknown;
	ayah_end?: unknown;
	title?: unknown;
	content?: unknown;
	riwayat?: unknown;
	takhrij?: unknown;
	grade?: unknown;
	page_ref?: unknown;
	status?: unknown;
	verified_by?: unknown;
};

export type ValidatedQuranAsbabEntry = {
	source_key: string;
	surah_number: number;
	ayah_start: number;
	ayah_end: number;
	title: string | null;
	content: string;
	riwayat: string | null;
	takhrij: string | null;
	grade: string | null;
	page_ref: string | null;
	status: QuranAsbabStatus;
	verified_by: string | null;
};

export type QuranAsbabValidationResult =
	| { ok: true; value: ValidatedQuranAsbabEntry }
	| { ok: false; errors: string[] };

type GetAsbabOptions = {
	includeDraft?: boolean;
};

const ALLOWED_STATUSES = new Set<QuranAsbabStatus>(['draft', 'review', 'published']);

const isMissingTableError = (err: unknown) =>
	`${(err as Error)?.message ?? err}`.toLowerCase().includes('no such table');

const cleanText = (value: unknown, maxLength = 1000) => {
	const text = `${value ?? ''}`.trim();
	return text ? text.slice(0, maxLength) : '';
};

const cleanOptionalText = (value: unknown, maxLength = 1000) => {
	const text = cleanText(value, maxLength);
	return text || null;
};

const toInteger = (value: unknown) => {
	if (typeof value === 'number' && Number.isInteger(value)) return value;
	const parsed = Number(`${value ?? ''}`.trim());
	return Number.isInteger(parsed) ? parsed : null;
};

const normalizeStatus = (value: unknown): QuranAsbabStatus => {
	const status = `${value ?? ''}`.trim().toLowerCase();
	return ALLOWED_STATUSES.has(status as QuranAsbabStatus) ? (status as QuranAsbabStatus) : 'draft';
};

export async function getAsbabForAyah(
	db: D1Database,
	surahNumber: number,
	ayahNumber: number,
	options: GetAsbabOptions = {}
): Promise<QuranAsbabEntry[]> {
	if (!Number.isInteger(surahNumber) || !Number.isInteger(ayahNumber)) return [];

	const statusSql = options.includeDraft ? '' : "AND e.status = 'published'";

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
					e.ayah_start,
					e.ayah_end,
					e.title,
					e.content,
					e.riwayat,
					e.takhrij,
					e.grade,
					e.page_ref,
					e.status,
					e.verified_by
				FROM quran_asbab_entries e
				JOIN quran_asbab_sources s ON s.source_key = e.source_key
				WHERE e.surah_number = ?
					AND e.ayah_start <= ?
					AND e.ayah_end >= ?
					AND s.is_active = 1
					${statusSql}
				ORDER BY COALESCE(s.priority, 100) ASC, e.ayah_start ASC, e.id ASC`
			)
			.bind(surahNumber, ayahNumber, ayahNumber)
			.all<QuranAsbabEntry>();

		return results ?? [];
	} catch (err) {
		if (isMissingTableError(err)) return [];
		throw err;
	}
}

export async function getAsbabSources(db: D1Database): Promise<QuranAsbabSource[]> {
	try {
		const { results } = await db
			.prepare(
				`SELECT
					id,
					source_key,
					title,
					author,
					publisher,
					language,
					source_type,
					source_url,
					license_note,
					COALESCE(priority, 100) AS priority,
					is_active
				FROM quran_asbab_sources
				WHERE is_active = 1
				ORDER BY COALESCE(priority, 100) ASC, id ASC`
			)
			.all<QuranAsbabSource>();

		return results ?? [];
	} catch (err) {
		if (isMissingTableError(err)) return [];
		throw err;
	}
}

export async function getPublishedAsbabIndex(db: D1Database): Promise<QuranAsbabEntry[]> {
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
					e.ayah_start,
					e.ayah_end,
					e.title,
					e.content,
					e.riwayat,
					e.takhrij,
					e.grade,
					e.page_ref,
					e.status,
					e.verified_by
				FROM quran_asbab_entries e
				JOIN quran_asbab_sources s ON s.source_key = e.source_key
				WHERE e.status = 'published'
					AND s.is_active = 1
				ORDER BY e.surah_number ASC, e.ayah_start ASC, e.ayah_end ASC, COALESCE(s.priority, 100) ASC, e.id ASC`
			)
			.all<QuranAsbabEntry>();

		return results ?? [];
	} catch (err) {
		if (isMissingTableError(err)) return [];
		throw err;
	}
}

export function validateAsbabEntry(input: QuranAsbabEntryInput): QuranAsbabValidationResult {
	const errors: string[] = [];
	const sourceKey = cleanText(input.source_key, 120);
	const surahNumber = toInteger(input.surah_number);
	const ayahStart = toInteger(input.ayah_start);
	const ayahEnd = toInteger(input.ayah_end);
	const content = cleanText(input.content, 20_000);
	const status = normalizeStatus(input.status);

	if (!sourceKey) errors.push('source_key wajib diisi.');
	if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
		errors.push('surah_number wajib angka 1-114.');
	}
	if (!ayahStart || ayahStart < 1) errors.push('ayah_start wajib angka positif.');
	if (!ayahEnd || ayahEnd < 1) errors.push('ayah_end wajib angka positif.');
	if (ayahStart && ayahEnd && ayahEnd < ayahStart) {
		errors.push('ayah_end tidak boleh lebih kecil dari ayah_start.');
	}
	if (!content) errors.push('content wajib diisi.');

	if (errors.length > 0 || !surahNumber || !ayahStart || !ayahEnd) {
		return { ok: false, errors };
	}

	return {
		ok: true,
		value: {
			source_key: sourceKey,
			surah_number: surahNumber,
			ayah_start: ayahStart,
			ayah_end: ayahEnd,
			title: cleanOptionalText(input.title, 240),
			content,
			riwayat: cleanOptionalText(input.riwayat, 20_000),
			takhrij: cleanOptionalText(input.takhrij, 20_000),
			grade: cleanOptionalText(input.grade, 120),
			page_ref: cleanOptionalText(input.page_ref, 120),
			status,
			verified_by: cleanOptionalText(input.verified_by, 160)
		}
	};
}
