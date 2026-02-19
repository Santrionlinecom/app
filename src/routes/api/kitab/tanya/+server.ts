import { json, error } from '@sveltejs/kit';
import { cariJawaban } from '$lib/server/rag';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	if (!platform?.env?.AI || !platform?.env?.VECTORIZE_INDEX) {
		throw error(500, 'AI atau Vectorize binding tidak tersedia');
	}

	const body = await request.json().catch(() => ({}));
	const pertanyaan = typeof body.pertanyaan === 'string' ? body.pertanyaan.trim() : '';

	if (!pertanyaan) {
		throw error(400, 'Pertanyaan tidak boleh kosong');
	}

	try {
		const result = await cariJawaban(platform as App.Platform, pertanyaan);
		return json({ ok: true, jawaban: result.jawaban, referensi: result.referensi });
	} catch (err: any) {
		const message = err?.message || 'Gagal mendapatkan jawaban';
		return json({ ok: false, error: message }, { status: 500 });
	}
};
