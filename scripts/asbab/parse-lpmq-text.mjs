#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_INPUT = 'data/asbab/raw/lpmq-asbabun-nuzul.txt';
const DEFAULT_OUTPUT = 'data/asbab/asbab-lpmq-draft.json';
const SOURCE_KEY = 'lpmq_asbabun_nuzul';
const MIN_CONTENT_LENGTH = 20;
const DUPLICATE_HEADING_MAX_DISTANCE = 80;
const SPLIT_NUMBER_LOOKBACK = 20;
const PREVIEW_LENGTH = 900;

const BIDI_CONTROL_RE = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
const SPACE_RE = /[\t\v\f\r \u00a0\u1680\u180e\u2000-\u200b\u202f\u205f\u3000]+/g;
const ARABIC_OR_QURAN_GLYPH_RE =
	/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/u;
const HEADING_RE =
	/^\s*(\d{1,3})\.\s+(.+?)\/\s*(\d{1,3})\s*:\s*(\d{1,3})(?:\s*([-–−])\s*(\d{1,3}))?\s*$/u;
const MAIN_START_RE = /^\s*1\.\s+al-Baqarah\/2\s*:\s*62\s*$/u;
const ASBAB_HEADER_RE = /^ASB[ÀA]BUN[-\s]?NUZ[ÙU]L(?:\s+(?:[IVXLCDM]+|\d+))?$/iu;
const CONCEPT_HEADER_RE = /^(?:\d+\s+)?KONSEP DAN TEORI ASB[ÀA]BUN[-\s]?NUZ[ÙU]L$/iu;
const SEBAB_HEADING_RE = /^Sebab Nuzul$/iu;
const GRADE_PREFIX_RE = /^(?:\d+\s*)?(Hasan|Sahih|Daif|Dhaif|Lemah)\s*[;,:]\s*/iu;
const TAKHRIJ_START_RE =
	/^(?:\d+\s*)?(?:(?:Hasan|Sahih|Daif|Dhaif|Lemah)\s*[;,:]\s*)?(?:diriwayatkan oleh|disebutkan oleh|lihat:|lihat pula:|hadis ini|sanad|riwayat ini)\b/iu;
const BIBLIOGRAPHIC_RE = /\b(?:hlm\.|hadis nomor|juz\s+\d+|cet\.|Dàr|Maktabah)\b/iu;
const BIBLIOGRAPHIC_START_RE =
	/^(?:[A-ZÀ-Þ][A-Za-zÀ-ÿ‘’'`-]+|al-[A-Za-zÀ-ÿ‘’'`-]+|aí-[A-Za-zÀ-ÿ‘’'`-]+|as-[A-Za-zÀ-ÿ‘’'`-]+|at-[A-Za-zÀ-ÿ‘’'`-]+|Ibnu\s+[A-ZÀ-Þ][A-Za-zÀ-ÿ‘’'`-]+),\s+(?:Jàmi|Tafsìr|Sunan|Ëaëìë|al-|as-|ad-|aê-|juz|hlm\.)/iu;

const usage = `SantriOnline LPMQ Asbabun Nuzul text parser

Usage:
  node scripts/asbab/parse-lpmq-text.mjs [options]

Options:
  --input, -i          Input TXT path. Default: ${DEFAULT_INPUT}
  --output, -o         Output JSON path. Default: ${DEFAULT_OUTPUT}
  --clean-indonesian   Clean output for UI by removing broken Arabic/glyph PDF blocks. Default.
  --raw                Keep previous broad content extraction mode.
  --help, -h           Show this help.
`;

const expandUserPath = (value) => {
	if (!value) return value;
	if (value === '~') return os.homedir();
	if (value.startsWith('~/')) return path.join(os.homedir(), value.slice(2));
	return value;
};

const resolvePath = (value) => path.resolve(process.cwd(), expandUserPath(value));

