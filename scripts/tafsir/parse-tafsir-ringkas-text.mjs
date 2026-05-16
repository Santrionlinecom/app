#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SOURCE_KEY = 'kemenag_tafsir_ringkas';
const OUTPUT_FILE = 'data/tafsir/tafsir-kemenag-draft.json';
const SURAH_DATA_FILE = 'src/lib/surah-data.ts';

const RAW_FILES = [
	{
		path: 'data/tafsir/raw/TAFSIR RINGKAS JILID 1.1_djvu.txt',
		label: 'Jilid 1.1',
		minLine: 2500,
		initialSurah: 1,
		initialPreviousAyah: 0
	},
	{
		path: 'data/tafsir/raw/TAFSIR RINGKAS JILID 1.2_djvu.txt',
		label: 'Jilid 1.2',
		minLine: 0,
		initialSurah: 6,
		initialPreviousAyah: 152
	},
	{
		path: 'data/tafsir/raw/TAFSIR RINGKAS JILID 2.1_djvu.txt',
		label: 'Jilid 2.1',
		minLine: 1908,
		initialSurah: 18,
		initialPreviousAyah: 74
	},
	{
		path: 'data/tafsir/raw/TAFSIR RINGKAS JILID 2.2_djvu.txt',
		label: 'Jilid 2.2',
		minLine: 0,
		initialSurah: 39,
		initialPreviousAyah: 68
	}
];

const EXTRA_SURAH_ALIASES = new Map(
	Object.entries({
		ALBAGARAH: 2,
		ALMAIDAH: 5,
		ALMATIDAH: 5,
		ALFURQAN: 25,
		ALFUROAN: 25,
		ASYSYUARA: 26,
		ASSYUARA: 26,
		ALQASAS: 28,
		ALGASAS: 28,
		ASSAFFAT: 37,
		AZZARIYAT: 51,
		ADZDZARIYAT: 51,
		OAF: 50,
		QAF: 50,
		ALQALAM: 68,
		ALHAQQAH: 69,
		ALHAOGAH: 69,
		ALQIYAMAH: 75,
		ALGIYAMAH: 75,
		ANNAZIAT: 79,
		ANNAZTAT: 79,
		ABASA: 80,
		ALINSYIQAQ: 84,
		ALINSYIGAD: 84,
		ATTARIQ: 86,
		ATTARIO: 86,
		ALALA: 87,
		ALALAQ: 96,
		ALGADR: 97,
		ALQADR: 97,
		ALADIYAT: 100,
		ALQARIAH: 101,
		ALGARIAH: 101,
		ALGURAISY: 106,
		QURAISY: 106,
		ALKAUTSAR: 108,
		ALKAUSAR: 108,
		ALMASAD: 111,
		ALLAHAB: 111,
		ALFALAG: 113
	})
);

const COMMON_INDONESIAN_WORDS = new Set([
	'ada',
	'adalah',
	'agar',
	'akan',
	'allah',
	'ayat',
	'bagi',
	'bahwa',
	'baik',
	'beriman',
	'berkata',
	'dalam',
	'dan',
	'dengan',
	'dia',
	'ini',
	'itu',
	'kami',
	'karena',
	'kepada',
	'ketika',
	'maka',
	'manusia',
	'mereka',
	'muhammad',
	'nabi',
	'orang',
	'pada',
	'para',
	'salah',
	'sebagai',
	'sebab',
	'secara',
	'sedang',
	'sehingga',
	'sesungguhnya',
	'surah',
	'telah',
	'tidak',
	'tuhan',
	'untuk',
	'wahai',
	'yang'
]);

const normalizeSpaces = (value) =>
	value
		.replace(/\u00a0/g, ' ')
		.replace(/[ \t]+/g, ' ')
		.trim();

