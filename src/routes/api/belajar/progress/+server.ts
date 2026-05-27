import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	requireSantriLearnContext,
	saveLearnProgressAnswer
} from '$lib/server/santri-learn';

const readText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const POST: RequestHandler = async ({ locals, request, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });

	if (!locals.user) {
		return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const modulId = readText((body as { modul_id?: unknown }).modul_id);
	const soalId = readText((body as { soal_id?: unknown }).soal_id);
	const jawaban = readText((body as { jawaban?: unknown }).jawaban);

	if (!modulId || !soalId || !jawaban) {
		return json(
			{ ok: false, error: 'modul_id, soal_id, dan jawaban wajib diisi.' },
			{ status: 400 }
		);
	}

	const { db, user, lembagaId } = await requireSantriLearnContext(locals);
	const result = await saveLearnProgressAnswer(db, {
		userId: user.id,
		lembagaId,
		modulId,
		soalId,
		jawaban
	});

	return json({
		ok: true,
		benar: result.is_benar,
		...result
	});
};