const parseArgs = (argv) => {
	const args = {};

	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index];
		if (!token.startsWith('-')) continue;

		const normalized = token.replace(/^--?/, '');
		if (normalized === 'h' || normalized === 'help') {
			args.help = true;
			continue;
		}
		if (normalized === 'clean-indonesian') {
			args.cleanIndonesian = true;
			continue;
		}
		if (normalized === 'raw') {
			args.raw = true;
			continue;
		}

		const [rawKey, inlineValue] = normalized.split(/=(.*)/s, 2);
		const key = rawKey === 'i' ? 'input' : rawKey === 'o' ? 'output' : rawKey;
		const value = inlineValue ?? argv[index + 1];
		if (inlineValue === undefined) index += 1;
		args[key] = value;
	}

	return args;
};

const normalizeLineForMatch = (line) => line.replace(BIDI_CONTROL_RE, '').replace(SPACE_RE, ' ').trim();

const normalizeContentLine = (line) => normalizeLineForMatch(line);

const buildTitle = (surahName, surahNumber, ayahStart, ayahEnd) => {
	const range = ayahStart === ayahEnd ? `${ayahStart}` : `${ayahStart}-${ayahEnd}`;
	return `${surahName}/${surahNumber}: ${range}`;
};

const parseHeading = (line, lineIndex) => {
	const normalized = normalizeLineForMatch(line);
	const match = normalized.match(HEADING_RE);
	if (!match) return null;

	const rawEntryNumber = Number(match[1]);
	const surahName = match[2].trim();
	const surahNumber = Number(match[3]);
	const ayahStart = Number(match[4]);
	const ayahEnd = Number(match[6] ?? match[4]);

	return {
		lineIndex,
		lineNumber: lineIndex + 1,
		rawEntryNumber,
		entryNumber: rawEntryNumber,
		surahName,
		surahNumber,
		ayahStart,
		ayahEnd,
		title: buildTitle(surahName, surahNumber, ayahStart, ayahEnd),
		normalizedHeading: normalized,
		correctedEntryNumber: null
	};
};

const sameVerseHeading = (left, right) =>
	left.surahName === right.surahName &&
	left.surahNumber === right.surahNumber &&
	left.ayahStart === right.ayahStart &&
	left.ayahEnd === right.ayahEnd;

const findSplitNumberPrefix = (lines, candidate, expectedEntryNumber) => {
	const rawText = String(candidate.rawEntryNumber);
	const expectedText = String(expectedEntryNumber);
	if (!expectedText.endsWith(rawText)) return null;

	const expectedPrefix = expectedText.slice(0, -rawText.length);
	if (!expectedPrefix) return null;

	for (let offset = 1; offset <= SPLIT_NUMBER_LOOKBACK; offset += 1) {
		const lineIndex = candidate.lineIndex - offset;
		if (lineIndex < 0) break;

		const line = normalizeLineForMatch(lines[lineIndex]);
		if (line === expectedPrefix) {
			return {
				prefix: expectedPrefix,
				lineNumber: lineIndex + 1
			};
		}
	}

	return null;
};

const isMostlyUppercase = (line) => line === line.toLocaleUpperCase('id-ID');

const isRunningHeaderOrFooter = (line) => {
	if (!line) return false;
	if (/^\d{1,3}$/.test(line)) return true;
	if (ASBAB_HEADER_RE.test(line)) return true;
	if (CONCEPT_HEADER_RE.test(line)) return true;
	if (/^(?:\d+\s+)?SURAH\s*/iu.test(line) && isMostlyUppercase(line)) return true;
	return false;
};

const isDuplicateHeadingLine = (line) => Boolean(normalizeLineForMatch(line).match(HEADING_RE));

const isSebabHeading = (line) => SEBAB_HEADING_RE.test(line);

const isArabicOrGlyphLine = (line) => {
	const compact = line.replace(/\s+/g, '');
	if (!compact || !ARABIC_OR_QURAN_GLYPH_RE.test(compact)) return false;

	return true;
};

