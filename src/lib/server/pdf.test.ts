import assert from 'node:assert/strict';
import test from 'node:test';
import { splitText } from './pdf.ts';

test('splitText menggabungkan sisa sangat pendek agar tidak menjadi bukti mandiri', () => {
	const chunks = splitText('a'.repeat(1815), 1800);
	assert.equal(chunks.length, 1);
	assert.equal(chunks[0].length, 1815);
});

test('splitText tetap memisahkan sisa yang cukup bermakna', () => {
	const chunks = splitText('a'.repeat(1950), 1800);
	assert.deepEqual(chunks.map((chunk) => chunk.length), [1800, 150]);
});
