/**
 * Normalize and split novel chapter content for the public reader.
 * Studio/editor often stores Windows CRLF paragraphs; the reader must treat
 * \r\n\r\n the same as blank-line breaks so prose does not collapse into one block.
 */

const LONG_PARAGRAPH_CHARS = 900;

const stripTags = (value: string) =>
	value
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>/gi, '\n\n')
		.replace(/<\/div>/gi, '\n\n')
		.replace(/<\/h[1-6]>/gi, '\n\n')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");

/** Normalize any newline style to LF and tidy blank lines. */
export const normalizeBukuProse = (value: string | null | undefined): string => {
	const source = stripTags(value ?? '');
	return source
		.replace(/\r\n/g, '\n')
		.replace(/\r/g, '\n')
		.replace(/\u2028|\u2029/g, '\n')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n[ \t]+/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
};

const cleanParagraph = (paragraph: string) =>
	paragraph
		.replace(/[ \t]*\n[ \t]*/g, ' ')
		.replace(/[ \t]{2,}/g, ' ')
		.trim();

/**
 * Prefer blank-line paragraphs. If the source only used single newlines
 * (common from some editors), treat non-empty lines as paragraphs.
 * Also reflow any remaining overlong blocks so public reading stays
 * professional (about 3–5 sentences / short visual paragraphs).
 */
export const toBukuParagraphs = (value: string | null | undefined): string[] => {
	const normalized = normalizeBukuProse(value);
	if (!normalized) return [];

	let paragraphs = normalized
		.split(/\n{2,}/)
		.map(cleanParagraph)
		.filter(Boolean);

	// Single-newline paragraphs (no blank lines between blocks)
	if (paragraphs.length === 1 && normalized.includes('\n')) {
		const lineParagraphs = normalized
			.split(/\n+/)
			.map(cleanParagraph)
			.filter(Boolean);
		if (lineParagraphs.length > 1) {
			paragraphs = lineParagraphs;
		}
	}

	// Reflow any dense block (whole chapter or one oversized trailing paragraph)
	const expanded: string[] = [];
	for (const paragraph of paragraphs) {
		if (paragraph.length > LONG_PARAGRAPH_CHARS) {
			expanded.push(...reflowDenseProse(paragraph));
		} else {
			expanded.push(paragraph);
		}
	}

	return expanded.filter(Boolean);
};

const splitSentences = (text: string): string[] => {
	const parts = text
		.split(/(?<=[.!?…])(?=["”’')\]]?\s+)(?=\s*["“‘(A-ZÀ-Ýa-zà-ÿ])/)
		.map((part) => part.trim())
		.filter(Boolean);

	if (parts.length >= 3) return parts;

	// Indonesian prose often continues after "." with lowercase; pack by words.
	return [];
};

const reflowDenseProse = (text: string): string[] => {
	const sentences = splitSentences(text);

	if (sentences.length < 3) {
		const words = text.split(/\s+/).filter(Boolean);
		const chunks: string[] = [];
		const wordsPerChunk = 85;
		for (let i = 0; i < words.length; i += wordsPerChunk) {
			chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
		}
		return chunks.filter(Boolean);
	}

	const chunks: string[] = [];
	let buffer: string[] = [];
	const targetSentences = 4;

	for (const sentence of sentences) {
		buffer.push(sentence);
		const joined = buffer.join(' ');
		const isShortDialogue = /["“]/.test(sentence) && sentence.length < 180;
		const shouldFlush =
			buffer.length >= targetSentences ||
			(isShortDialogue && buffer.length >= 2) ||
			joined.length > 480;

		if (shouldFlush) {
			chunks.push(joined);
			buffer = [];
		}
	}

	if (buffer.length) chunks.push(buffer.join(' '));
	return chunks.filter(Boolean);
};

export const plainBukuText = (value: string | null | undefined): string =>
	normalizeBukuProse(value).replace(/\s+/g, ' ').trim();