const compactLines = (lines) => {
	const compacted = [];

	for (const line of lines) {
		if (!line) {
			if (compacted.length > 0 && compacted.at(-1) !== '') {
				compacted.push('');
			}
			continue;
		}

		compacted.push(line);
	}

	while (compacted[0] === '') compacted.shift();
	while (compacted.at(-1) === '') compacted.pop();

	return compacted;
};

const normalizeContentLines = (rawLines) => {
	const cleanedLines = [];

	for (const rawLine of rawLines) {
		const line = normalizeContentLine(rawLine);
		if (isRunningHeaderOrFooter(line)) continue;
		if (isDuplicateHeadingLine(line)) continue;
		cleanedLines.push(line);
	}

	return compactLines(cleanedLines);
};

const isTakhrijStartLine = (line) => TAKHRIJ_START_RE.test(line.replace(/^\d+\s+/, '').trim());

const splitParagraphs = (lines) => {
	const paragraphs = [];
	let current = [];

	const flush = () => {
		if (current.length > 0) {
			paragraphs.push(current);
			current = [];
		}
	};

	for (const line of compactLines(lines)) {
		if (!line) {
			flush();
			continue;
		}

		if (isSebabHeading(line)) {
			flush();
			paragraphs.push([line]);
			continue;
		}
		if (isTakhrijStartLine(line)) {
			flush();
			current.push(line);
			continue;
		}

		current.push(line);
	}

	flush();
	return paragraphs;
};

const rewrapParagraph = (paragraphLines) =>
	paragraphLines.reduce((text, line) => {
		if (!text) return line;
		if (text.endsWith('-')) {
			const firstChar = line[0] ?? '';
			return /\p{Ll}/u.test(firstChar) ? `${text.slice(0, -1)}${line}` : `${text}${line}`;
		}
		return `${text} ${line}`;
	}, '');

const buildTextFromLines = (lines) => splitParagraphs(lines).map(rewrapParagraph).join('\n\n').trim();

const cleanRawContent = (rawLines) => buildTextFromLines(normalizeContentLines(rawLines));

const isTakhrijParagraph = (paragraphLines) => {
	const text = rewrapParagraph(paragraphLines).replace(/^\d+\s+/, '').trim();
	if (isTakhrijStartLine(text)) return true;
	if (BIBLIOGRAPHIC_RE.test(text) && BIBLIOGRAPHIC_START_RE.test(text)) return true;
	return false;
};

const extractGrade = (text) => {
	const match = text.match(GRADE_PREFIX_RE);
	if (!match) return '';

	const grade = match[1].toLowerCase();
	if (grade === 'sahih') return 'Sahih';
	if (grade === 'hasan') return 'Hasan';
	if (grade === 'daif' || grade === 'dhaif' || grade === 'lemah') return 'Daif';
	return match[1];
};

const capitalizeFirst = (text) => text.replace(/^\p{Ll}/u, (char) => char.toLocaleUpperCase('id-ID'));

const stripTakhrijGradePrefix = (text) => capitalizeFirst(text.replace(GRADE_PREFIX_RE, '').trim());

const uniqueTexts = (items) => {
	const seen = new Set();
	const unique = [];

	for (const item of items) {
		const key = item.replace(/\s+/g, ' ').trim();
		if (!key || seen.has(key)) continue;
		seen.add(key);
		unique.push(item);
	}

	return unique;
};