const normalizeSurahKey = (value) =>
	normalizeSpaces(value)
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toUpperCase()
		.replace(/[‘’`"]/g, '')
		.replace(/9/g, 'Q')
		.replace(/@/g, 'H')
		.replace(/[^A-Z0-9]+/g, '');

const loadSurahData = async () => {
	const raw = await readFile(path.resolve(process.cwd(), SURAH_DATA_FILE), 'utf8');
	const matches = raw.matchAll(
		/\{\s*number:\s*(\d+),\s*name:\s*(['"])((?:\\.|(?!\2).)*?)\2,\s*totalAyah:\s*(\d+)\s*\}/g
	);
	const surahs = [];

	for (const match of matches) {
		surahs.push({
			number: Number(match[1]),
			name: match[3].replace(/\\'/g, "'").replace(/\\"/g, '"'),
			totalAyah: Number(match[4])
		});
	}

	if (surahs.length !== 114) {
		throw new Error(`Metadata surah tidak lengkap. Ditemukan ${surahs.length} item.`);
	}

	const byNumber = new Map(surahs.map((surah) => [surah.number, surah]));
	const byName = new Map();
	for (const surah of surahs) {
		byName.set(normalizeSurahKey(surah.name), surah.number);
		byName.set(normalizeSurahKey(surah.name.replace(/^Al-/, '')), surah.number);
	}
	for (const [alias, number] of EXTRA_SURAH_ALIASES.entries()) {
		byName.set(alias, number);
	}

	return { surahs, byNumber, byName };
};

const isArabicOrQuranGlyphLine = (line) => {
	const value = normalizeSpaces(line);
	if (!value) return false;
	const arabicMatches = value.match(/[\u0600-\u06ff\ufb50-\ufdff\ufe70-\ufeff]/g) ?? [];
	if (arabicMatches.length >= 3 && arabicMatches.length / value.length > 0.15) return true;
	if (/[\ufb50-\ufdff\ufe70-\ufeff]/.test(value)) return true;
	return false;
};

const countCommonIndonesianWords = (line) => {
	const words = line.toLowerCase().match(/[a-zà-ÿ]{2,}/g) ?? [];
	return words.filter((word) => COMMON_INDONESIAN_WORDS.has(word)).length;
};

const isLikelyBrokenArabicOcrLine = (line) => {
	const value = normalizeSpaces(line);
	if (!value) return false;
	if (isArabicOrQuranGlyphLine(value)) return true;
	if (countCommonIndonesianWords(value) > 0) return false;

	const tokens = value.split(/\s+/).filter(Boolean);
	if (tokens.length < 2) return false;

	const digitTokens = tokens.filter((token) => /\d/.test(token)).length;
	const shortTokens = tokens.filter((token) => token.length <= 2).length;
	const uppercaseLetters = (value.match(/[A-Z]/g) ?? []).length;
	const lowercaseLetters = (value.match(/[a-zà-ÿ]/g) ?? []).length;
	const oddPunctuation = (value.match(/[=~*_<>|{}[\]\\]/g) ?? []).length;
	const latinWords = value.match(/[A-Za-zÀ-ÿ]{3,}/g) ?? [];
	const wordsWithVowels = latinWords.filter((word) => /[aiueoAIUEO]/.test(word)).length;
	const vowelRatio = latinWords.length ? wordsWithVowels / latinWords.length : 0;

	if (digitTokens >= 2 && shortTokens / tokens.length >= 0.25) return true;
	if (uppercaseLetters > lowercaseLetters * 1.5 && tokens.length >= 3 && value.length < 140) return true;
	if (oddPunctuation >= 2 && value.length < 140) return true;
	if (latinWords.length >= 3 && vowelRatio < 0.45 && value.length < 160) return true;

	return false;
};

const isPageOrFooterLine = (line) => {
	const value = normalizeSpaces(line);
	if (!value) return false;
	if (/^\d{1,4}$/.test(value)) return true;
	if (/^[xivlcdm]{1,8}$/i.test(value)) return true;
	if (/^Tafsir Ringkas\s+\d+$/i.test(value)) return true;
	if (/^\d+\s+Tafsir Ringkas$/i.test(value)) return true;
	if (/^JUZ\s*\d+$/i.test(value)) return true;
	if (/^Kata Pengantar\b/i.test(value)) return true;
	if (/^Ketua Tim Penyusun\b/i.test(value)) return true;
	return false;
};

const detectPageNumber = (line) => {
	const value = normalizeSpaces(line);
	const tafsirMatch = value.match(/^Tafsir Ringkas\s+(\d{1,4})$/i);
	if (tafsirMatch) return Number(tafsirMatch[1]);
	const surahPageMatch = value.match(/^(\d{1,4})\s+Surah\s+[A-Za-z'’ -]+$/i);
	if (surahPageMatch) return Number(surahPageMatch[1]);
	return null;
};

const detectSurahHeader = (line, byName) => {
	const value = normalizeSpaces(line);
	if (!value || value.includes('/')) return null;

	const explicitMatch = value.match(/^SURAH\s+([A-Z0-9'’@ -]+)$/);
	const pageHeaderMatch = value.match(/^\d{1,4}\s+Surah\s+([A-Za-z'’ -]+)$/);
	const match = explicitMatch ?? pageHeaderMatch;
	if (!match) return null;

	const candidate = match[1].replace(/\d+$/, '').trim();
	const number = byName.get(normalizeSurahKey(candidate));
	return number ?? null;
};

const cleanContentLines = (lines, stats) => {
	const cleaned = [];

	for (const rawLine of lines) {
		const line = normalizeSpaces(rawLine);
		if (!line) {
			cleaned.push('');
			continue;
		}
		if (isPageOrFooterLine(line)) continue;
		if (/^(?:\d{1,4}\s+)?Surah\s+[A-Za-z'’ -]+$/i.test(line)) continue;
		if (isArabicOrQuranGlyphLine(line) || isLikelyBrokenArabicOcrLine(line)) {
			stats.removedArabicOrGlyphLines += 1;
			continue;
		}
		cleaned.push(line);
	}

	return cleaned;
};

const normalizeParagraphText = (lines) => {
	const paragraphs = [];
	let current = '';

	const flush = () => {
		const value = current
			.replace(/\s+([,.;:!?])/g, '$1')
			.replace(/\(\s+/g, '(')
			.replace(/\s+\)/g, ')')
			.replace(/\s+/g, ' ')
			.trim();
		if (value) paragraphs.push(value);
		current = '';
	};

	for (const line of lines) {
		if (!line) {
			flush();
			continue;
		}

		if (!current) {
			current = line;
		} else if (current.endsWith('-')) {
			current = `${current.slice(0, -1)}${line}`;
		} else {
			current = `${current} ${line}`;
		}
	}
	flush();

	return paragraphs.join('\n\n').trim();
};

const contentFromLines = (lines, stats) => {
	const cleanedLines = cleanContentLines(lines, stats);
	return normalizeParagraphText(cleanedLines)
		.replace(/\bAl-OGur\b/g, 'Al-Qur')
		.replace(/\bAl-Our\b/g, 'Al-Qur')
		.replace(/\bAl-Gur\b/g, 'Al-Qur')
		.replace(/\bOur'an\b/g, "Qur'an")
		.trim();
};

const buildEntry = (entry, byNumber, stats) => {
	if (!entry) return null;
	const surah = byNumber.get(entry.surahNumber);
	const content = contentFromLines(entry.lines, stats);

	if (
		!surah ||
		entry.surahNumber < 1 ||
		entry.surahNumber > 114 ||
		entry.ayahStart < 1 ||
		entry.ayahEnd < entry.ayahStart ||
		entry.ayahEnd > surah.totalAyah ||
		content.length < 20
	) {
		stats.skipped += 1;
		stats.skippedSamples.push({
			surah_number: entry.surahNumber,
			ayah_number: entry.ayahStart,
			reason: content.length < 20 ? 'content kurang dari 20 karakter' : 'nomor surah/ayat tidak valid'
		});
		return null;
	}

	const results = [];
	for (let ayahNumber = entry.ayahStart; ayahNumber <= entry.ayahEnd; ayahNumber += 1) {
		results.push({
			source_key: SOURCE_KEY,
			surah_number: entry.surahNumber,
			ayah_number: ayahNumber,
			title: `Tafsir ${surah.name} ${ayahNumber}`,
			content,
			summary: '',
			page_ref: entry.pageNumber ? `${entry.fileLabel} hlm ${entry.pageNumber}` : entry.fileLabel,
			status: 'draft'
		});
	}

	return results;
};

const createParserState = (fileConfig) => ({
	currentSurah: fileConfig.initialSurah,
	lastAyah: fileConfig.initialPreviousAyah,
	currentPage: null,
	currentEntry: null,
	started: false
});

const isValidVerseStart = (ayahNumber, state, byNumber) => {
	const surah = byNumber.get(state.currentSurah);
	if (!surah || ayahNumber < 1 || ayahNumber > surah.totalAyah) return false;
	if (ayahNumber === state.lastAyah + 1) return true;
	if (ayahNumber > state.lastAyah) return true;
	return false;
};

const maybeAdvanceSurah = (ayahNumber, state, byNumber) => {
	const current = byNumber.get(state.currentSurah);
	if (!current || ayahNumber !== 1 || state.currentSurah >= 114) return false;
	if (state.lastAyah < current.totalAyah - 10) return false;

	state.currentSurah += 1;
	state.lastAyah = 0;
	return true;
};

const maybeApplySurahHeader = (headerSurah, state, byNumber) => {
	if (!headerSurah || headerSurah === state.currentSurah) return false;
	if (headerSurah < state.currentSurah) return false;

	const current = byNumber.get(state.currentSurah);
	if (!current) return false;
	if (headerSurah === state.currentSurah + 1) {
		state.currentSurah = headerSurah;
		state.lastAyah = 0;
		return true;
	}

	return false;
};

const parseFile = async (fileConfig, surahData, stats) => {
	const raw = await readFile(path.resolve(process.cwd(), fileConfig.path), 'utf8');
	const lines = raw.split(/\r?\n/);
	const state = createParserState(fileConfig);
	const entries = [];

	const finishCurrentEntry = () => {
		const parsed = buildEntry(state.currentEntry, surahData.byNumber, stats);
		if (parsed) entries.push(...parsed);
		state.currentEntry = null;
	};

	for (const [index, rawLine] of lines.entries()) {
		const lineNumber = index + 1;
		if (lineNumber < fileConfig.minLine) continue;

		const line = normalizeSpaces(rawLine);
		const pageNumber = detectPageNumber(line);
		if (pageNumber) state.currentPage = pageNumber;

		const headerSurah = detectSurahHeader(line, surahData.byName);
		if (headerSurah) {
			stats.detectedSurahHeaders += 1;
			if (maybeApplySurahHeader(headerSurah, state, surahData.byNumber)) stats.surahHeaderAdvances += 1;
			continue;
		}

		const verseMatch = line.match(/^(\d{1,3})(?:\s*[-–−]\s*(\d{1,3}))?\.\s*(.*)$/);
		if (verseMatch) {
			const ayahStart = Number(verseMatch[1]);
			const ayahEnd = verseMatch[2] ? Number(verseMatch[2]) : ayahStart;
			const verseIntro = normalizeSpaces(verseMatch[3]);

			if (
				fileConfig.label === 'Jilid 1.1' &&
				state.currentSurah === 2 &&
				state.lastAyah === 7 &&
				ayahStart === 1 &&
				/Alif\s+Lam\s+Mim/i.test(verseIntro)
			) {
				state.lastAyah = 0;
			}

			if (maybeAdvanceSurah(ayahStart, state, surahData.byNumber)) {
				stats.surahAdvances += 1;
			}

			if (ayahEnd >= ayahStart && isValidVerseStart(ayahStart, state, surahData.byNumber)) {
				finishCurrentEntry();
				state.started = true;
				state.lastAyah = ayahEnd;
				state.currentEntry = {
					fileLabel: fileConfig.label,
					pageNumber: state.currentPage,
					surahNumber: state.currentSurah,
					ayahStart,
					ayahEnd,
					lines: verseIntro ? [verseIntro] : []
				};
				continue;
			}

			if (!state.started) {
				stats.ignoredCandidateHeadings += 1;
				continue;
			}
		}

		if (state.currentEntry) {
			state.currentEntry.lines.push(rawLine);
		}
	}

	finishCurrentEntry();
	if (
		fileConfig.label === 'Jilid 1.1' &&
		entries.slice(0, 7).every((entry, index) => entry.surah_number === 2 && entry.ayah_number === index + 1)
	) {
		for (let index = 0; index < 7; index += 1) {
			entries[index] = {
				...entries[index],
				surah_number: 1,
				title: `Tafsir Al-Fatihah ${index + 1}`
			};
		}
	}
	return entries;
};

const dedupeEntries = (entries) => {
	const seen = new Set();
	const output = [];
	for (const entry of entries) {
		const key = `${entry.source_key}:${entry.surah_number}:${entry.ayah_number}`;
		if (seen.has(key)) continue;
		seen.add(key);
		output.push(entry);
	}
	return output;
};

const main = async () => {
	const surahData = await loadSurahData();
	const stats = {
		removedArabicOrGlyphLines: 0,
		detectedSurahHeaders: 0,
		ignoredCandidateHeadings: 0,
		surahAdvances: 0,
		surahHeaderAdvances: 0,
		skipped: 0,
		skippedSamples: []
	};

	const parsedByFile = [];
	const allParsedEntries = [];
	for (const fileConfig of RAW_FILES) {
		const entries = await parseFile(fileConfig, surahData, stats);
		parsedByFile.push({ file: fileConfig.label, count: entries.length });
		allParsedEntries.push(...entries);
		console.log(`${fileConfig.label}: ${entries.length} entry`);
	}

	const allEntries = dedupeEntries(allParsedEntries).sort((a, b) =>
		a.surah_number === b.surah_number ? a.ayah_number - b.ayah_number : a.surah_number - b.surah_number
	);

	await mkdir(path.dirname(path.resolve(process.cwd(), OUTPUT_FILE)), { recursive: true });
	await writeFile(path.resolve(process.cwd(), OUTPUT_FILE), `${JSON.stringify(allEntries, null, 2)}\n`, 'utf8');

	console.log(`Output: ${OUTPUT_FILE}`);
	console.log(`Entry berhasil: ${allEntries.length}`);
	console.log(`Entry diskip: ${stats.skipped}`);
	console.log(`Header surah terdeteksi: ${stats.detectedSurahHeaders}`);
	console.log(`Transisi surah berbasis urutan ayat: ${stats.surahAdvances}`);
	console.log(`Transisi surah berbasis header: ${stats.surahHeaderAdvances}`);
	console.log(`Candidate heading diabaikan: ${stats.ignoredCandidateHeadings}`);
	console.log(`Baris Arab/glyph/OCR rusak dibuang: ${stats.removedArabicOrGlyphLines}`);
	if (stats.skippedSamples.length) {
		console.log(`Contoh skip: ${JSON.stringify(stats.skippedSamples.slice(0, 5), null, 2)}`);
	}
	console.log('Ringkasan file:');
	for (const item of parsedByFile) {
		console.log(`- ${item.file}: ${item.count}`);
	}
};

main().catch((err) => {
	console.error(err?.message || err);
	process.exitCode = 1;
});
