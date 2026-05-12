#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_SOURCE_NOTE =
	'Sumber teks: OpenITI corpus. Perlu verifikasi ulang dengan edisi cetak.';
const MIN_CHUNK_CHARS = 800;
const MAX_CHUNK_CHARS = 1500;

const usage = `OpenITI local parser for SantriOnline Kitab

Usage:
  node scripts/openiti/parse-openiti.mjs --input <file> --output <json> [metadata]
  node scripts/openiti/parse-openiti.mjs --mapping scripts/openiti/openiti-books.sample.json

Required for single-file mode:
  --input, -i       Path to local OpenITI .mARkdown/.txt file
  --output, -o      Output JSON path

Optional metadata:
  --kitabSlug       SantriOnline kitab slug
  --title           Title override
  --author          Author override
  --category        Category label, e.g. "Hadits"
  --madhhab         Madhhab label, e.g. "Syafi'i"
  --madzhab         Alias for --madhhab
  --sourceNote      Source note override
  --mapping, --map  JSON array mapping for batch parsing
  --help, -h        Show this help

Example:
  node scripts/openiti/parse-openiti.mjs \\
    --input ~/datasets/openiti/sample/arbain-nawawi.txt \\
    --output data/kitab/openiti/chunks/arbain-nawawi.openiti.chunks.json \\
    --kitabSlug arbain-nawawi-openiti \\
    --title "Al-Arba'in An-Nawawiyyah" \\
    --author "Imam An-Nawawi" \\
    --category "Hadits" \\
    --madhhab "Syafi'i"
`;

const expandUserPath = (value) => {
	if (!value) return value;
	if (value === '~') return os.homedir();
	if (value.startsWith('~/')) return path.join(os.homedir(), value.slice(2));
	return value;
};

const resolvePath = (value) => path.resolve(process.cwd(), expandUserPath(value));

const slugify = (value) => {
	const ascii = (value ?? '')
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/['’`]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-');
	return ascii || 'kitab-openiti';
};

const parseArgs = (argv) => {
	const args = { _: [] };
	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index];
		if (!token.startsWith('-')) {
			args._.push(token);
			continue;
		}

		const normalized = token.replace(/^--?/, '');
		if (normalized === 'h' || normalized === 'help') {
			args.help = true;
			continue;
		}

		const [rawKey, inlineValue] = normalized.split(/=(.*)/s, 2);
		const key = rawKey === 'i' ? 'input' : rawKey === 'o' ? 'output' : rawKey;
		const value = inlineValue ?? argv[index + 1];
		if (inlineValue === undefined) index += 1;
		args[key] = value;
	}

	if (!args.input && args._[0]) args.input = args._[0];
	if (!args.output && args._[1]) args.output = args._[1];
	if (!args.madhhab && args.madzhab) args.madhhab = args.madzhab;
	if (!args.mapping && args.map) args.mapping = args.map;

	return args;
};

const cleanMetaKey = (value) =>
	value
		.toLowerCase()
		.replace(/^0+\./, '')
		.replace(/[^a-z0-9]+/g, '');

