import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireD1 } from '$lib/server/cloudflare';
import { getAsbabForAyah } from '$lib/server/quran-asbab';

const EMPTY_ASBAB_MESSAGE =
	'Belum ditemukan riwayat asbabun nuzul khusus untuk ayat ini. Namun ayat ini dapat berkaitan dengan konteks ayat sebelum/sesudahnya.';

const parseIntegerParam = (url: URL, key: string) => {
	const raw = url.searchParams.get(key);
	if (!raw) return null;
	const value = Number(raw);
	return Number.isInteger(value) ? value : null;
};

export const GET: RequestHandler = async (event) => {
	const surah = parseIntegerParam(event.url, 'surah');
	const ayah = parseIntegerParam(event.url, 'ayah');

	if (!surah || surah < 1 || surah > 114) {
		return json({ ok: false, error: 'Parameter surah harus angka 1-114.' }, { status: 400 });
	}

	if (!ayah || ayah < 1) {
		return json({ ok: false, error: 'Parameter ayah harus angka positif.' }, { status: 400 });
	}

	const db = requireD1(event);
	const items = await getAsbabForAyah(db, surah, ayah);

	return json({
		ok: true,
		surah,
		ayah,
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
			content: item.content,
			riwayat: item.riwayat,
			takhrij: item.takhrij,
			grade: item.grade,
			page_ref: item.page_ref
		})),
		...(items.length === 0 ? { message: EMPTY_ASBAB_MESSAGE } : {})
	});
};
