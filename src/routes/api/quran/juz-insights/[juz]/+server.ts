import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SURAH_DATA } from '$lib/surah-data';
import { requireD1 } from '$lib/server/cloudflare';
import {
	buildTafsirIndonesiaPreview,
	getTafsirIndonesiaForSurah
} from '$lib/server/quran-tafsir-indonesia';
import type { D1Database } from '@cloudflare/workers-types';

type MuslimAyah = {
	id?: string;
	surah?: string;
	ayah?: string;
	latin?: string | null;
	text?: string | null;
	notes?: string | null;
	asbab?: string | null;
};

type MuslimAsbab = {
	id?: string;
	text?: string | null;
};

type LocalJuzVerse = {
	verse_key?: string;
};

type VerseRef = {
	verseKey: string;
	surahNumber: number;
	ayahNumber: number;
};

type AyahMetadata = {
	globalId: number | null;
	latin: string;
	translation: string;
	notes: string;
	asbabId: string | null;
};

const MUSLIM_QURAN_API = 'https://muslim-api-three.vercel.app/v1/quran';

const cleanText = (value: unknown) =>
	String(value ?? '')
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const fetchJson = async <T>(fetcher: typeof fetch, url: string) => {
	const response = await fetcher(url, {
		headers: {
			accept: 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error(`Request failed: ${response.status}`);
	}

	return (await response.json()) as T;
};

const padJuz = (juz: number) => String(juz).padStart(2, '0');

const loadLocalVerseRefs = async (fetcher: typeof fetch, juz: number) => {
	const payload = await fetchJson<{ verses?: LocalJuzVerse[] }>(
		fetcher,
		`/quran/juz-${padJuz(juz)}.json`
	);

	return (payload.verses ?? [])
		.map((item) => {
			const [surahNumber, ayahNumber] = String(item.verse_key ?? '')
				.split(':')
				.map(Number);
			if (!Number.isInteger(surahNumber) || !Number.isInteger(ayahNumber)) return null;
			return {
				verseKey: `${surahNumber}:${ayahNumber}`,
				surahNumber,
				ayahNumber
			};
		})
		.filter((item): item is VerseRef => Boolean(item));
};

const loadAyahMetadataMap = async (fetcher: typeof fetch, juz: number) => {
	try {
		const payload = await fetchJson<{ data?: MuslimAyah[] }>(
			fetcher,
			`${MUSLIM_QURAN_API}/ayah/juz?id=${juz}`
		);

		return new Map<string, AyahMetadata>(
			(payload.data ?? [])
				.flatMap((item): Array<readonly [string, AyahMetadata]> => {
					const surahNumber = Number(item.surah);
					const ayahNumber = Number(item.ayah);
					if (!Number.isInteger(surahNumber) || !Number.isInteger(ayahNumber)) return [];
					const asbabId = String(item.asbab ?? '0');
					return [
						[
							`${surahNumber}:${ayahNumber}`,
							{
								globalId: Number(item.id) || null,
								latin: cleanText(item.latin),
								translation: cleanText(item.text),
								notes: cleanText(item.notes),
								asbabId: asbabId && asbabId !== '0' ? asbabId : null
							}
						]
					];
				})
		);
	} catch {
		return new Map<string, AyahMetadata>();
	}
};

const loadAsbabMap = async (fetcher: typeof fetch) => {
	try {
		const payload = await fetchJson<{ data?: MuslimAsbab[] }>(fetcher, `${MUSLIM_QURAN_API}/asbab`);
		return new Map(
			(payload.data ?? [])
				.map((item) => [String(item.id ?? ''), cleanText(item.text)] as const)
				.filter(([id, text]) => id && text)
		);
	} catch {
		return new Map<string, string>();
	}
};

const loadTafsirMap = async (db: D1Database, surahNumbers: number[], isAuthenticated: boolean) => {
	const entries = await Promise.all(
		surahNumbers.map(async (surahNumber) => {
			try {
				const tafsirItems = await getTafsirIndonesiaForSurah(db, surahNumber, { includeDraft: true });
				return tafsirItems.map((item) => {
					const preview = buildTafsirIndonesiaPreview(item.content);
					return [
						`${surahNumber}:${item.ayah_number}`,
						isAuthenticated ? item.content : preview.content
					] as const;
				});
			} catch {
				return [] as Array<readonly [string, string]>;
			}
		})
	);

	return new Map(entries.flat().filter(([, text]) => text));
};

export const GET: RequestHandler = async (event) => {
	const { params, fetch, setHeaders } = event;
	const juz = Number(params.juz);

	if (!Number.isInteger(juz) || juz < 1 || juz > 30) {
		throw error(400, 'Nomor juz tidak valid');
	}

	const verseRefs = await loadLocalVerseRefs(fetch, juz).catch(() => {
		throw error(502, 'Gagal memuat data ayat lokal');
	});

	if (!verseRefs.length) {
		throw error(502, 'Data ayat lokal belum tersedia');
	}

	const surahNumbers = [
		...new Set(
			verseRefs
				.map((item) => item.surahNumber)
				.filter((surahNumber) => surahNumber >= 1 && surahNumber <= 114)
		)
	];
	const db = requireD1(event);
	const isAuthenticated = Boolean(event.locals.user);

	const [metadataByVerse, asbabById, tafsirByVerse] = await Promise.all([
		loadAyahMetadataMap(fetch, juz),
		loadAsbabMap(fetch),
		loadTafsirMap(db, surahNumbers, isAuthenticated)
	]);

	const verses = verseRefs
		.map((item) => {
			const metadata = metadataByVerse.get(item.verseKey);
			const asbabId = metadata?.asbabId ?? null;

			return {
				verseKey: item.verseKey,
				surahNumber: item.surahNumber,
				ayahNumber: item.ayahNumber,
				surahName:
					SURAH_DATA.find((surah) => surah.number === item.surahNumber)?.name ??
					`Surah ${item.surahNumber}`,
				globalId: metadata?.globalId ?? null,
				latin: metadata?.latin ?? '',
				translation: metadata?.translation ?? '',
				notes: metadata?.notes ?? '',
				asbabId,
				asbab: asbabId ? asbabById.get(asbabId) ?? '' : '',
				tafsir: tafsirByVerse.get(item.verseKey) ?? ''
			};
		})
		.filter(Boolean);

	setHeaders({
		'cache-control': 'private, no-store',
		vary: 'Cookie'
	});

	return json({
		juz,
		isAuthenticated,
		verses
	});
};
