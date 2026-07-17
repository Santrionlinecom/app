import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';

const routePath = resolve('src/routes/buku/[slug]/bab/[chapter]/+page.server.ts');

test('halaman bab mendelegasikan unlock premium ke operasi domain yang atomik', async () => {
	const source = await readFile(routePath, 'utf8');

	assert.match(
		source,
		/import\s*{[\s\S]*?unlockBukuChapter[\s\S]*?}\s*from\s*['"]\$lib\/server\/domains\/buku\/access['"]/
	);
	assert.match(source, /await\s+unlockBukuChapter\s*\(/);
	assert.doesNotMatch(source, /\bdeductCoins\s*\(/);
	assert.doesNotMatch(source, /INSERT\s+INTO\s+buku_unlocks/i);
});