const cleanIndonesianContent = (rawLines) => {
	const normalizedLines = normalizeContentLines(rawLines);
	const beforeContent = cleanRawContent(rawLines);
	const withoutArabicLines = [];
	let arabGlyphLinesRemoved = 0;

	for (const line of normalizedLines) {
		if (line && isArabicOrGlyphLine(line)) {
			arabGlyphLinesRemoved += 1;
			if (withoutArabicLines.at(-1) !== '') withoutArabicLines.push('');
			continue;
		}

		if (!line) {
			if (withoutArabicLines.length > 0 && withoutArabicLines.at(-1) !== '') withoutArabicLines.push('');
			continue;
		}

		withoutArabicLines.push(line);
	}

	const compactedLines = compactLines(withoutArabicLines);
	const sebabIndex = compactedLines.findIndex(isSebabHeading);
	const usedSebabHeading = sebabIndex !== -1;
	const scopedLines = usedSebabHeading ? compactedLines.slice(sebabIndex) : compactedLines;
	const takhrijParagraphs = uniqueTexts(
		splitParagraphs(compactedLines).filter(isTakhrijParagraph).map(rewrapParagraph)
	);
	const grade = takhrijParagraphs.map(extractGrade).find(Boolean) ?? '';
	const takhrij = takhrijParagraphs.map(stripTakhrijGradePrefix).filter(Boolean).join('\n\n');
	const content = splitParagraphs(scopedLines)
		.filter((paragraph) => !isTakhrijParagraph(paragraph))
		.map(rewrapParagraph)
		.join('\n\n')
		.trim();

	return {
		content,
		takhrij,
		grade,
		usedSebabHeading,
		arabGlyphLinesRemoved,
		beforeContent
	};
};

const cleanContent = (rawLines, { cleanIndonesian }) => {
	if (cleanIndonesian) return cleanIndonesianContent(rawLines);

	return {
		content: cleanRawContent(rawLines),
		takhrij: '',
		grade: '',
		usedSebabHeading: false,
		arabGlyphLinesRemoved: 0,
		beforeContent: ''
	};
};

const validateEntry = (entry, candidate) => {
	const errors = [];

	if (!Number.isInteger(entry.surah_number) || entry.surah_number < 1 || entry.surah_number > 114) {
		errors.push('surah_number harus 1 sampai 114');
	}
	if (!Number.isInteger(entry.ayah_start) || entry.ayah_start < 1) {
		errors.push('ayah_start minimal 1');
	}
	if (!Number.isInteger(entry.ayah_end) || entry.ayah_end < entry.ayah_start) {
		errors.push('ayah_end minimal ayah_start');
	}
	if (!entry.content || entry.content.length < MIN_CONTENT_LENGTH) {
		errors.push(`content minimal ${MIN_CONTENT_LENGTH} karakter`);
	}

	return {
		ok: errors.length === 0,
		skip: {
			line: candidate.lineNumber,
			entry_number: candidate.entryNumber,
			title: candidate.title,
			errors
		}
	};
};

const findHeadingCandidates = (lines) => {
	const startIndex = lines.findIndex((line) => MAIN_START_RE.test(normalizeLineForMatch(line)));
	if (startIndex === -1) {
		throw new Error('Awal daftar entry utama tidak ditemukan: 1. al-Baqarah/2: 62');
	}

	const candidates = [];
	for (let index = startIndex; index < lines.length; index += 1) {
		const candidate = parseHeading(lines[index], index);
		if (candidate) candidates.push(candidate);
	}

	return { startIndex, candidates };
};

const removeDuplicateHeadings = (candidates) => {
	const filtered = [];
	const skipped = [];

	for (let index = 0; index < candidates.length; index += 1) {
		const candidate = candidates[index];
		const nextDuplicate = candidates
			.slice(index + 1, index + 4)
			.find(
				(next) =>
					sameVerseHeading(candidate, next) &&
					next.lineIndex - candidate.lineIndex <= DUPLICATE_HEADING_MAX_DISTANCE
			);

		if (nextDuplicate) {
			skipped.push({
				line: candidate.lineNumber,
				title: candidate.normalizedHeading,
				replaced_by_line: nextDuplicate.lineNumber
			});
			continue;
		}

		filtered.push(candidate);
	}

	return { filtered, skipped };
};

