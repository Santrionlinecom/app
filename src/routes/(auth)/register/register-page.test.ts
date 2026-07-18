import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(
	'src/routes/(auth)/register/+page.svelte',
	'utf8'
);

test('registration hub exposes every active registration journey', () => {
	assert.match(source, /href="\/tpq\/daftar"/);
	assert.match(source, /href="\/register\/ustadz"/);
	assert.match(source, /href="\/auth"/);
	assert.match(source, /Pilih jalur pendaftaran/);
});

test('registration hub does not render fake links for unavailable institutions', () => {
	assert.doesNotMatch(source, /href=["']#["']/);
	assert.match(source, /Segera hadir/);
});

test('registration hub explains member invitations and account email', () => {
	assert.match(source, /tautan pendaftaran dari admin lembaga/i);
	assert.match(source, /pemberitahuan melalui email/i);
	assert.match(source, /\/privacy/);
	assert.match(source, /\/syarat/);
});
