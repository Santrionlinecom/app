import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync('src/routes/(auth)/auth/google/callback/+server.ts', 'utf8');

test('akun Google baru mengantri email sambutan setelah INSERT', () => {
	assert.match(
		source,
		/import \{ queueRegistrationEmail \} from '\$lib\/server\/notifications\/registration-email';/
	);
	assert.match(source, /if \(isNewUser\)/);
	assert.match(source, /queueRegistrationEmail\(/);
	assert.match(source, /platform\?\.context\?\.waitUntil/);

	const insertPosition = source.indexOf('INSERT INTO users');
	const emailPosition = source.indexOf('queueRegistrationEmail(', insertPosition);
	assert.ok(
		insertPosition >= 0 && emailPosition > insertPosition,
		'email wajib diantrikan setelah akun tersimpan, bukan sebelum'
	);
});

test('login Google akun lama tidak mengantri email sambutan', () => {
	const newUserGuard = source.indexOf('if (isNewUser)');
	const emailCall = source.indexOf('queueRegistrationEmail(', newUserGuard);
	assert.ok(newUserGuard >= 0 && emailCall > newUserGuard, 'antrian email wajib di dalam penjaga isNewUser');

	const existingBranch = source.indexOf('if (existingUser)');
	const emailInExisting = source.indexOf('queueRegistrationEmail(', existingBranch);
	assert.ok(
		emailInExisting < 0 || emailInExisting > newUserGuard,
		'akun lama yang hanya login tidak boleh dapat email sambutan kedua'
	);
});