const normalizeEntryNumbers = (lines, candidates) => {
	const corrections = [];
	const warnings = [];

	for (const [index, candidate] of candidates.entries()) {
		const expectedEntryNumber = index === 0 ? 1 : candidates[index - 1].entryNumber + 1;
		if (candidate.entryNumber === expectedEntryNumber) continue;

		const splitPrefix = findSplitNumberPrefix(lines, candidate, expectedEntryNumber);
		if (splitPrefix) {
			candidate.correctedEntryNumber = {
				from: candidate.rawEntryNumber,
				to: expectedEntryNumber,
				prefix: splitPrefix.prefix,
				prefixLine: splitPrefix.lineNumber
			};
			candidate.entryNumber = expectedEntryNumber;
			corrections.push({
				line: candidate.lineNumber,
				title: candidate.title,
				from: candidate.rawEntryNumber,
				to: expectedEntryNumber,
				prefix_line: splitPrefix.lineNumber
			});
			continue;
		}

		warnings.push({
			line: candidate.lineNumber,
			title: candidate.normalizedHeading,
			expected: expectedEntryNumber,
			found: candidate.rawEntryNumber
		});
	}

	return { corrections, warnings };
};

const createPreview = (text) => {
	const normalized = text.replace(/\s+/g, ' ').trim();
	return normalized.length > PREVIEW_LENGTH ? `${normalized.slice(0, PREVIEW_LENGTH)}...` : normalized;
};

const contentHasArabicGlyph = (content) => ARABIC_OR_QURAN_GLYPH_RE.test(content);

const buildEntries = (lines, candidates, options) => {
	const entries = [];
	const skipped = [];
	const stats = {
		contentUsingSebabHeading: 0,
		arabGlyphLinesRemoved: 0,
		takhrijMoved: 0,
		gradeExtracted: 0,
		contentWithArabicGlyph: 0,
		baqarah142Preview: null
	};

	for (const [index, candidate] of candidates.entries()) {
		const next = candidates[index + 1];
		const contentLines = lines.slice(candidate.lineIndex + 1, next?.lineIndex ?? lines.length);
		const cleanResult = cleanContent(contentLines, options);
		stats.arabGlyphLinesRemoved += cleanResult.arabGlyphLinesRemoved;
		if (cleanResult.usedSebabHeading) stats.contentUsingSebabHeading += 1;
		if (cleanResult.takhrij) stats.takhrijMoved += 1;
		if (cleanResult.grade) stats.gradeExtracted += 1;
		if (contentHasArabicGlyph(cleanResult.content)) stats.contentWithArabicGlyph += 1;

		const entry = {
			source_key: SOURCE_KEY,
			surah_number: candidate.surahNumber,
			ayah_start: candidate.ayahStart,
			ayah_end: candidate.ayahEnd,
			title: candidate.title,
			content: cleanResult.content,
			riwayat: '',
			takhrij: cleanResult.takhrij,
			grade: cleanResult.grade,
			page_ref: '',
			status: 'draft'
		};

		if (candidate.surahNumber === 2 && candidate.ayahStart === 142 && candidate.ayahEnd === 142) {
			stats.baqarah142Preview = {
				before: createPreview(cleanResult.beforeContent || cleanRawContent(contentLines)),
				after: createPreview(cleanResult.content),
				grade: entry.grade,
				takhrij: createPreview(entry.takhrij)
			};
		}

		const validation = validateEntry(entry, candidate);
		if (validation.ok) {
			entries.push(entry);
		} else {
			skipped.push(validation.skip);
		}
	}

	return { entries, skipped, stats };
};

