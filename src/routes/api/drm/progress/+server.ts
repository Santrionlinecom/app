import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireD1 } from '$lib/server/cloudflare';
import { ensureBukuAccessSchema } from '$lib/server/domains/buku/access';
import { ensureBukuLibrarySchema } from '$lib/server/domains/buku/library';
import { saveReadingProgress } from '$lib/server/domains/buku/progress';
import {
	ensureDrmSchema,
	getDrmAccess,
	normalizeChapterId,
	saveDrmProgress
} from '$lib/server/domains/buku/drm';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	if (!locals.user?.id) {
		throw error(401, 'Silakan masuk untuk melanjutkan.');
	}

	const { bookId, chapterId, currentPage, totalPages } = await request.json();
	const normalizedBookId = String(bookId || '').trim();
	const normalizedChapterId = normalizeChapterId(chapterId);
	if (!normalizedBookId) {
		throw error(400, 'Parameter bacaan tidak valid.');
	}

	const db = requireD1({ locals, platform });
	await ensureBukuLibrarySchema(db);
	await ensureBukuAccessSchema(db);
	await ensureDrmSchema(db);

	const access = await getDrmAccess(db, {
		userId: locals.user.id,
		bookId: normalizedBookId,
		chapterId: normalizedChapterId
	});

	if (!access.hasAccess) {
		throw error(403, 'Kamu belum memiliki akses ke bacaan ini.');
	}

	const progress = await saveDrmProgress(db, {
		userId: locals.user.id,
		bookId: normalizedBookId,
		chapterId: normalizedChapterId,
		currentPage,
		totalPages
	});

	if (access.chapter) {
		await saveReadingProgress(
			db,
			locals.user.id,
			normalizedBookId,
			access.chapter.id,
			access.chapter.chapterNumber,
			progress.percentage
		);
	}

	return json({ success: true, progress });
};
