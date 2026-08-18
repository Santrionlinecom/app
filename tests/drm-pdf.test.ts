import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	buildChapterPdf,
	decideDrmPdfFallback,
	sanitizePdfText
} from '../src/lib/server/domains/buku/drm-pdf.ts';

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

test('bab Arab tidak di-generate, status preparing', async () => {
	const decision = await decideDrmPdfFallback({
		bookId: 'kitab-arab-1',
		bookTitle: 'Aqidatul Awam',
		chapters: [{ chapterNumber: 1, title: 'Muqaddimah', content: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' }]
	});
	assert.equal(decision.ok, false);
	assert.equal(decision.status, 503);
	assert.equal(decision.body.status, 'preparing');
	assert.match(decision.body.message, /PDF sedang disiapkan/);
	assert.equal(decision.logBookId, 'kitab-arab-1');
	assert.equal('pdf' in decision, false);
});

test('bab Latin murni boleh di-generate menjadi PDF', async () => {
	const decision = await decideDrmPdfFallback({
		bookId: 'kitab-latin-1',
		bookTitle: 'Kitab Uji',
		chapters: [{ chapterNumber: 1, title: 'Pembuka', content: 'Paragraf pertama.\n\nParagraf kedua.' }]
	});
	assert.equal(decision.ok, true);
	assert.ok(decision.pdf.byteLength > 200);
	assert.equal(String.fromCharCode(...decision.pdf.slice(0, 5)), '%PDF-');
});
