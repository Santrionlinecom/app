import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeBukuProse, toBukuParagraphs } from '../src/lib/utils/buku-reader-text.ts';

describe('buku reader text', () => {
	it('splits Windows CRLF blank-line paragraphs', () => {
		const source =
			'"Jangan bawa laptop itu ke laut."\r\n\r\nSuara itu berat, serak oleh debu timah.\r\n\r\nAku terpaku di depan meja kayu jati.';
		const paragraphs = toBukuParagraphs(source);
		assert.equal(paragraphs.length, 3);
		assert.match(paragraphs[0], /Jangan bawa laptop/);
		assert.match(paragraphs[1], /Suara itu berat/);
		assert.match(paragraphs[2], /Aku terpaku/);
	});

	it('normalizes mixed CR/LF before splitting', () => {
		const normalized = normalizeBukuProse('Satu.\r\n\r\nDua.\n\nTiga.');
		assert.equal(normalized, 'Satu.\n\nDua.\n\nTiga.');
	});

	it('uses single newlines as paragraph breaks when blank lines are absent', () => {
		const source = 'Baris pertama.\nBaris kedua.\nBaris ketiga.';
		const paragraphs = toBukuParagraphs(source);
		assert.equal(paragraphs.length, 3);
	});

	it('does not collapse a multi-paragraph CRLF chapter into one block', () => {
		const blocks = Array.from({ length: 12 }, (_, i) => `Paragraf ke-${i + 1} berisi kalimat utuh untuk uji reader.`);
		const source = blocks.join('\r\n\r\n');
		const paragraphs = toBukuParagraphs(source);
		assert.equal(paragraphs.length, 12);
	});

	it('reflows an oversized trailing paragraph so public pages stay readable', () => {
		const short = 'Pembuka singkat yang sudah rapi.';
		const long =
			'Ini kalimat pertama yang panjang untuk mengisi ruang bacaan. '.repeat(40) +
			'Ini kalimat penutup yang tetap padat.';
		const source = `${short}\r\n\r\n${long}`;
		const paragraphs = toBukuParagraphs(source);
		assert.ok(paragraphs.length > 2);
		assert.ok(paragraphs.every((part) => part.length < 1200));
		assert.equal(paragraphs[0], short);
	});
});
