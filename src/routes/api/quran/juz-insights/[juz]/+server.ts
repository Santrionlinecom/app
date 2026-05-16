import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SURAH_DATA } from '$lib/surah-data';
import { requireD1 } from '$lib/server/cloudflare';
import { getTafsirIndonesiaForSurah } from '$lib/server/quran-tafsir-indonesia';
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

const loadTafsirMap = async (db: D1Database, surahNumbers: number[]) => {
	const entries = await Promise.all(
		surahNumbers.map(async (surahNumber) => {
			try {
				const tafsirItems = await getTafsirIndonesiaForSurah(db, surahNumber);
				return tafsirItems.map((item) => [`${surahNumber}:${item.ayah_number}`, item.content] as const);
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

	const ayahPayload = await fetchJson<{ data?: MuslimAyah[] }>(
		fetch,
		`${MUSLIM_QURAN_API}/ayah/juz?id=${juz}`
	).catch(() => {
		throw error(502, 'Gagal memuat data ayat pendukung');
	});

	const ayahRows = ayahPayload.data ?? [];
	const surahNumbers = [
		...new Set(
			ayahRows
				.map((item) => Number(item.surah))
				.filter((surahNumber) => Number.isInteger(surahNumber) && surahNumber >= 1 && surahNumber <= 114)
		)
	];
	const db = requireD1(event);

	const [asbabById, tafsirByVerse] = await Promise.all([
		loadAsbabMap(fetch),
		loadTafsirMap(db, surahNumbers)
	]);

	const verses = ayahRows
		.map((item) => {
			const surahNumber = Number(item.surah);
			const ayahNumber = Number(item.ayah);
			if (!Number.isInteger(surahNumber) || !Number.isInteger(ayahNumber)) return null;

			const verseKey = `${surahNumber}:${ayahNumber}`;
			const asbabId = String(item.asbab ?? '0');

			return {
				verseKey,
				surahNumber,
				ayahNumber,
				surahName: SURAH_DATA.find((surah) => surah.number === surahNumber)?.name ?? `Surah ${surahNumber}`,
				globalId: Number(item.id) || null,
				latin: cleanText(item.latin),
				translation: cleanText(item.text),
				notes: cleanText(item.notes),
				asbabId: asbabId && asbabId !== '0' ? asbabId : null,
				asbab: asbabId && asbabId !== '0' ? asbabById.get(asbabId) ?? '' : '',
				tafsir: tafsirByVerse.get(verseKey) ?? ''
			};
		})
		.filter(Boolean);

	setHeaders({
		'cache-control': 'public, max-age=86400, s-maxage=86400'
	});

	return json({
		juz,
		verses
	});
};