const mergeMetadataLine = (metadata, line) => {
	const content = line.replace(/^#META#\s*/i, '').trim();
	const match = content.match(/^([^:=]+)[:=]\s*(.+)$/);
	if (!match) return;

	const key = cleanMetaKey(match[1]);
	const value = match[2].replace(/\s+/g, ' ').trim();
	if (!value) return;

	if ((key.endsWith('booktitle') || key === 'title' || key === 'book' || key === 'bookname') && !metadata.title) {
		metadata.title = value;
		return;
	}

	if (key.includes('author') && !key.includes('uri') && !metadata.author) {
		metadata.author = value;
		return;
	}

	if ((key.endsWith('bookuri') || key === 'uri' || key === 'bookid') && !metadata.bookId) {
		metadata.bookId = value;
	}
};

const cleanHeadingText = (value) =>
	value
		.replace(/^(AUTO|CHECK)\s+/i, '')
		.replace(/\s+/g, ' ')
		.trim();

const parseHeading = (line) => {
	const match = line.match(/^###\s*(\|{1,3}|\$+)\s*(.*)$/);
	if (!match) return null;

	const marker = match[1];
	const title = cleanHeadingText(match[2]);
	if (!title) return null;

	const depth = marker.startsWith('|') ? marker.length : 2;
	return { depth, title };
};

const cleanTextLine = (line) =>
	line
		.replace(/^~~\s*/, '')
		.replace(/\bPageV\d+P\d+\b/gi, ' ')
		.replace(/\bms\d+[a-z]?\b/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const isIgnoredLine = (line) => {
	const trimmed = line.trim();
	return (
		!trimmed ||
		trimmed.startsWith('######') ||
		trimmed === '###' ||
		trimmed === '#META#Header#End#'
	);
};

const pushParagraph = (units, state) => {
	const text = cleanTextLine(state.paragraph.join(' '));
	state.paragraph = [];
	if (!text) return;
	units.push({
		chapter: state.chapter,
		sectionTitle: state.sectionTitle,
		text
	});
};

const parseOpenitiText = (rawText, inputPath) => {
	const metadata = {};
	const units = [];
	const state = {
		chapter: null,
		sectionTitle: null,
		paragraph: []
	};

	for (const line of rawText.replace(/\r\n/g, '\n').split('\n')) {
		const trimmed = line.trim();

		if (trimmed.startsWith('#META#')) {
			mergeMetadataLine(metadata, trimmed);
			continue;
		}

		const heading = parseHeading(trimmed);
		if (heading) {
			pushParagraph(units, state);
			if (heading.depth === 1) {
				state.chapter = heading.title;
				state.sectionTitle = null;
			} else if (!state.chapter) {
				state.chapter = heading.title;
				state.sectionTitle = null;
			} else {
				state.sectionTitle = heading.title;
			}
			continue;
		}

		if (isIgnoredLine(trimmed)) {
			pushParagraph(units, state);
			continue;
		}

		const cleaned = cleanTextLine(trimmed);
		if (cleaned) state.paragraph.push(cleaned);
	}

	pushParagraph(units, state);
	if (!metadata.bookId) {
		metadata.bookId = path.basename(inputPath).replace(/\.(?:mARkdown|markdown|txt)$/i, '');
	}
	return { metadata, units };
};

const findSplitPoint = (text, minChars = MIN_CHUNK_CHARS, maxChars = MAX_CHUNK_CHARS) => {
	const window = text.slice(minChars, maxChars + 1);
	const sentenceMatches = [...window.matchAll(/[.!?؟؛。]\s+/g)];
	if (sentenceMatches.length > 0) {
		const last = sentenceMatches[sentenceMatches.length - 1];
		return minChars + last.index + last[0].length;
	}

	const commaMatches = [...window.matchAll(/[،,]\s+/g)];
	if (commaMatches.length > 0) {
		const last = commaMatches[commaMatches.length - 1];
		return minChars + last.index + last[0].length;
	}

	const spaceIndex = text.lastIndexOf(' ', maxChars);
	if (spaceIndex >= minChars) return spaceIndex;
	return Math.min(maxChars, text.length);
};

const splitLongText = (text) => {
	const parts = [];
	let remaining = text.trim();

	while (remaining.length > MAX_CHUNK_CHARS) {
		const splitAt = findSplitPoint(remaining);
		const part = remaining.slice(0, splitAt).trim();
		if (part) parts.push(part);
		remaining = remaining.slice(splitAt).trim();
	}

	if (remaining) parts.push(remaining);
	return parts;
};

const chunkUnits = (units) => {
	const chunks = [];
	let active = null;

	const flush = () => {
		if (!active?.text.trim()) return;
		chunks.push({
			chapter: active.chapter,
			sectionTitle: active.sectionTitle,
			text: active.text.trim()
		});
		active = null;
	};

	for (const unit of units) {
		const pieces = splitLongText(unit.text);
		for (const piece of pieces) {
			const sameSection =
				active &&
				active.chapter === unit.chapter &&
				active.sectionTitle === unit.sectionTitle;

			if (!sameSection) flush();

			if (!active) {
				active = {
					chapter: unit.chapter,
					sectionTitle: unit.sectionTitle,
					text: ''
				};
			}

			const nextText = active.text ? `${active.text}\n\n${piece}` : piece;
			if (nextText.length > MAX_CHUNK_CHARS && active.text.length >= MIN_CHUNK_CHARS) {
				flush();
				active = {
					chapter: unit.chapter,
					sectionTitle: unit.sectionTitle,
					text: piece
				};
			} else if (nextText.length > MAX_CHUNK_CHARS && active.text) {
				flush();
				active = {
					chapter: unit.chapter,
					sectionTitle: unit.sectionTitle,
					text: piece
				};
			} else {
				active.text = nextText;
			}
		}
	}

	flush();
	return chunks;
};

const sourceRefFor = ({ title, chapter, sectionTitle, chunkIndex }) => {
	const parts = [title];
	if (chapter) parts.push(chapter);
	if (sectionTitle && sectionTitle !== chapter) parts.push(sectionTitle);
	parts.push(`chunk ${chunkIndex}`);
	return parts.filter(Boolean).join(', ');
};

const buildOutputRows = ({ chunks, options, metadata, inputPath }) => {
	const title = options.title || metadata.title || path.basename(inputPath, path.extname(inputPath));
	const author = options.author || metadata.author || 'Belum diketahui';
	const kitabSlug = options.kitabSlug || options.slug || slugify(title);
	const category = options.category || 'Belum diklasifikasi';
	const madhhab = options.madhhab || options.madzhab || 'Belum diklasifikasi';
	const sourceNote = options.sourceNote || DEFAULT_SOURCE_NOTE;

	return chunks.map((chunk, index) => {
		const chunkIndex = index + 1;
		const chunkText = chunk.text;
		return {
			kitabSlug,
			title,
			author,
			category,
			madhhab,
			sourceType: 'openiti',
			sourceNote,
			chunkIndex,
			chapter: chunk.chapter,
			sectionTitle: chunk.sectionTitle,
			pageNumber: null,
			arabicText: chunkText,
			translationText: null,
			explanationText: null,
			chunkText,
			sourceRef: sourceRefFor({
				title,
				chapter: chunk.chapter,
				sectionTitle: chunk.sectionTitle,
				chunkIndex
			})
		};
	});
};

const processBook = async (options) => {
	if (!options.input || !options.output) {
		throw new Error('Field --input dan --output wajib diisi.');
	}

	const inputPath = resolvePath(options.input);
	const outputPath = resolvePath(options.output);

	if (!/\.(?:mARkdown|markdown|txt)$/i.test(inputPath)) {
		console.warn(`Peringatan: ekstensi input tidak umum untuk OpenITI: ${inputPath}`);
	}

	const rawText = await readFile(inputPath, 'utf8');
	const parsed = parseOpenitiText(rawText, inputPath);
	const chunks = chunkUnits(parsed.units);
	const rows = buildOutputRows({
		chunks,
		options,
		metadata: parsed.metadata,
		inputPath
	});

	await mkdir(path.dirname(outputPath), { recursive: true });
	await writeFile(outputPath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');

	return {
		input: inputPath,
		output: outputPath,
		chunks: rows.length,
		title: rows[0]?.title ?? options.title ?? parsed.metadata.title ?? null,
		author: rows[0]?.author ?? options.author ?? parsed.metadata.author ?? null,
		bookId: parsed.metadata.bookId ?? null
	};
};

const processMapping = async (mappingPath) => {
	const resolved = resolvePath(mappingPath);
	const raw = await readFile(resolved, 'utf8');
	const entries = JSON.parse(raw);
	if (!Array.isArray(entries)) {
		throw new Error('Mapping OpenITI harus berupa JSON array.');
	}

	const results = [];
	for (const entry of entries) {
		results.push(await processBook(entry));
	}
	return results;
};

const main = async () => {
	const args = parseArgs(process.argv.slice(2));

	if (args.help) {
		console.log(usage);
		return;
	}

	if (args.mapping) {
		const results = await processMapping(args.mapping);
		for (const result of results) {
			console.log(
				`OK ${result.chunks} chunks: ${path.relative(process.cwd(), result.output)} (${result.title})`
			);
		}
		return;
	}

	const result = await processBook(args);
	console.log(`OK ${result.chunks} chunks: ${path.relative(process.cwd(), result.output)}`);
	if (result.title) console.log(`Title: ${result.title}`);
	if (result.author) console.log(`Author: ${result.author}`);
	if (result.bookId) console.log(`Book ID: ${result.bookId}`);
};

main().catch((error) => {
	console.error(error?.message ?? error);
	process.exitCode = 1;
});
