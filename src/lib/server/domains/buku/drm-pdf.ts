import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';

// A4 portrait in points.
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 56;
const MARGIN_Y = 64;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const BODY_SIZE = 11.5;
const BODY_LINE_HEIGHT = 18;
const HEADING_SIZE = 15;
const HEADING_LINE_HEIGHT = 24;
const BOOK_HEADER_SIZE = 10;
const PARAGRAPH_GAP = 10;
const SECTION_GAP = 14;

const TEXT_COLOR = rgb(0.1, 0.12, 0.14);
const MUTED_COLOR = rgb(0.4, 0.44, 0.48);

// Characters pdf-lib can encode with WinAnsi (StandardFonts). Anything else
// is replaced with "?" so drawText never throws on exotic glyphs.
const WIN_ANSI_EXTRA = new Set([
	0x0152, 0x0153, 0x0160, 0x0161, 0x0178, 0x017d, 0x017e, 0x0192, 0x02c6, 0x02dc, 0x2013, 0x2014,
	0x2018, 0x2019, 0x201a, 0x201c, 0x201d, 0x201e, 0x2020, 0x2021, 0x2022, 0x2026, 0x2030, 0x2039,
	0x203a, 0x20ac, 0x2122
]);

function isWinAnsiSafe(char: string): boolean {
	const code = char.codePointAt(0);
	return code === undefined || code <= 0xff || WIN_ANSI_EXTRA.has(code);
}

export function sanitizePdfText(text: string): string {
	let out = '';
	for (const char of text) {
		out += isWinAnsiSafe(char) ? char : '?';
	}
	return out;
}

export type PdfChapter = {
	chapterNumber: number;
	title: string;
	content: string;
};

type Layer = {
	pdf: PDFDocument;
	font: PDFFont;
	bold: PDFFont;
	page: PDFPage;
	cursorY: number;
};

function addPage(layer: Layer) {
	layer.page = layer.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	layer.cursorY = PAGE_HEIGHT - MARGIN_Y;
}

function drawWrappedParagraph(
	layer: Layer,
	text: string,
	opts: { size: number; font: PDFFont; lineHeight: number; color: ReturnType<typeof rgb> }
) {
	const words = text.split(/\s+/).filter(Boolean);
	if (words.length === 0) return;

	let line = '';
	const flush = () => {
		if (!line) return;
		if (layer.cursorY < MARGIN_Y + opts.lineHeight) {
			addPage(layer);
		}
		layer.page.drawText(line, {
			x: MARGIN_X,
			y: layer.cursorY,
			size: opts.size,
			font: opts.font,
			color: opts.color
		});
		layer.cursorY -= opts.lineHeight;
		line = '';
	};

	for (const word of words) {
		const tentative = line ? `${line} ${word}` : word;
		if (line && opts.font.widthOfTextAtSize(tentative, opts.size) > CONTENT_WIDTH) {
			flush();
			line = word;
		} else {
			line = tentative;
		}
	}
	flush();
}

function drawHeading(layer: Layer, text: string) {
	if (layer.cursorY - HEADING_LINE_HEIGHT - SECTION_GAP < MARGIN_Y + BODY_LINE_HEIGHT) {
		addPage(layer);
	}
	layer.page.drawText(text, {
		x: MARGIN_X,
		y: layer.cursorY,
		size: HEADING_SIZE,
		font: layer.bold,
		color: TEXT_COLOR
	});
	layer.cursorY -= HEADING_LINE_HEIGHT + 4;
}

function drawBookHeader(layer: Layer, bookTitle: string) {
	layer.page.drawText(sanitizePdfText(bookTitle), {
		x: MARGIN_X,
		y: PAGE_HEIGHT - MARGIN_Y + 22,
		size: BOOK_HEADER_SIZE,
		font: layer.font,
		color: MUTED_COLOR
	});
}

function drawPageNumbers(pdf: PDFDocument, font: PDFFont) {
	const pages = pdf.getPages();
	pages.forEach((page, index) => {
		if (pages.length < 2) return;
		page.drawText(String(index + 1), {
			x: PAGE_WIDTH / 2 - 6,
			y: 30,
			size: 9,
			font,
			color: MUTED_COLOR
		});
	});
}

function renderChapterContent(layer: Layer, chapter: PdfChapter) {
	drawHeading(layer, sanitizePdfText(`Bab ${chapter.chapterNumber}: ${chapter.title}`));
	const paragraphs = chapter.content
		.split(/\n{2,}/)
		.map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
		.filter(Boolean);

	for (const paragraph of paragraphs) {
		drawWrappedParagraph(layer, sanitizePdfText(paragraph), {
			size: BODY_SIZE,
			font: layer.font,
			lineHeight: BODY_LINE_HEIGHT,
			color: TEXT_COLOR
		});
		layer.cursorY -= PARAGRAPH_GAP;
	}
}

export async function buildChapterPdf(bookTitle: string, chapter: PdfChapter): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

	const layer: Layer = { pdf, font, bold, page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]), cursorY: PAGE_HEIGHT - MARGIN_Y };
	drawBookHeader(layer, bookTitle);
	renderChapterContent(layer, chapter);
	drawPageNumbers(pdf, font);

	return pdf.save();
}

export async function buildFullBookPdf(bookTitle: string, chapters: PdfChapter[]): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

	const layer: Layer = { pdf, font, bold, page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]), cursorY: PAGE_HEIGHT - MARGIN_Y };
	drawBookHeader(layer, bookTitle);

	for (const chapter of chapters) {
		if (layer.cursorY < MARGIN_Y + BODY_LINE_HEIGHT) {
			addPage(layer);
		}
		renderChapterContent(layer, chapter);
	}
	drawPageNumbers(pdf, font);

	return pdf.save();
}

const ARABIC_SCRIPT_RE =
	/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function containsArabicScript(text: string): boolean {
	return ARABIC_SCRIPT_RE.test(text);
}

export type DrmPdfFallbackOk = {
	ok: true;
	pdf: Uint8Array;
};

export type DrmPdfFallbackPreparing = {
	ok: false;
	status: 503;
	body: { status: 'preparing'; message: string };
	logBookId: string;
};

export type DrmPdfFallbackDecision = DrmPdfFallbackOk | DrmPdfFallbackPreparing;

export async function decideDrmPdfFallback(input: {
	bookId: string;
	bookTitle: string;
	chapters: PdfChapter[];
}): Promise<DrmPdfFallbackDecision> {
	const combined = input.chapters
		.map((chapter) => `${chapter.title}\n${chapter.content}`)
		.join('\n');

	if (containsArabicScript(combined)) {
		return {
			ok: false,
			status: 503,
			body: {
				status: 'preparing',
				message: 'PDF sedang disiapkan, silakan coba lagi nanti'
			},
			logBookId: input.bookId
		};
	}

	const pdf =
		input.chapters.length === 1
			? await buildChapterPdf(input.bookTitle, input.chapters[0])
			: await buildFullBookPdf(input.bookTitle, input.chapters);

	return { ok: true, pdf };
}
