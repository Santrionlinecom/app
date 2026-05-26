import type { D1Database } from '@cloudflare/workers-types';
import { ensureHafalanTable } from '$lib/server/hafalan';

export type QuranBookmark = {
	id: string;
	userId: string;
	surahNumber: number;
	ayahNumber: number;
	note: string | null;
	tags: string | null;
	createdAt: string;
	updatedAt: string;
};

export type QuranReadingProgress = {
	id: string;
	userId: string;
	surahNumber: number;
	ayahNumber: number;
	juzNumber: number | null;
	lastReadAt: string;
	createdAt: string;
	updatedAt: string;
};

export type QuranMemorizedAyah = {
	surahNumber: number;
	ayahNumber: number;
	qualityStatus: string | null;
	approvedAt: string | null;
};

const BOOKMARK_SELECT = `
	id,
	user_id as userId,
	surah_number as surahNumber,
	ayah_number as ayahNumber,
	note,
	tags,
	created_at as createdAt,
	updated_at as updatedAt
`;

const PROGRESS_SELECT = `
	id,
	user_id as userId,
	surah_number as surahNumber,
	ayah_number as ayahNumber,
	juz_number as juzNumber,
	last_read_at as lastReadAt,
	created_at as createdAt,
	updated_at as updatedAt
`;

const normalizeVerseNumber = (value: unknown) => {
	const parsed = typeof value === 'number' ? value : Number(`${value ?? ''}`.trim());
	return Number.isInteger(parsed) ? parsed : null;
};

export const isValidQuranVerseRef = (surahNumber: number, ayahNumber: number) =>
	Number.isInteger(surahNumber) &&
	surahNumber >= 1 &&
	surahNumber <= 114 &&
	Number.isInteger(ayahNumber) &&
	ayahNumber >= 1;

export async function ensureQuranUserSchema(db: D1Database) {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS quran_bookmarks (
				id TEXT PRIMARY KEY,
				user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				surah_number INTEGER NOT NULL,
				ayah_number INTEGER NOT NULL,
				note TEXT,
				tags TEXT,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(user_id, surah_number, ayah_number)
			)`
		)
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS quran_reading_progress (
				id TEXT PRIMARY KEY,
				user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				surah_number INTEGER NOT NULL,
				ayah_number INTEGER NOT NULL,
				juz_number INTEGER,
				last_read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				UNIQUE(user_id)
			)`
		)
		.run();

	await db.prepare('CREATE INDEX IF NOT EXISTS idx_quran_bookmarks_user ON quran_bookmarks(user_id)').run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_quran_bookmarks_lookup ON quran_bookmarks(user_id, surah_number, ayah_number)')
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_quran_reading_progress_user ON quran_reading_progress(user_id)')
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_quran_reading_progress_last_read ON quran_reading_progress(last_read_at)')
		.run();
}

export async function getQuranBookmark(
	db: D1Database,
	userId: string,
	surahNumber: number,
	ayahNumber: number
): Promise<QuranBookmark | null> {
	await ensureQuranUserSchema(db);
	if (!isValidQuranVerseRef(surahNumber, ayahNumber)) return null;

	const row = await db
		.prepare(
			`SELECT ${BOOKMARK_SELECT}
			FROM quran_bookmarks
			WHERE user_id = ?
				AND surah_number = ?
				AND ayah_number = ?
			LIMIT 1`
		)
		.bind(userId, surahNumber, ayahNumber)
		.first<QuranBookmark>();

	return row ?? null;
}

export async function addQuranBookmark(
	db: D1Database,
	userId: string,
	surahNumber: number,
	ayahNumber: number
): Promise<QuranBookmark | null> {
	await ensureQuranUserSchema(db);
	if (!isValidQuranVerseRef(surahNumber, ayahNumber)) return null;

	await db
		.prepare(
			`INSERT INTO quran_bookmarks (
				id,
				user_id,
				surah_number,
				ayah_number,
				note,
				tags
			) VALUES (?, ?, ?, ?, NULL, NULL)
			ON CONFLICT(user_id, surah_number, ayah_number) DO UPDATE SET
				updated_at = CURRENT_TIMESTAMP`
		)
		.bind(crypto.randomUUID(), userId, surahNumber, ayahNumber)
		.run();

	return await getQuranBookmark(db, userId, surahNumber, ayahNumber);
}

export async function removeQuranBookmark(
	db: D1Database,
	userId: string,
	surahNumber: number,
	ayahNumber: number
) {
	await ensureQuranUserSchema(db);
	if (!isValidQuranVerseRef(surahNumber, ayahNumber)) return false;

	const result = await db
		.prepare(
			`DELETE FROM quran_bookmarks
			WHERE user_id = ?
				AND surah_number = ?
				AND ayah_number = ?`
		)
		.bind(userId, surahNumber, ayahNumber)
		.run();

	return Number(result.meta?.changes ?? 0) > 0;
}

export async function saveQuranReadingProgress(
	db: D1Database,
	userId: string,
	surahNumber: number,
	ayahNumber: number,
	juzNumber?: number | null
): Promise<QuranReadingProgress | null> {
	await ensureQuranUserSchema(db);
	if (!isValidQuranVerseRef(surahNumber, ayahNumber)) return null;

	const normalizedJuz = normalizeVerseNumber(juzNumber);
	const safeJuz = normalizedJuz && normalizedJuz >= 1 && normalizedJuz <= 30 ? normalizedJuz : null;

	await db
		.prepare(
			`INSERT INTO quran_reading_progress (
				id,
				user_id,
				surah_number,
				ayah_number,
				juz_number
			) VALUES (?, ?, ?, ?, ?)
			ON CONFLICT(user_id) DO UPDATE SET
				surah_number = excluded.surah_number,
				ayah_number = excluded.ayah_number,
				juz_number = excluded.juz_number,
				last_read_at = CURRENT_TIMESTAMP,
				updated_at = CURRENT_TIMESTAMP`
		)
		.bind(crypto.randomUUID(), userId, surahNumber, ayahNumber, safeJuz)
		.run();

	return await getQuranReadingProgress(db, userId);
}

export async function getQuranReadingProgress(
	db: D1Database,
	userId: string
): Promise<QuranReadingProgress | null> {
	await ensureQuranUserSchema(db);
	const row = await db
		.prepare(
			`SELECT ${PROGRESS_SELECT}
			FROM quran_reading_progress
			WHERE user_id = ?
			LIMIT 1`
		)
		.bind(userId)
		.first<QuranReadingProgress>();

	return row ?? null;
}

export async function getQuranMemorizedAyahs(
	db: D1Database,
	userId: string
): Promise<QuranMemorizedAyah[]> {
	await ensureHafalanTable(db);

	const { results } = await db
		.prepare(
			`SELECT surah_number as surahNumber,
			        ayah_number as ayahNumber,
			        quality_status as qualityStatus,
			        tanggal_approve as approvedAt
			 FROM hafalan_progress
			 WHERE user_id = ?
			   AND status IN ('disetujui', 'approved')
			 ORDER BY surah_number ASC, ayah_number ASC`
		)
		.bind(userId)
		.all<QuranMemorizedAyah>();

	return (results ?? []) as QuranMemorizedAyah[];
}
