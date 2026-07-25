#!/usr/bin/env node
/**
 * Build priority-book chunk JSON for production RAG ingest.
 * Structure-aware:
 * - Aqidatul Awam: nazham by thematic sections + bait groups
 * - Safinatun Najah: one fasl (فصل) per chunk
 * - Arbain: paragraph/hadith-ish blocks (generic cleaner)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const OUT_DIR = join(ROOT, 'data/kitab/priority/chunks');
const BASE = '/mnt/d/SantriOnlineData/kitab-rag';
const CORPUS_VERSION = 'v2';

const BOOKS = [
	{
		slug: 'aqidatul-awam',
		title: 'Aqidatul Awam',
		author: 'Syekh Ahmad al-Marzuki al-Maliki',
		category: 'Aqidah',
		madhhab: 'Aswaja',
		sourceType: 'local-matan',
		sourceNote:
			'Matan asli dikoreksi Mas Yogik untuk prototipe internal. Bukan fatwa; verifikasi edisi cetak sebelum publik.',
		path: join(BASE, 'raw/priority/aqidatul_awam_matan_asli_user.txt'),
		mode: 'aqidah-bayt'
	},
	{
		slug: 'safinatun-najah',
		title: 'Safinatun Najah',
		author: "Syekh Salim bin Sumair al-Hadrami al-Syafi'i",
		category: 'Fiqih',
		madhhab: "Syafi'i",
		sourceType: 'local-matan',
		sourceNote:
			"Matan asli dikoreksi Mas Yogik untuk prototipe internal. Jawab dalam rambu madzhab Syafi'i; verifikasi edisi cetak sebelum publik.",
		path: join(BASE, 'raw/priority/safinatun_najah_matan_asli_user.txt'),
		mode: 'safinah-fasl'
	},
	{
		slug: 'arbain-nawawi',
		title: "Al-Arba'in An-Nawawiyyah",
		author: 'Imam Yahya bin Syaraf an-Nawawi',
		category: 'Hadits',
		madhhab: 'Aswaja',
		sourceType: 'wikisource-cleaned',
		sourceNote:
			'Bersih dari wikitext; sumber Wikisource. Prototype internal — cek lisensi/PD sebelum publik komersial.',
		path: join(BASE, 'processed/arbain_nawawi_clean.txt'),
		mode: 'generic'
	}
];

const cleanGeneric = (raw) => {
	let text = String(raw || '');
	text = text.replace(/<script[\s\S]*?<\/script>/gi, ' ');
	text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');
	text = text.replace(/<[^>]+>/g, ' ');
	text = text.replace(/\{\{[\s\S]*?\}\}/g, ' ');
	text = text.replace(/^\s*\|[^\n]*$/gm, ' ');
	text = text.replace(/\[\[([^|\]]*\|)?([^\]]+)\]\]/g, '$2');
	text = text.replace(/__[^_]+__/g, ' ');
	text = text.replace(/^\s*[=]{2,}\s*(.*?)\s*[=]{2,}\s*$/gm, '$1');
	return text
		.split(/\r?\n/)
		.map((line) => line.replace(/\s+/g, ' ').trim())
		.filter((line) => line.length > 1 && !line.startsWith('{{') && !line.startsWith('|'))
		.join('\n');
};

const normalizeSpaces = (value) => value.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

const stripLeadingFasl = (title) =>
	title
		.replace(/^فَصْلٌ\s*[:：]?\s*/u, '')
		.replace(/^فصل\s*[:：]?\s*/u, '')
		.trim();

/**
 * Safinah: split on فصل headers. Keep each fasl as one semantic chunk.
 * Note: do NOT use \\b — Arabic word boundaries break fasl detection.
 */
const FASL_RE = /^(?:ف[\u064B-\u065F\u0670]*ص[\u064B-\u065F\u0670]*ل[\u064B-\u065F\u0670]*ٌ?|فصل)\s*[:：]?\s*/u;

const isFaslLine = (line) => FASL_RE.test(line);