const printSummary = ({
	inputPath,
	outputPath,
	startLine,
	headingCandidateCount,
	duplicateHeadingSkips,
	corrections,
	sequenceWarnings,
	entries,
	skippedEntries,
	stats,
	cleanIndonesian
}) => {
	console.log('SantriOnline LPMQ Asbabun Nuzul parser');
	console.log(`Input: ${path.relative(process.cwd(), inputPath)}`);
	console.log(`Output: ${path.relative(process.cwd(), outputPath)}`);
	console.log(`Mode clean Indonesian: ${cleanIndonesian ? 'aktif' : 'nonaktif'}`);
	console.log(`Mulai parsing dari line: ${startLine}`);
	console.log(`Heading kandidat: ${headingCandidateCount}`);
	console.log(`Heading duplikat diskip: ${duplicateHeadingSkips.length}`);
	console.log(`Entry berhasil diparse: ${entries.length}`);
	console.log(`Entry diskip validasi: ${skippedEntries.length}`);
	console.log(`Content memakai heading "Sebab Nuzul": ${stats.contentUsingSebabHeading}`);
	console.log(`Baris Arab/glyph dibuang: ${stats.arabGlyphLinesRemoved}`);
	console.log(`Entry dengan takhrij terisi: ${stats.takhrijMoved}`);
	console.log(`Entry dengan grade terisi: ${stats.gradeExtracted}`);
	console.log(`Entry content masih mengandung Arab/glyph: ${stats.contentWithArabicGlyph}`);

	if (corrections.length > 0) {
		console.log('\nKoreksi nomor entry hasil ekstraksi:');
		for (const correction of corrections) {
			console.log(
				`- line ${correction.line}: ${correction.title} (${correction.from} -> ${correction.to}, prefix line ${correction.prefix_line})`
			);
		}
	}

	if (sequenceWarnings.length > 0) {
		console.log('\nPeringatan urutan entry:');
		for (const warning of sequenceWarnings) {
			console.log(
				`- line ${warning.line}: expected ${warning.expected}, found ${warning.found} (${warning.title})`
			);
		}
	}

	if (skippedEntries.length > 0) {
		console.log('\nEntry diskip:');
		for (const skipped of skippedEntries) {
			console.log(`- line ${skipped.line}: ${skipped.title} (${skipped.errors.join('; ')})`);
		}
	}

	if (stats.baqarah142Preview) {
		console.log('\nPreview al-Baqarah/2: 142 sebelum cleaning:');
		console.log(stats.baqarah142Preview.before);
		console.log('\nPreview al-Baqarah/2: 142 sesudah cleaning:');
		console.log(stats.baqarah142Preview.after);
		if (stats.baqarah142Preview.grade) {
			console.log(`\nGrade al-Baqarah/2: 142: ${stats.baqarah142Preview.grade}`);
		}
		if (stats.baqarah142Preview.takhrij) {
			console.log('\nTakhrij al-Baqarah/2: 142:');
			console.log(stats.baqarah142Preview.takhrij);
		}
	}

	console.log('\nContoh 5 entry pertama:');
	for (const entry of entries.slice(0, 5)) {
		console.log(
			`- ${entry.title} | surah=${entry.surah_number}, ayah=${entry.ayah_start}-${entry.ayah_end}, chars=${entry.content.length}, status=${entry.status}`
		);
	}
};

const main = async () => {
	const args = parseArgs(process.argv.slice(2));
	if (args.help) {
		console.log(usage);
		return;
	}

	const inputPath = resolvePath(args.input ?? DEFAULT_INPUT);
	const outputPath = resolvePath(args.output ?? DEFAULT_OUTPUT);
	const cleanIndonesian = args.raw ? false : true;
	const raw = await readFile(inputPath, 'utf8');
	const lines = raw.split(/\r?\n/);
	const { startIndex, candidates } = findHeadingCandidates(lines);
	const { filtered, skipped: duplicateHeadingSkips } = removeDuplicateHeadings(candidates);
	const { corrections, warnings: sequenceWarnings } = normalizeEntryNumbers(lines, filtered);
	const { entries, skipped: skippedEntries, stats } = buildEntries(lines, filtered, { cleanIndonesian });

	await mkdir(path.dirname(outputPath), { recursive: true });
	await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');

	printSummary({
		inputPath,
		outputPath,
		startLine: startIndex + 1,
		headingCandidateCount: candidates.length,
		duplicateHeadingSkips,
		corrections,
		sequenceWarnings,
		entries,
		skippedEntries,
		stats,
		cleanIndonesian
	});
};

main().catch((err) => {
	console.error(err?.message || err);
	process.exitCode = 1;
});
