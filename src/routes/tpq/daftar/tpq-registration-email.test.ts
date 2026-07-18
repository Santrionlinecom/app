import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync('src/routes/tpq/daftar/+page.server.ts', 'utf8');

test('new TPQ administrator registration queues the shared best-effort welcome email', () => {
	assert.match(
		source,
		/import \{ queueRegistrationEmail \} from '\$lib\/server\/notifications\/registration-email';/
	);
	assert.match(source, /queueRegistrationEmail\(\s*\{/);
	assert.match(source, /role: 'admin'/);
	assert.match(source, /organizationName: orgName\.trim\(\)/);
	assert.match(source, /platform\?\.context\?\.waitUntil/);

	const insertPosition = source.indexOf('INSERT INTO users');
	const emailPosition = source.indexOf('queueRegistrationEmail(', insertPosition);
	assert.ok(insertPosition >= 0 && emailPosition > insertPosition, 'email must only be queued after the account insert');
});
