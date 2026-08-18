import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildChapterPdf, sanitizePdfText } from '../src/lib/server/domains/buku/drm-pdf.ts';

test('sanitizePdfText mempertahankan teks Latin dan mengganti huruf Arab', () => {
	assert.equal(sanitizePdfText('Assalamu alaikum'), 'Assalamu alaikum');
	const sanitized = sanitizePdfText('Bismillah الرحمن');
	assert.match(sanitized, /^Bismillah \?+$/);
	assert.doesNotMatch(sanitized, /[\u0600-\u06FF]/);
});

test('buildChapterPdf menghasilkan PDF dari isi bab', async () => {
	const bytes = await buildChapterPdf('Kitab Uji', {
		chapterNumber: 1,
		title: 'Pembuka',
		content: 'Paragraf pertama.\n\nParagraf kedua.'
	});
	assert.ok(bytes.byteLength > 200);
	assert.equal(String.fromCharCode(...bytes.slice(0, 5)), '%PDF-');
});
