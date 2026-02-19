import { json, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { D1Database } from '@cloudflare/workers-types';

const ADMIN_ROLES = new Set(['admin', 'tamir', 'bendahara', 'SUPER_ADMIN']);
const MAX_CALENDAR_RANGE_DAYS = 370;

const requireDb = (locals: App.Locals) => {
	if (!locals.db) {
		throw error(500, 'Database not available');
	}
	return locals.db as D1Database;
};

const normalizeOrgId = (value: string | null) => {
	if (!value) return null;
	const trimmed = value.trim().toLowerCase();
	if (!trimmed || trimmed === 'public' || trimmed === 'umum') return null;
	if (trimmed.length > 80) {
		throw error(400, 'orgId tidak valid');
	}
	return trimmed;
};

const parseIsoDate = (value: string | null, label: string) => {
	if (!value) {
		throw error(400, `${label} harus diisi (YYYY-MM-DD)`);
	}
	const validPattern = /^\d{4}-\d{2}-\d{2}$/;
	if (!validPattern.test(value)) {
		throw error(400, `${label} tidak valid (YYYY-MM-DD)`);
	}
	const ts = Date.parse(`${value}T00:00:00.000Z`);
	if (!Number.isFinite(ts)) {
		throw error(400, `${label} tidak valid (YYYY-MM-DD)`);
	}
	return ts;
};

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		const start = url.searchParams.get('start');
		const end = url.searchParams.get('end');
		const orgParam = url.searchParams.get('orgId');

		const startTs = parseIsoDate(start, 'start');
		const endTs = parseIsoDate(end, 'end');
		const startValue = start as string;
		const endValue = end as string;
		if (endTs < startTs) {
			throw error(400, 'Rentang tanggal tidak valid');
		}
		const rangeDays = Math.floor((endTs - startTs) / 86400000) + 1;
		if (rangeDays > MAX_CALENDAR_RANGE_DAYS) {
			throw error(400, `Rentang maksimal ${MAX_CALENDAR_RANGE_DAYS} hari`);
		}
		if (!locals.db) {
			return json({ notes: [] });
		}

		const db = requireDb(locals);
		const orgId = normalizeOrgId(orgParam);

		const baseSelect = `SELECT cn.id,
					        cn.user_id as userId,
					        cn.role,
					        cn.title,
					        cn.content,
					        cn.event_date as eventDate,
					        cn.created_at as createdAt,
					        cn.updated_at as updatedAt,
					        u.org_id as orgId,
					        o.name as orgName,
					        o.slug as orgSlug,
					        o.type as orgType
					   FROM calendar_notes cn
					   LEFT JOIN users u ON u.id = cn.user_id
					   LEFT JOIN organizations o ON o.id = u.org_id`;
		const conditions = ['cn.event_date BETWEEN ? AND ?'];
		const params: (string | number)[] = [startValue, endValue];

		if (orgId) {
			conditions.push('u.org_id = ?');
			params.push(orgId);
		} else {
			conditions.push('u.org_id IS NULL');
		}

		// Public endpoint: hanya tampilkan catatan dari admin/tamir/bendahara/SUPER_ADMIN
		conditions.push(
			`u.role IN (${Array.from(ADMIN_ROLES).map(() => '?').join(', ')})`
		);
		params.push(...Array.from(ADMIN_ROLES));

		const query = `${baseSelect} WHERE ${conditions.join(' AND ')}`;
		const { results } =
			(await db.prepare(`${query} ORDER BY cn.event_date ASC, cn.created_at ASC`).bind(...params).all()) ??
			{};

		return json({ notes: results ?? [] });
	} catch (err) {
		if (isHttpError(err)) {
			return json({ error: err.body?.message ?? 'Request tidak valid' }, { status: err.status });
		}
		console.error('GET /api/calendar error', err);
		return json({ error: 'Internal Error: pastikan tabel calendar_notes sudah ada.' }, { status: 500 });
	}
};
