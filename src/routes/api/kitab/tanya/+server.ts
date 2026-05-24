import { json, error } from '@sveltejs/kit';
import { cariJawaban } from '$lib/server/rag';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';
import { isSuperAdminRole } from '$lib/server/auth/requireSuperAdmin';
import { getRequestIp, logActivity } from '$lib/server/logger';
import type { RequestHandler } from './$types';

const QUERY_MAX_LENGTH = 500;
const QUERY_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const allowedRoles = new Set([
	'admin',
	'SUPER_ADMIN',
	'ustadz',
	'ustadzah',
	'koordinator',
	'santri',
	'alumni'
]);

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const role = locals.user.role ?? '';
	if (!allowedRoles.has(role) && !isSuperAdminRole(role)) {
		throw error(403, 'Fitur tanya kitab belum tersedia untuk role ini');
	}

	if (!platform?.env?.AI || !platform?.env?.VECTORIZE_INDEX) {
		throw error(500, 'Layanan pencarian kitab belum tersedia');
	}

	const body = await request.json().catch(() => ({}));
	const pertanyaan = typeof body.pertanyaan === 'string' ? body.pertanyaan.trim() : '';

	if (!pertanyaan) {
		throw error(400, 'Pertanyaan tidak boleh kosong');
	}
	if (pertanyaan.length > QUERY_MAX_LENGTH) {
		throw error(400, `Pertanyaan maksimal ${QUERY_MAX_LENGTH} karakter`);
	}

	try {
		const db = locals.db ?? platform.env.DB;
		if (db) {
			const isElevated = role === 'admin' || isSuperAdminRole(role);
			const rateLimit = await consumeApiRateLimit({
				db,
				scope: 'kitab:tanya',
				key: `user:${locals.user.id}`,
				limit: isElevated ? 60 : 12,
				windowMs: QUERY_RATE_LIMIT_WINDOW_MS
			});

			if (!rateLimit.allowed) {
				return json(
					{
						ok: false,
						error: 'Limit tanya kitab tercapai. Coba lagi setelah jeda rate limit.',
						limit: rateLimit.limit,
						resetAt: rateLimit.resetAt
					},
					{ status: 429, headers: buildRateLimitHeaders(rateLimit) }
				);
			}
		}

		const result = await cariJawaban(platform as App.Platform, pertanyaan);
		logActivity(db, 'KITAB_TANYA_QUERY', {
			userId: locals.user.id,
			userEmail: locals.user.email,
			ipAddress: getRequestIp(request),
			metadata: {
				role,
				queryLength: pertanyaan.length,
				referenceCount: result.referensi.length
			},
			waitUntil: platform.context?.waitUntil
		});

		return json({ ok: true, jawaban: result.jawaban, referensi: result.referensi });
	} catch (err: any) {
		const message = err?.message || 'Gagal mendapatkan jawaban';
		return json({ ok: false, error: message }, { status: 500 });
	}
};
