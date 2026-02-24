import { error, json, type RequestHandler } from '@sveltejs/kit';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import {
	ensureLicenseTables,
	logLicenseEvent,
	normalizeLicenseKey,
	normalizeEpochMs,
	type LicenseStatus
} from '$lib/server/license/db';

const isStatus = (value: string): value is LicenseStatus =>
	value === 'active' || value === 'revoked' || value === 'expired';

export const GET: RequestHandler = async ({ locals, params }) => {
	const { db } = requireSuperAdmin(locals);
	await ensureLicenseTables(db);

	const licenseKey = normalizeLicenseKey(params.key || '');
	if (!licenseKey) {
		throw error(400, 'License key tidak valid');
	}

	const item = await db
		.prepare(
			`SELECT l.license_key, l.user_id, l.user_email, l.plan, l.status, l.device_limit, l.created_at, l.expires_at, l.notes,
				(SELECT COUNT(*) FROM devices d WHERE d.license_key = l.license_key) as device_count,
				(SELECT MAX(d.last_seen_at) FROM devices d WHERE d.license_key = l.license_key) as last_seen_at
			 FROM licenses l
			 WHERE l.license_key = ?`
		)
		.bind(licenseKey)
		.first();
	if (!item) {
		throw error(404, 'License tidak ditemukan');
	}

	return json({
		item: {
			...item,
			expires_at: normalizeEpochMs((item as Record<string, unknown>).expires_at)
		}
	});
};

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const { db, user } = requireSuperAdmin(locals);
	await ensureLicenseTables(db);

	const licenseKey = normalizeLicenseKey(params.key || '');
	if (!licenseKey) {
		throw error(400, 'License key tidak valid');
	}

	const current = await db
		.prepare(
			`SELECT license_key, user_id, user_email, plan, status, device_limit, created_at, expires_at, notes
			 FROM licenses
			 WHERE license_key = ?`
		)
		.bind(licenseKey)
		.first<{
			license_key: string;
			status: LicenseStatus;
			device_limit: number;
			user_email: string | null;
			expires_at: number | null;
			notes: string | null;
		}>();
	if (!current) {
		throw error(404, 'License tidak ditemukan');
	}

	const body = await request.json().catch(() => ({}));

	const updates: string[] = [];
	const bindValues: Array<string | number | null> = [];

	let nextStatus = current.status;
	if (body?.status !== undefined) {
		if (typeof body.status !== 'string' || !isStatus(body.status)) {
			throw error(400, 'Status tidak valid');
		}
		nextStatus = body.status;
		updates.push('status = ?');
		bindValues.push(nextStatus);
	}

	if (body?.device_limit !== undefined) {
		const value = Number(body.device_limit);
		if (!Number.isFinite(value) || value < 1 || value > 50) {
			throw error(400, 'device_limit harus antara 1-50');
		}
		updates.push('device_limit = ?');
		bindValues.push(Math.floor(value));
	}

	if (body?.expires_at !== undefined) {
		let expiresAt: number | null = null;
		if (body.expires_at !== null && body.expires_at !== '') {
			expiresAt = normalizeEpochMs(body.expires_at);
			if (!Number.isFinite(expiresAt)) {
				throw error(400, 'expires_at tidak valid');
			}
		}
		updates.push('expires_at = ?');
		bindValues.push(expiresAt);
	}

	if (body?.user_email !== undefined) {
		const userEmail = typeof body.user_email === 'string' ? body.user_email.trim() : '';
		updates.push('user_email = ?');
		bindValues.push(userEmail || null);
	}

	if (body?.notes !== undefined) {
		const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
		updates.push('notes = ?');
		bindValues.push(notes || null);
	}

	if (updates.length === 0) {
		throw error(400, 'Tidak ada field yang diperbarui');
	}

	bindValues.push(licenseKey);
	await db
		.prepare(`UPDATE licenses SET ${updates.join(', ')} WHERE license_key = ?`)
		.bind(...bindValues)
		.run();

	const now = Date.now();
	if (current.status !== nextStatus && nextStatus === 'revoked') {
		await logLicenseEvent(db, {
			licenseKey,
			eventType: 'revoke',
			meta: {
				from: current.status,
				to: nextStatus,
				byUserId: user.id,
				byEmail: user.email
			},
			now
		});
	} else {
		await logLicenseEvent(db, {
			licenseKey,
			eventType: 'activate',
			meta: {
				action: 'patch',
				from: current.status,
				to: nextStatus,
				byUserId: user.id,
				byEmail: user.email,
				updatedFields: updates
			},
			now
		});
	}

	const updated = await db
		.prepare(
			`SELECT license_key, user_id, user_email, plan, status, device_limit, created_at, expires_at, notes
			 FROM licenses
			 WHERE license_key = ?`
		)
		.bind(licenseKey)
		.first();

	return json({
		ok: true,
		item: updated
			? {
					...updated,
					expires_at: normalizeEpochMs((updated as Record<string, unknown>).expires_at)
				}
			: null
	});
};
