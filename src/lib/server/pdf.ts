type PdfJsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs');

let pdfjsPromise: Promise<PdfJsModule> | null = null;

const ensureDomMatrix = () => {
	const globalAny = globalThis as typeof globalThis & { DOMMatrix?: typeof DOMMatrix };
	if (globalAny.DOMMatrix) return;

	// Minimal DOMMatrix stub for non-rendering server usage (text extraction only).
	class FallbackDOMMatrix {
		a = 1;
		b = 0;
		c = 0;
		d = 1;
		e = 0;
		f = 0;

		constructor(
			init?:
				| number[]
				| { a?: number; b?: number; c?: number; d?: number; e?: number; f?: number }
		) {
			if (Array.isArray(init)) {
				[this.a, this.b, this.c, this.d, this.e, this.f] = [
					init[0] ?? 1,
					init[1] ?? 0,
					init[2] ?? 0,
					init[3] ?? 1,
					init[4] ?? 0,
					init[5] ?? 0
				];
			} else if (init && typeof init === 'object') {
				this.a = init.a ?? 1;
				this.b = init.b ?? 0;
				this.c = init.c ?? 0;
				this.d = init.d ?? 1;
				this.e = init.e ?? 0;
				this.f = init.f ?? 0;
			}
		}

		multiplySelf() {
			return this;
		}

		preMultiplySelf() {
			return this;
		}

		translate() {
			return this;
		}

		scale() {
			return this;
		}

		invertSelf() {
			return this;
		}
	}

	globalAny.DOMMatrix = FallbackDOMMatrix as unknown as typeof DOMMatrix;
};

const loadPdfJs = async () => {
	if (!pdfjsPromise) {
		ensureDomMatrix();
		pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
	}
	return pdfjsPromise;
};

type PdfPageText = {
	pageNumber: number;
	text: string;
};

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

export const extractPdfTextPages = async (
	data: ArrayBuffer,
	options?: { maxPages?: number }
): Promise<{ pages: PdfPageText[]; totalPages: number } | null> => {
	const pdfjsLib = await loadPdfJs();
	const loadingTask = pdfjsLib.getDocument({ data });
	const pdf = await loadingTask.promise;
	const totalPages = pdf.numPages;
	const limit = Math.min(options?.maxPages ?? totalPages, totalPages);
	const pages: PdfPageText[] = [];

	for (let pageNumber = 1; pageNumber <= limit; pageNumber += 1) {
		const page = await pdf.getPage(pageNumber);
		const content = await page.getTextContent();
		const text = normalizeText(
			content.items
				.map((item: any) => (typeof item?.str === 'string' ? item.str : ''))
				.join(' ')
		);
		page.cleanup();
		if (text) {
			pages.push({ pageNumber, text });
		}
	}

	await pdf.cleanup();
	await pdf.destroy();

	if (!pages.length) return null;
	return { pages, totalPages };
};

export const splitText = (text: string, maxChars = 1800) => {
	const trimmed = text.trim();
	if (!trimmed) return [] as string[];
	const chunks: string[] = [];
	let start = 0;
	while (start < trimmed.length) {
		let end = Math.min(trimmed.length, start + maxChars);
		if (end < trimmed.length) {
			const lastSpace = trimmed.lastIndexOf(' ', end);
			if (lastSpace > start + 120) {
				end = lastSpace;
			}
		}
		const slice = trimmed.slice(start, end).trim();
		if (slice) chunks.push(slice);
		start = end;
	}
	return chunks;
};

export const toDriveDownloadUrl = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) return null;

	try {
		const url = new URL(trimmed);
		if (url.hostname.includes('drive.google.com')) {
			const match = url.pathname.match(/\/file\/d\/([^/]+)/);
			const id = match?.[1] ?? url.searchParams.get('id');
			if (id) {
				return `https://drive.google.com/uc?export=download&id=${id}`;
			}
		}
		return trimmed;
	} catch {
		return null;
	}
};
