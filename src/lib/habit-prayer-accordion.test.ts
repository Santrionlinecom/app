import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sourcePath = new URL('../routes/(app)/habit/+page.svelte', import.meta.url);

async function habitPageSource() {
	return readFile(sourcePath, 'utf8');
}

test('prayer check-in renders each prayer time as a compact accordion', async () => {
	const source = await habitPageSource();

	assert.match(source, /{#each prayerTimes as time, index}/);
	assert.match(source, /<details[^>]*class="prayer-time-accordion/);
	assert.match(source, /<summary[^>]*>/);
	assert.match(source, /statusLabel\(shalatTimes\[time\.key\]\)/);
});

test('the first incomplete prayer accordion opens by default', async () => {
	const source = await habitPageSource();

	assert.match(source, /open={shouldOpenPrayerTime\(time\.key, index\)}/);
	assert.match(source, /const shouldOpenPrayerTime = \(key: string, index: number\)/);
});
