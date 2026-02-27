import { json, error } from '@sveltejs/kit';
import { extractPdfTextPages, splitText, toDriveDownloadUrl } from '$lib/server/pdf';
import { insertDokumen } from '$lib/server/rag';
import { getOrganizationById } from '$lib/server/organizations';
import { isEducationalOrgType } from '$lib/server/utils';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';
import { isSuperAdminRole } from '$lib/server/auth/requireSuperAdmin';
import type { RequestHandler } from './$types';

const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_PDF_PAGES = 300;
const MAX_TEXT_CHUNKS = 1200;
const allowedRoles = new Set(['admin', 'ustadz', 'ustadzah', 'SUPER_ADMIN']);
const JSON_UPLOAD_RATE_LIMIT = { scope: 'kitab:upload:text', limit: 30, windowMs: 10 * 60 * 1000 };
const PDF_UPLOAD_RATE_LIMIT = { scope: 'kitab:upload:pdf', limit: 6, windowMs: 30 * 60 * 1000 };

const assertKitabAccess = async (locals: App.Locals) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
	const role = locals.user.role ?? '';
	if (!allowedRoles.has(role) && !isSuperAdminRole(role)) {
		throw error(403, 'Forbidden');
	}
	if (isSuperAdminRole(role)) {
		return locals.user;
	}
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}
	if (!locals.user.orgId) {
		throw error(403, 'Akun belum terhubung ke lembaga.');
	}
	const org = await getOrganizationById(locals.db, locals.user.orgId);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}
	if (!isEducationalOrgType(org.type)) {
		throw error(403, 'Fitur kitab hanya untuk lembaga pendidikan.');
	}
	return locals.user;
};

export const GET: RequestHandler = async ({ platform, locals }) => {
	await assertKitabAccess(locals);
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

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const user = await assertKitabAccess(locals);
	if (!platform?.env?.AI || !platform?.env?.VECTORIZE_INDEX || !platform?.env?.DB) {
		throw error(500, 'AI, Vectorize, atau DB binding tidak tersedia');
	}
	const bucket = platform?.env?.BUCKET;

	const contentType = request.headers.get('content-type') ?? '';
	const rateLimitConfig = contentType.includes('multipart/form-data')
		? PDF_UPLOAD_RATE_LIMIT
		: JSON_UPLOAD_RATE_LIMIT;
	const rateLimitDb = locals.db ?? platform?.env?.DB;
	if (rateLimitDb) {
		try {
			const rateLimit = await consumeApiRateLimit({
				db: rateLimitDb,
				scope: rateLimitConfig.scope,
				key: `user:${user.id}`,
				limit: rateLimitConfig.limit,
				windowMs: rateLimitConfig.windowMs
			});
			if (!rateLimit.allowed) {
				return json(
					{
						ok: false,
						error: 'Terlalu banyak upload kitab. Coba lagi sebentar.',
						limit: rateLimit.limit,
						resetAt: rateLimit.resetAt
					},
					{ status: 429, headers: buildRateLimitHeaders(rateLimit) }
				);
			}
		} catch (err) {
			console.warn('Rate limit kitab upload gagal:', err);
		}
	}

	if (contentType.includes('application/json')) {
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
	}

	if (!contentType.includes('multipart/form-data')) {
		throw error(415, 'Format upload tidak didukung');
	}

	const formData = await request.formData();
	const judul = typeof formData.get('judul') === 'string' ? `${formData.get('judul')}`.trim() : '';
	const jilidRaw = typeof formData.get('jilid') === 'string' ? `${formData.get('jilid')}`.trim() : '';
	const pageOffsetRaw =
		typeof formData.get('pageOffset') === 'string' ? `${formData.get('pageOffset')}`.trim() : '';
	const driveUrlRaw =
		typeof formData.get('driveUrl') === 'string' ? `${formData.get('driveUrl')}`.trim() : '';
	const pdfFile = formData.get('pdf');

	if (!judul) {
		throw error(400, 'Judul kitab wajib diisi');
	}

	const pageOffset = Number.parseInt(pageOffsetRaw || '1', 10);
	const startPage = Number.isFinite(pageOffset) && pageOffset > 0 ? pageOffset : 1;
	const jilid = jilidRaw ? jilidRaw : null;

	let pdfBuffer: ArrayBuffer | null = null;
	let source = 'upload';

	if (pdfFile instanceof File) {
		if (pdfFile.size > MAX_PDF_BYTES) {
			throw error(413, 'Ukuran PDF melebihi 20MB');
		}
		pdfBuffer = await pdfFile.arrayBuffer();
	} else if (driveUrlRaw) {
		const downloadUrl = toDriveDownloadUrl(driveUrlRaw);
		if (!downloadUrl) {
			throw error(400, 'Link Google Drive tidak valid');
		}
		const response = await fetch(downloadUrl, { redirect: 'follow' });
		if (!response.ok) {
			throw error(400, 'Gagal mengunduh file dari Google Drive');
		}
		const buffer = await response.arrayBuffer();
		if (buffer.byteLength > MAX_PDF_BYTES) {
			throw error(413, 'Ukuran PDF melebihi 20MB');
		}
		pdfBuffer = buffer;
		source = 'drive';
	}

	if (!pdfBuffer) {
		throw error(400, 'File PDF atau link Google Drive wajib diisi');
	}

	const extracted = await extractPdfTextPages(pdfBuffer, { maxPages: MAX_PDF_PAGES });
	if (!extracted) {
		throw error(400, 'Teks tidak ditemukan dalam PDF');
	}

	let storedChunks = 0;
	for (const page of extracted.pages) {
		const pageNumber = startPage + page.pageNumber - 1;
		const chunks = splitText(page.text);
		for (const chunk of chunks) {
			storedChunks += 1;
			if (storedChunks > MAX_TEXT_CHUNKS) {
				throw error(413, 'Dokumen terlalu besar untuk diproses sekaligus');
			}
			await insertDokumen(platform as App.Platform, chunk, {
				judul_kitab: judul,
				halaman: pageNumber,
				jilid: jilid ?? undefined
			});
		}
	}

	let fileKey: string | null = null;
	if (bucket) {
		fileKey = `kitab/${crypto.randomUUID()}.pdf`;
		await bucket.put(fileKey, pdfBuffer, {
			httpMetadata: { contentType: 'application/pdf' },
			customMetadata: {
				judul,
				jilid: jilid ?? '',
				source
			}
		});
	}

	return json({
		ok: true,
		totalPages: extracted.totalPages,
		processedPages: extracted.pages.length,
		chunks: storedChunks,
		fileKey
	});
};
