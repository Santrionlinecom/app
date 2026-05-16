import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireD1 } from '$lib/server/cloudflare';
import {
	TAFSIR_INDONESIA_EMPTY_MESSAGE,
	getTafsirIndonesiaForAyah
} from '$lib/server/quran-tafsir-indonesia';

export const GET: RequestHandler = async (event) => {
	const { params, setHeaders } = event;
	const surah = Number(params.surah);
	const ayah = Number(params.ayah);

	if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
		throw error(400, 'Nomor surah tidak valid');
	}

	if (!Number.isInteger(ayah) || ayah < 1) {
		throw error(400, 'Nomor ayat tidak valid');
	}

	const db = requireD1(event);
	const items = await getTafsirIndonesiaForAyah(db, surah, ayah);

	setHeaders({
		'cache-control': 'public, max-age=86400, s-maxage=86400'
	});

	return json({
		ok: true,
		source_origin: 'd1',
		surah,
		ayah,
		items: items.map((item) => ({
			id: item.id,
			source_key: item.source_key,
			source_title: item.source_title,
			source_author: item.source_author,
			source_publisher: item.source_publisher,
			surah_number: item.surah_number,
			ayah_number: item.ayah_number,
			title: item.title,
			content: item.content,
			summary: item.summary,
			page_ref: item.page_ref
		})),
		...(items.length === 0 ? { message: TAFSIR_INDONESIA_EMPTY_MESSAGE } : {})
	});
};