const chunkSafinahByFasl = (raw) => {
	const lines = String(raw || '')
		.replace(/\r\n/g, '\n')
		.split('\n')
		.map((l) => l.replace(/\s+/g, ' ').trim())
		.filter(Boolean);

	const sections = [];
	let current = { title: 'المقدمة', lines: [] };

	for (const line of lines) {
		if (isFaslLine(line)) {
			if (current.lines.length) sections.push(current);
			const rest = line.replace(FASL_RE, '').trim();
			const title = rest || 'فصل';
			current = {
				title,
				lines: [`فَصْلٌ: ${title}`]
			};
			continue;
		}
		current.lines.push(line);
	}
	if (current.lines.length) sections.push(current);

	const merged = [];
	for (const section of sections) {
		const uniqueLines = [];
		for (const line of section.lines) {
			if (uniqueLines[uniqueLines.length - 1] === line) continue;
			uniqueLines.push(line);
		}
		const body = normalizeSpaces(uniqueLines.join('\n'));
		if (!body) continue;
		// Attach tiny non-fasl orphans to previous section.
		if (merged.length && body.length < 50 && !isFaslLine(uniqueLines[0] || '')) {
			merged[merged.length - 1].text = normalizeSpaces(`${merged[merged.length - 1].text}\n${body}`);
			continue;
		}
		merged.push({
			sectionTitle: section.title,
			chapter: section.title,
			text: body
		});
	}

	// Oversized fasl (>1400): split while preserving section title.
	const finalChunks = [];
	for (const item of merged) {
		if (item.text.length <= 1400) {
			finalChunks.push(item);
			continue;
		}
		const parts = item.text.split(/\n+/);
		let buf = '';
		let partNo = 1;
		for (const p of parts) {
			const next = buf ? `${buf}\n${p}` : p;
			if (next.length > 1100 && buf) {
				finalChunks.push({
					sectionTitle: `${item.sectionTitle} (${partNo})`,
					chapter: item.chapter,
					text: buf
				});
				partNo += 1;
				buf = p;
			} else {
				buf = next;
			}
		}
		if (buf) {
			finalChunks.push({
				sectionTitle: partNo > 1 ? `${item.sectionTitle} (${partNo})` : item.sectionTitle,
				chapter: item.chapter,
				text: buf
			});
		}
	}
	return finalChunks;
};

/**
 * Aqidatul Awam thematic map by bait ranges (1-based after title).
 * Title line is separate; bayts are lines containing * separator or Arabic couplets.
 */
// Bayt index is 1-based over non-title couplet lines in the user matan file.
const AQIDAH_SECTIONS = [
	{ key: 'muqaddimah', title: 'المقدمة والثناء', start: 1, end: 4 },
	{ key: 'sifat-wajib', title: 'الصفات الواجبة لله تعالى', start: 5, end: 9 },
	{ key: 'jaiz-ilahiyyah', title: 'الجائز في حق الله تعالى', start: 10, end: 10 },
	{ key: 'sifat-anbiya', title: 'صفات الأنبياء', start: 11, end: 13 },
	{ key: 'mustahil-khamsin', title: 'المستحيل والخمسون عقيدة', start: 14, end: 15 },
	{ key: 'asamil-anbiya', title: 'أسماء الأنبياء والرسل', start: 16, end: 20 },
	{ key: 'malaikah', title: 'الملائكة', start: 21, end: 23 },
	{ key: 'kutub', title: 'الكتب السماوية', start: 24, end: 26 },
	{ key: 'samjiyyat', title: 'الإيمان بما جاء به الرسول واليوم الآخر', start: 27, end: 28 },
	{ key: 'sirah-nasab', title: 'سيرة النبي ﷺ: النسب والأهل', start: 29, end: 45 },
	{ key: 'isra-miraj', title: 'الإسراء والمعراج', start: 46, end: 50 },
	{ key: 'khatimah', title: 'الخاتمة وتسمية المنظومة', start: 51, end: 999 }
];

const chunkAqidahByBayt = (raw) => {
	const lines = String(raw || '')
		.replace(/\r\n/g, '\n')
		.split('\n')
		.map((l) => l.replace(/\s+/g, ' ').trim())
		.filter(Boolean);

	const titleLine = lines[0] || 'عَقِيْدَةُ الْعَوَامِ';
	const bayts = lines.slice(1); // each non-empty line is one bait couplet

	const chunks = [];
	// Keep title as tiny orientation chunk
	chunks.push({
		sectionTitle: 'عنوان المنظومة',
		chapter: 'عنوان المنظومة',
		text: titleLine,
		baitStart: 0,
		baitEnd: 0
	});

	for (const section of AQIDAH_SECTIONS) {
		const selected = bayts.slice(section.start - 1, section.end);
		if (!selected.length) continue;

		// Group into 3-5 bayts for retrieval precision, keep section title.
		const groupSize = section.key === 'sirah-nasab' ? 4 : section.key === 'asamil-anbiya' ? 3 : 4;
		for (let i = 0; i < selected.length; i += groupSize) {
			const group = selected.slice(i, i + groupSize);
			const baitStart = section.start + i;
			const baitEnd = baitStart + group.length - 1;
			chunks.push({
				sectionTitle: section.title,
				chapter: section.title,
				baitStart,
				baitEnd,
				text: [`[${section.title}]`, `الأبيات ${baitStart}-${baitEnd}`, ...group].join('\n')
			});
		}
	}
	return chunks;
};

