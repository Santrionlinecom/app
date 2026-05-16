import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireD1 } from '$lib/server/cloudflare';
import { getQuranReadingProgress, saveQuranReadingProgress } from '$lib/server/quran-user';

const parseInteger = (value: unknown) => {
	const parsed = typeof value === 'number' ? value : Number(`${value ?? ''}`.trim());
	return Number.isInteger(parsed) ? parsed : null;
};

const validateVerseRef = (surah: number | null, ayah: number | null, juz: number | null) => {
	if (!surah || surah < 1 || surah > 114) return 'Nomor surah harus angka 1-114.';
	if (!ayah || ayah < 1) return 'Nomor ayat harus angka positif.';
	if (juz !== null && (juz < 1 || juz > 30)) return 'Nomor juz harus angka 1-30.';
	return '';
};

export const GET: RequestHandler = async (event) => {
	event.setHeaders({ 'cache-control': 'private, no-store' });

	if (!event.locals.user) {
		return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	const db = requireD1(event);
	const lastRead = await getQuranReadingProgress(db, event.locals.user.id);

	return json({
		ok: true,
		lastRead
	});
};

export const POST: RequestHandler = async (event) => {
	event.setHeaders({ 'cache-control': 'private, no-store' });

	if (!event.locals.user) {
		return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	const body = await event.request.json().catch(() => ({}));
	const surah = parseInteger((body as { surah?: unknown }).surah);
	const ayah = parseInteger((body as { ayah?: unknown }).ayah);
	const juz = parseInteger((body as { juz?: unknown }).juz);
	const validationError = validateVerseRef(surah, ayah, juz);
	if (validationError) return json({ ok: false, error: validationError }, { status: 400 });

	const db = requireD1(event);
	const lastRead = await saveQuranReadingProgress(db, event.locals.user.id, surah!, ayah!, juz);
	if (!lastRead) {
		return json({ ok: false, error: 'Progress baca tidak bisa disimpan.' }, { status: 400 });
	}

	return json({
		ok: true,
		lastRead
	});
};
