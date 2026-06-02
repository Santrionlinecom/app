import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const NOMINATIM_USER_AGENT = 'SantriOnline/1.0 (app.santrionline.com)';
const MIN_REQUEST_INTERVAL_MS = 1000;

let lastRequestAt = 0;
let geocodeQueue = Promise.resolve();

type NominatimRow = {
	display_name?: string;
	lat?: string;
	lon?: string;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const runWithRateLimit = async <T>(fn: () => Promise<T>) => {
	const run = geocodeQueue.then(async () => {
		const elapsed = Date.now() - lastRequestAt;
		if (elapsed > 0 && elapsed < MIN_REQUEST_INTERVAL_MS) {
			await wait(MIN_REQUEST_INTERVAL_MS - elapsed);
		}
		lastRequestAt = Date.now();
		return fn();
	});
	geocodeQueue = run.then(
		() => undefined,
		() => undefined
	);
	return run;
};

export const GET: RequestHandler = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	if (!q) return json({ results: [] });

	try {
		const results = await runWithRateLimit(async () => {
			const params = new URLSearchParams({
				q,
				format: 'json',
				limit: '3',
				countrycodes: 'id'
			});

			const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
				headers: {
					'User-Agent': NOMINATIM_USER_AGENT,
					Accept: 'application/json'
				}
			});
			if (!response.ok) return [];

			const rows = (await response.json().catch(() => [])) as NominatimRow[];
			return rows
				.map((row) => ({
					display_name: row.display_name ?? '',
					lat: row.lat ?? '',
					lon: row.lon ?? ''
				}))
				.filter((row) => row.display_name && row.lat && row.lon);
		});

		return json({ results });
	} catch {
		return json({ results: [] });
	}
};
