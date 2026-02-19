import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOrganizationBySlug, type OrgType } from '$lib/server/organizations';
import { generateId } from 'lucia';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';
import { getRequestIp } from '$lib/server/logger';

const isOrgType = (value?: string | null): value is OrgType => {
	if (!value) return false;
	return ['pondok', 'masjid', 'musholla', 'tpq', 'rumah-tahfidz'].includes(value);
};

const ORG_SLUG_PATTERN = /^[a-z0-9-]{2,80}$/;
const SOURCE_PATTERN = /^[a-z0-9:_-]{1,64}$/;
const TRAFFIC_RATE_LIMIT = {
	scope: 'traffic:click',
	limit: 80,
	windowMs: 10 * 60 * 1000
};

const normalizeSource = (value: string) => {
	const normalized = value.trim().toLowerCase();
	if (!normalized) return 'direct';
	if (!SOURCE_PATTERN.test(normalized)) return 'direct';
	return normalized;
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const db = locals.db;
	if (!db) throw error(500, 'Database tidak tersedia');

	const body = await request.json().catch(() => ({}));
	const orgSlug = typeof body.orgSlug === 'string' ? body.orgSlug.trim() : '';
	const orgTypeRaw = typeof body.orgType === 'string' ? body.orgType.trim() : '';
	const sourceRaw = typeof body.source === 'string' ? body.source.trim() : '';

	if (!orgSlug || !orgTypeRaw || !isOrgType(orgTypeRaw)) {
		throw error(400, 'Data tidak valid');
	}
	if (!ORG_SLUG_PATTERN.test(orgSlug)) {
		throw error(400, 'Slug organisasi tidak valid');
	}

	const org = await getOrganizationBySlug(db, orgSlug, orgTypeRaw);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}

	const source = normalizeSource(sourceRaw);
	const requesterIp = getRequestIp(request) ?? 'unknown';
	try {
		const rateLimit = await consumeApiRateLimit({
			db,
			scope: TRAFFIC_RATE_LIMIT.scope,
			key: `${requesterIp}:${org.id}`,
			limit: TRAFFIC_RATE_LIMIT.limit,
			windowMs: TRAFFIC_RATE_LIMIT.windowMs
		});
		if (!rateLimit.allowed) {
			return json(
				{
					ok: false,
					error: 'Terlalu banyak request. Coba lagi sebentar.',
					limit: rateLimit.limit,
					resetAt: rateLimit.resetAt
				},
				{ status: 429, headers: buildRateLimitHeaders(rateLimit) }
			);
		}
	} catch (err) {
		console.warn('Rate limit traffic gagal:', err);
	}

	const now = Date.now();
	await db
		.prepare(
			`INSERT INTO traffic_sources (id, organization_id, source, total_clicks, last_clicked, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)
			 ON CONFLICT(organization_id, source)
			 DO UPDATE SET total_clicks = total_clicks + 1, last_clicked = excluded.last_clicked`
		)
		.bind(generateId(15), org.id, source, 1, now, now)
		.run();

	return json({ ok: true });
};
