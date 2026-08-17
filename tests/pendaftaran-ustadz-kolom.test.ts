import { strict as assert } from 'node:assert';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const migrationsDir = 'migrations';
const allMigrations = readdirSync(migrationsDir)
	.filter((file) => file.endsWith('.sql'))
	.map((file) => readFileSync(`${migrationsDir}/${file}`, 'utf8'))
	.join('\n');

const registerSource = readFileSync('src/routes/(auth)/register/ustadz/+page.server.ts', 'utf8');

// Kolom yang ditulis INSERT pendaftaran ustadz wajib punya migrasi. Tanpa ini
// D1 melempar "no such column" dan tombol Daftar tampak tidak merespons:
// akun gagal dibuat, tidak ada redirect, tidak ada email.
const kolomWajib = ['work_status', 'expertise'];

for (const kolom of kolomWajib) {
	test(`kolom ${kolom} dipakai INSERT dan punya migrasi`, () => {
		assert.ok(
			registerSource.includes(kolom),
			`${kolom} seharusnya dipakai pendaftaran ustadz`
		);
		assert.match(
			allMigrations,
			new RegExp(`ADD COLUMN\\s+${kolom}\\b|\\b${kolom}\\s+TEXT`, 'i'),
			`${kolom} ditulis ke tabel users tetapi tidak ada migrasi yang membuatnya`
		);
	});
}

test('migrasi kolom pendaftar memakai ALTER TABLE users', () => {
	const migrasi = readdirSync(migrationsDir).find((file) => file.includes('work_status'));
	assert.ok(migrasi, 'harus ada berkas migrasi khusus untuk kolom pendaftaran ustadz');
	const isi = readFileSync(`${migrationsDir}/${migrasi}`, 'utf8');
	assert.match(isi, /ALTER TABLE users/i);
});
