import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

type PdfPageText = {
	pageNumber: number;
	text: string;
};

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

export const extractPdfTextPages = async (
	data: ArrayBuffer,
	options?: { maxPages?: number }
): Promise<{ pages: PdfPageText[]; totalPages: number } | null> => {
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
