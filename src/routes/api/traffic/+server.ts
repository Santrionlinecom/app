import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOrganizationBySlug, type OrgType } from '$lib/server/organizations';
import { generateId } from 'lucia';

const isOrgType = (value?: string | null): value is OrgType => {
	if (!value) return false;
	return ['pondok', 'masjid', 'musholla', 'tpq', 'rumah-tahfidz'].includes(value);
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

	const org = await getOrganizationBySlug(db, orgSlug, orgTypeRaw);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}

	const source = sourceRaw || 'direct';
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
