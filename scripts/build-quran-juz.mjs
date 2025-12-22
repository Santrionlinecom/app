import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'static', 'quran');
const TOTAL_JUZ = 30;

const padJuz = (value) => String(value).padStart(2, '0');

const fetchJuz = async (juz) => {
	const verses = [];
	let page = 1;
	const perPage = 1000;

	while (true) {
		const url = `https://api.quran.com/api/v4/verses/by_juz/${juz}?fields=text_uthmani,page_number,verse_key&per_page=${perPage}&page=${page}`;
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch juz ${juz} page ${page}: ${response.status}`);
		}
		const data = await response.json();
		verses.push(...(data.verses ?? []));
		const nextPage = data.pagination?.next_page;
		if (!nextPage) break;
		page = nextPage;
	}

	return verses;
};

const run = async () => {
	await mkdir(OUT_DIR, { recursive: true });

	for (let juz = 1; juz <= TOTAL_JUZ; juz += 1) {
		const verses = await fetchJuz(juz);
		const pageNumbers = Array.from(
			new Set(verses.map((verse) => verse.page_number).filter(Boolean))
		).sort((a, b) => a - b);
		const payload = {
			juz,
			verse_count: verses.length,
			page_count: pageNumbers.length,
			page_numbers: pageNumbers,
			verses: verses.map((verse) => ({
				verse_key: verse.verse_key,
				text: verse.text_uthmani,
				page_number: verse.page_number
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