const chunkGeneric = (raw, maxChars = 900) => {
	const cleaned = cleanGeneric(raw);
	const paras = cleaned.split(/\n+/).map((p) => p.trim()).filter(Boolean);
	const chunks = [];
	let buf = '';
	for (const p of paras) {
		if ((buf + '\n' + p).trim().length <= maxChars) {
			buf = (buf + '\n' + p).trim();
			continue;
		}
		if (buf) chunks.push({ sectionTitle: null, chapter: null, text: buf });
		if (p.length > maxChars) {
			for (let i = 0; i < p.length; i += maxChars) {
				chunks.push({ sectionTitle: null, chapter: null, text: p.slice(i, i + maxChars) });
			}
			buf = '';
		} else {
			buf = p;
		}
	}
	if (buf) chunks.push({ sectionTitle: null, chapter: null, text: buf });
	return chunks;
};

const normalizeSlugPart = (value) =>
	value
		.normalize('NFKD')
		.toLowerCase()
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 20) || 'kitab';

const stableHashPart = (bytes, seed) => {
	let hash = seed >>> 0;
	for (let i = 0; i < bytes.length; i += 1) {
		hash ^= bytes[i] ?? 0;
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return hash.toString(16).padStart(8, '0');
};

const stableHash = (value) => {
	const bytes = new TextEncoder().encode(value);
	return `${stableHashPart(bytes, 0x811c9dc5)}${stableHashPart(bytes, 0x9e3779b9)}`;
};

const buildKitabChunkId = ({ kitabSlug, corpusKey, pageNumber, chunkIndex }) => {
	const corpusIdentity = `${kitabSlug.normalize('NFKC').toLowerCase()}|${corpusKey ?? kitabSlug}`;
	const position = `${Math.max(0, Math.trunc(pageNumber))}|${Math.max(0, Math.trunc(chunkIndex))}`;
	return `kitab:${normalizeSlugPart(kitabSlug)}:${stableHash(corpusIdentity)}:${stableHash(position)}`;
};

const only = process.argv.includes('--book')
	? process.argv[process.argv.indexOf('--book') + 1]
	: null;

mkdirSync(OUT_DIR, { recursive: true });
const summary = [];

for (const book of BOOKS) {
	if (only && book.slug !== only) continue;
	const raw = readFileSync(book.path, 'utf8');
	let parts = [];
	if (book.mode === 'aqidah-bayt') parts = chunkAqidahByBayt(raw);
	else if (book.mode === 'safinah-fasl') parts = chunkSafinahByFasl(raw);
	else parts = chunkGeneric(raw, 900);

	const corpusKey = `priority-${CORPUS_VERSION}:${book.slug}:${book.author}`;
	const rows = parts.map((part, index) => {
		const chunkIndex = index + 1;
		const pageNumber = 0;
		const id = buildKitabChunkId({
			kitabSlug: book.slug,
			corpusKey,
			pageNumber,
			chunkIndex
		});
		const sectionTitle = part.sectionTitle || null;
		const baitLabel =
			part.baitStart && part.baitEnd ? `bait ${part.baitStart}-${part.baitEnd}` : null;
		const sourceRef = [book.title, sectionTitle, baitLabel, `chunk ${chunkIndex}`]
			.filter(Boolean)
			.join(', ');
		return {
			id,
			kitabSlug: book.slug,
			title: book.title,
			author: book.author,
			category: book.category,
			madhhab: book.madhhab,
			sourceType: book.sourceType,
			sourceNote: book.sourceNote,
			chunkIndex,
			pageNumber: null,
			chapter: part.chapter || sectionTitle,
			sectionTitle,
			chunkText: part.text,
			sourceRef,
			corpusKey,
			baitStart: part.baitStart ?? null,
			baitEnd: part.baitEnd ?? null
		};
	});

	const outPath = join(OUT_DIR, `${book.slug}.chunks.json`);
	writeFileSync(outPath, JSON.stringify(rows, null, 2));
	const fingerprint = createHash('sha256')
		.update(rows.map((r) => r.chunkText).join('\n---\n'))
		.digest('hex')
		.slice(0, 12);
	const sampleTitles = [...new Set(rows.map((r) => r.sectionTitle).filter(Boolean))].slice(0, 8);
	summary.push({
		slug: book.slug,
		mode: book.mode,
		chunks: rows.length,
		avgChars: Math.round(rows.reduce((s, r) => s + r.chunkText.length, 0) / Math.max(rows.length, 1)),
		fingerprint,
		outPath,
		sampleId: rows[0]?.id,
		sampleSections: sampleTitles,
		preview: rows[1]?.chunkText?.slice(0, 120)?.replace(/\n/g, ' ') || rows[0]?.chunkText?.slice(0, 120)
	});
}

const summaryPath = join(OUT_DIR, 'summary.json');
writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ ok: true, corpusVersion: CORPUS_VERSION, books: summary, summaryPath }, null, 2));
