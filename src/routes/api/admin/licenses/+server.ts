import { error, json, type RequestHandler } from '@sveltejs/kit';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import {
	ensureLicenseTables,
	generateUniqueLicenseKey,
	logLicenseEvent,
	normalizeEpochMs,
	type LicensePlan
} from '$lib/server/license/db';

const isPlan = (value: string): value is LicensePlan =>
	value === 'starter' || value === 'pro' || value === 'studio';

const isStatus = (value: string) =>
	value === 'active' || value === 'revoked' || value === 'expired';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { db } = requireSuperAdmin(locals);
	await ensureLicenseTables(db);

	const query = (url.searchParams.get('query') ?? '').trim();
	const status = (url.searchParams.get('status') ?? '').trim();
	const plan = (url.searchParams.get('plan') ?? '').trim();

	const where: string[] = [];
	const params: Array<string | number> = [];

	if (query) {
		where.push('(l.license_key LIKE ? OR l.user_email LIKE ?)');
		params.push(`%${query}%`, `%${query}%`);
	}
	if (status && isStatus(status)) {
		where.push('l.status = ?');
		params.push(status);
	}
	if (plan && isPlan(plan)) {
		where.push('l.plan = ?');
		params.push(plan);
	}

	const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
	const { results } = await db
		.prepare(
			`SELECT l.license_key, l.user_id, l.user_email, l.plan, l.status, l.device_limit, l.created_at, l.expires_at, l.notes,
				(SELECT COUNT(*) FROM devices d WHERE d.license_key = l.license_key) as device_count,
				(SELECT MAX(d.last_seen_at) FROM devices d WHERE d.license_key = l.license_key) as last_seen_at
			 FROM licenses l
			 ${whereClause}
			 ORDER BY l.created_at DESC
			 LIMIT 200`
		)
		.bind(...params)
		.all();
	const items = (results ?? []).map((row: Record<string, unknown>) => ({
		...row,
		expires_at: normalizeEpochMs(row.expires_at)
	}));

	return json({
		items,
		filters: {
			query,
			status,
			plan
		}
	});
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const { db, user } = requireSuperAdmin(locals);
	await ensureLicenseTables(db);

	const body = await request.json().catch(() => ({}));
	const userEmail = typeof body?.user_email === 'string' ? body.user_email.trim() : null;
	const notes = typeof body?.notes === 'string' ? body.notes.trim() : null;
	const planRaw = typeof body?.plan === 'string' ? body.plan.trim().toLowerCase() : '';
	const deviceLimitRaw = Number(body?.device_limit);

	if (!isPlan(planRaw)) {
		throw error(400, 'Plan tidak valid');
	}
	if (!Number.isFinite(deviceLimitRaw) || deviceLimitRaw < 1 || deviceLimitRaw > 50) {
		throw error(400, 'device_limit harus antara 1-50');
	}

	let expiresAt: number | null = null;
	if (body?.expires_at !== undefined && body?.expires_at !== null && body?.expires_at !== '') {
		expiresAt = normalizeEpochMs(body.expires_at);
		if (expiresAt == null || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
			throw error(400, 'expires_at tidak valid');
		}
	}

	const licenseKey = await generateUniqueLicenseKey(db, planRaw);
	const now = Date.now();

	await db
		.prepare(
			`INSERT INTO licenses (
				license_key, user_id, user_email, plan, status, device_limit, created_at, expires_at, notes
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			licenseKey,
			null,
			userEmail || null,
			planRaw,
			'active',
			Math.floor(deviceLimitRaw),
			now,
			expiresAt,
			notes || null
		)
		.run();

	await logLicenseEvent(db, {
		licenseKey,
		eventType: 'generate',
		meta: {
			byUserId: user.id,
			byEmail: user.email,
			plan: planRaw,
			deviceLimit: Math.floor(deviceLimitRaw),
			expiresAt,
			userEmail: userEmail || null
		},
		now
	});

	const created = await db
		.prepare(
			`SELECT license_key, user_id, user_email, plan, status, device_limit, created_at, expires_at, notes
			 FROM licenses
			 WHERE license_key = ?`
		)
		.bind(licenseKey)
		.first();

	return json(
		{
			ok: true,
			item: created
				? {
						...created,
						expires_at: normalizeEpochMs((created as Record<string, unknown>).expires_at)
					}
				: null
		},
		{ status: 201 }
	);
};
