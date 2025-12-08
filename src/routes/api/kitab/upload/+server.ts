import { json, error } from '@sveltejs/kit';
import { insertDokumen } from '$lib/server/rag';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	if (!platform?.env?.DB) throw error(500, 'DB tidak tersedia');
	try {
		const { results } =
			(await platform.env.DB.prepare(
				`SELECT id, judul, halaman, jilid, created_at as createdAt 
                 FROM kitab_referensi 
                 ORDER BY datetime(created_at) DESC 
                 LIMIT 50`
			).all()) ?? {};
		return json({ ok: true, items: results ?? [] });
	} catch (err) {
		console.error('GET /api/kitab/upload history error', err);
		return json({ ok: false, error: 'Gagal mengambil riwayat upload' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform?.env?.AI || !platform?.env?.VECTORIZE_INDEX || !platform?.env?.DB) {
		throw error(500, 'AI, Vectorize, atau DB binding tidak tersedia');
	}

	const body = await request.json().catch(() => ({}));
	const text = typeof body.text === 'string' ? body.text.trim() : '';
	const judul = typeof body.judul === 'string' ? body.judul.trim() : '';
	const halaman = body.halaman ?? null;
	const jilid = body.jilid ?? null;

	if (!text || !judul) {
		throw error(400, 'Field text dan judul wajib diisi');
	}

	try {
		const stored = await insertDokumen(platform as App.Platform, text, {
			judul_kitab: judul,
			halaman: halaman ?? undefined,
			jilid: jilid ?? undefined
		});

		return json({ ok: true, stored });
	} catch (err: any) {
		const message = err?.message || 'Gagal menyimpan dokumen';
		return json({ error: message }, { status: 500 });
	}
};
