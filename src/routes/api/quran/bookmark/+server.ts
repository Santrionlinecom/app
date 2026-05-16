import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireD1 } from '$lib/server/cloudflare';
import { addQuranBookmark, getQuranBookmark, removeQuranBookmark } from '$lib/server/quran-user';

const parseInteger = (value: unknown) => {
	const parsed = typeof value === 'number' ? value : Number(`${value ?? ''}`.trim());
	return Number.isInteger(parsed) ? parsed : null;
};

const readVerseRefFromUrl = (url: URL) => ({
	surah: parseInteger(url.searchParams.get('surah')),
	ayah: parseInteger(url.searchParams.get('ayah'))
});

const readVerseRefFromRequest = async (request: Request) => {
	const body = await request.json().catch(() => ({}));
	return {
		surah: parseInteger((body as { surah?: unknown }).surah),
		ayah: parseInteger((body as { ayah?: unknown }).ayah)
	};
};

const validateVerseRef = (surah: number | null, ayah: number | null) => {
	if (!surah || surah < 1 || surah > 114) return 'Nomor surah harus angka 1-114.';
	if (!ayah || ayah < 1) return 'Nomor ayat harus angka positif.';
	return '';
};

export const GET: RequestHandler = async (event) => {
	event.setHeaders({ 'cache-control': 'private, no-store' });

	if (!event.locals.user) {
		return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	const { surah, ayah } = readVerseRefFromUrl(event.url);
	const validationError = validateVerseRef(surah, ayah);
	if (validationError) return json({ ok: false, error: validationError }, { status: 400 });

	const db = requireD1(event);
	const bookmark = await getQuranBookmark(db, event.locals.user.id, surah!, ayah!);

	return json({
		ok: true,
		surah,
		ayah,
		bookmark
	});
};

export const POST: RequestHandler = async (event) => {
	event.setHeaders({ 'cache-control': 'private, no-store' });

	if (!event.locals.user) {
		return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	const { surah, ayah } = await readVerseRefFromRequest(event.request);
	const validationError = validateVerseRef(surah, ayah);
	if (validationError) return json({ ok: false, error: validationError }, { status: 400 });

	const db = requireD1(event);
	const bookmark = await addQuranBookmark(db, event.locals.user.id, surah!, ayah!);
	if (!bookmark) {
		return json({ ok: false, error: 'Bookmark tidak bisa disimpan.' }, { status: 400 });
	}

	return json({
		ok: true,
		surah,
		ayah,
		bookmark
	});
};

export const DELETE: RequestHandler = async (event) => {
	event.setHeaders({ 'cache-control': 'private, no-store' });

	if (!event.locals.user) {
		return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	const { surah, ayah } = await readVerseRefFromRequest(event.request);
	const validationError = validateVerseRef(surah, ayah);
	if (validationError) return json({ ok: false, error: validationError }, { status: 400 });

	const db = requireD1(event);
	const removed = await removeQuranBookmark(db, event.locals.user.id, surah!, ayah!);

	return json({
		ok: true,
		surah,
		ayah,
		removed
	});
};
