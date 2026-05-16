import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireD1 } from '$lib/server/cloudflare';
import { getTafsirIndonesiaIndex } from '$lib/server/quran-tafsir-indonesia';

const parseLimit = (url: URL) => {
	const raw = url.searchParams.get('limit');
	if (!raw || raw === 'all') return null;
	const value = Number(raw);
	return Number.isInteger(value) && value > 0 ? Math.min(value, 20_000) : null;
};

export const GET: RequestHandler = async (event) => {
	const db = requireD1(event);
	const items = await getTafsirIndonesiaIndex(db, {
		includeDraft: true,
		limit: parseLimit(event.url)
	});

	return json({
		ok: true,
		count: items.length,
		status_filter: 'all',
		items: items.map((item) => ({
			id: item.id,
			source_key: item.source_key,
			source_title: item.source_title,
			source_author: item.source_author,
			source_publisher: item.source_publisher,
			surah_number: item.surah_number,
			ayah_number: item.ayah_number,
			title: item.title,
			summary: item.summary,
			page_ref: item.page_ref,
			status: item.status
		}))
	});
};
