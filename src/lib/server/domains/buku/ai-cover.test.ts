import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
	buildBukuCoverPrompt,
	detectBukuCoverImageFormat,
	normalizeBukuCoverBrief
} from './ai-cover.ts';

test('brief cover menormalkan input penulis dan membatasi panjang', () => {
	const brief = normalizeBukuCoverBrief({
		title: '  Langit   Kecil di Pesantren  ',
		category: ' Novel   Santri ',
		description: ` Seorang santri belajar menjaga amanah. ${'a'.repeat(2000)} `
	});

	assert.equal(brief.title, 'Langit Kecil di Pesantren');
	assert.equal(brief.category, 'Novel Santri');
	assert.ok(brief.description.length <= 1200);
});

test('brief cover menolak judul kosong', () => {
	assert.throws(() => normalizeBukuCoverBrief({ title: '  ' }), /Judul buku wajib diisi/);
});

test('prompt cover bersifat vertikal, ramah keluarga, dan tanpa teks buatan AI', () => {
	const prompt = buildBukuCoverPrompt({
		title: 'Langit Kecil di Pesantren',
		category: 'Novel Santri',
		description: 'Kisah persahabatan, amanah, dan pertumbuhan seorang santri.'
	});

	assert.match(prompt, /vertical 3:4/i);
	assert.match(prompt, /family-friendly/i);
	assert.match(prompt, /modest/i);
	assert.match(prompt, /no readable text/i);
	assert.match(prompt, /Langit Kecil di Pesantren/);
});

test('format gambar cover dideteksi dari signature, bukan diasumsikan JPEG', () => {
	assert.deepEqual(detectBukuCoverImageFormat(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), {
		extension: 'png',
		contentType: 'image/png'
	});
	assert.deepEqual(detectBukuCoverImageFormat(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])), {
		extension: 'jpg',
		contentType: 'image/jpeg'
	});
	assert.equal(detectBukuCoverImageFormat(Uint8Array.from([0xff, 0xff, 0xff, 0xff])), null);
});
