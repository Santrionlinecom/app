import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'static', 'quran');
const TOTAL_JUZ = 30;

const padJuz = (value) => String(value).padStart(2, '0');

const fetchJuz = async (juz) => {
	const url = `https://api.quran.com/api/v4/quran/verses/uthmani?juz_number=${juz}`;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch juz ${juz}: ${response.status}`);
	}
	const data = await response.json();
	return data.verses ?? [];
};

const run = async () => {
	await mkdir(OUT_DIR, { recursive: true });

	for (let juz = 1; juz <= TOTAL_JUZ; juz += 1) {
		const verses = await fetchJuz(juz);
		const payload = {
			juz,
			verse_count: verses.length,
			verses: verses.map((verse) => ({
				verse_key: verse.verse_key,
				text: verse.text_uthmani
			}))
		};
		const outFile = path.join(OUT_DIR, `juz-${padJuz(juz)}.json`);
		await writeFile(outFile, JSON.stringify(payload));
		console.log(`Saved ${outFile}`);
	}
};

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
