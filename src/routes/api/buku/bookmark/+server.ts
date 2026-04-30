import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ensureBukuLibrarySchema } from '$lib/server/buku-library';
import { addBookmark, ensureBukuProgressSchema, removeBookmark } from '$lib/server/buku-progress';

const readText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const readBookmarkScope = async (request: Request) => {
	const body = await request.json().catch(() => ({}));
	const bookId = readText((body as { bookId?: unknown }).bookId);
	const chapterId = readText((body as { chapterId?: unknown }).chapterId) || null;
	return { bookId, chapterId };
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		return json({ error: 'Database tidak tersedia.' }, { status: 500 });
	}

	const { bookId, chapterId } = await readBookmarkScope(request);
	if (!bookId) {
		return json({ error: 'bookId wajib diisi.' }, { status: 400 });
	}

	await ensureBukuLibrarySchema(db);
	await ensureBukuProgressSchema(db);

	const bookmark = await addBookmark(db, locals.user.id, bookId, chapterId);
	if (!bookmark) {
		return json({ error: 'Buku atau bab tidak ditemukan.' }, { status: 404 });
	}

	return json({ bookmark });
};

export const DELETE: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	const db = locals.db ?? platform?.env?.DB;
	if (!db) {
		return json({ error: 'Database tidak tersedia.' }, { status: 500 });
	}

	const { bookId, chapterId } = await readBookmarkScope(request);
	if (!bookId) {
		return json({ error: 'bookId wajib diisi.' }, { status: 400 });
	}

	await ensureBukuLibrarySchema(db);
	await ensureBukuProgressSchema(db);

	const removed = await removeBookmark(db, locals.user.id, bookId, chapterId);
	return json({ removed });
};
