import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireD1, requireR2Bucket } from '$lib/server/cloudflare';
import { ensureBukuAccessSchema } from '$lib/server/domains/buku/access';
import { ensureBukuLibrarySchema } from '$lib/server/domains/buku/library';
import { buildChapterPdf, buildFullBookPdf } from '$lib/server/domains/buku/drm-pdf';
import {
	DRM_MAX_DEVICES,
	ensureDrmSchema,
	getDrmAccess,
	getDrmChapterContent,
	getDrmPdfKey,
	getRequestIp,
	listDrmChapterContents,
	logDrmAccess,
	normalizeChapterId,
	registerOrTouchDevice
} from '$lib/server/domains/buku/drm';

export const GET: RequestHandler = async ({ request, url, platform, locals }) => {
	if (!locals.user?.id) {
		throw error(401, 'Silakan masuk untuk membaca buku ini.');
	}

	const bookId = url.searchParams.get('book')?.trim();
	const chapterId = normalizeChapterId(url.searchParams.get('chapter'));
	const deviceFingerprint = url.searchParams.get('fp')?.trim() || '';

	if (!bookId) {
		throw error(400, 'Parameter bacaan tidak valid.');
	}

	const db = requireD1({ locals, platform });
	const bucket = requireR2Bucket(platform);
	const userId = locals.user.id;

	await ensureBukuLibrarySchema(db);
	await ensureBukuAccessSchema(db);
	await ensureDrmSchema(db);

	const access = await getDrmAccess(db, { userId, bookId, chapterId });
	if (!access.hasAccess) {
		await logDrmAccess(db, {
			userId,
			bookId,
			chapterId,
			deviceFingerprint,
			action: 'denied_access'
		});
		throw error(403, 'Kamu belum memiliki akses ke bacaan ini.');
	}

	if (deviceFingerprint) {
		const deviceName =
			url.searchParams.get('ua')?.trim() ||
			request.headers.get('user-agent')?.slice(0, 120) ||
			'Perangkat tidak dikenal';
		const device = await registerOrTouchDevice(db, {
			userId,
			fingerprint: deviceFingerprint,
			deviceName,
			deviceIp: getRequestIp(request),
			maxDevices: DRM_MAX_DEVICES
		});

		if (!device.allowed) {
			await logDrmAccess(db, {
				userId,
				bookId,
				chapterId,
				deviceFingerprint,
				action: 'denied_device'
			});
			throw error(403, 'Batas maksimal 3 perangkat tercapai. Hapus perangkat lama di pengaturan akun.');
		}
	}

	const pdfKey = getDrmPdfKey(bookId, chapterId);
	const pdfObject = await bucket.get(pdfKey);

	let pdfBytes: Uint8Array;
	if (pdfObject) {
		pdfBytes = new Uint8Array(await pdfObject.arrayBuffer());
	} else {
		// Fallback: PDF belum pernah diunggah ke R2 — generate dinamis dari konten D1.
		const bookTitle = access.book?.title ?? 'Buku Digital';
		if (chapterId) {
			const chapter = await getDrmChapterContent(db, bookId, chapterId);
			if (!chapter) {
				throw error(404, 'File bacaan belum tersedia.');
			}
			pdfBytes = await buildChapterPdf(bookTitle, chapter);
		} else {
			const chapters = await listDrmChapterContents(db, bookId);
			if (chapters.length === 0) {
				throw error(404, 'File bacaan belum tersedia.');
			}
			pdfBytes = await buildFullBookPdf(bookTitle, chapters);
		}
	}

	await logDrmAccess(db, {
		userId,
		bookId,
		chapterId,
		deviceFingerprint,
		action: 'read'
	});

	const pdfBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;

	return new Response(pdfBuffer, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': 'inline; filename="santrionline-reader.pdf"',
			'Cache-Control': 'no-store, no-cache, must-revalidate, private',
			Pragma: 'no-cache',
			'X-Content-Type-Options': 'nosniff',
			'X-Frame-Options': 'SAMEORIGIN',
			'Referrer-Policy': 'same-origin'
		}
	});
};
