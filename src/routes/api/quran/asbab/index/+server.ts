import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireD1 } from '$lib/server/cloudflare';
import { getPublishedAsbabIndex } from '$lib/server/quran-asbab';

export const GET: RequestHandler = async (event) => {
	const db = requireD1(event);
	const items = await getPublishedAsbabIndex(db);

	return json({
		ok: true,
		count: items.length,
		items: items.map((item) => ({
			id: item.id,
			source_key: item.source_key,
			source_title: item.source_title,
			source_author: item.source_author,
			source_publisher: item.source_publisher,
			surah_number: item.surah_number,
			ayah_start: item.ayah_start,
			ayah_end: item.ayah_end,
			title: item.title,
			grade: item.grade,
			page_ref: item.page_ref
		}))
	});
};
