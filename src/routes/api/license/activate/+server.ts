import { json, type RequestHandler } from '@sveltejs/kit';
import { getRequestIp } from '$lib/server/logger';
import {
	countStreamerDevices,
	ensureStreamerLicenseTables,
	getStreamerDevice,
	getStreamerLicenseByHash,
	hashLicenseKey,
	isStreamerLicenseUsable,
	logStreamerLicenseEvent,
	normalizeDeviceIdHash,
	upsertStreamerDevice
} from '$lib/server/license/streamer-db';
import { buildClaimsFromLicense, generateLicenseToken } from '$lib/server/license/streamer-token';

const bad = (status: number, error: string, message: string) => json({ ok: false, error, message }, { status });
const methodNotAllowed = () =>
	json({ ok: false, message: 'Method not allowed. Gunakan POST.' }, { status: 405 });
const notAllowedHandler: RequestHandler = async () => methodNotAllowed();

const getSigningSecret = (platform: App.Platform | undefined) =>
	((platform?.env as Record<string, unknown> | undefined)?.STREAMER_LICENSE_SIGNING_SECRET as string | undefined) ||
	((platform?.env as Record<string, unknown> | undefined)?.LICENSE_SIGNING_SECRET as string | undefined);

export const GET = notAllowedHandler;
export const PUT = notAllowedHandler;
export const PATCH = notAllowedHandler;
export const DELETE = notAllowedHandler;
export const OPTIONS = notAllowedHandler;

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const db = locals.db ?? platform?.env?.DB;
	if (!db) return bad(503, 'db_unavailable', 'Database D1 tidak tersedia');

	await ensureStreamerLicenseTables(db);

	let body: Record<string, unknown> = {};
	try {
		body = (await request.json()) as Record<string, unknown>;
	} catch {
		return bad(400, 'invalid_json', 'Body JSON tidak valid');
	}

	const licenseKey = typeof body.license_key === 'string' ? body.license_key.trim() : '';
	const deviceIdHashRaw = typeof body.device_id_hash === 'string' ? body.device_id_hash.trim() : '';
	const app = typeof body.app === 'string' ? body.app.trim() : '';
	const version = typeof body.version === 'string' ? body.version.trim() : '';

	if (!licenseKey || !deviceIdHashRaw || !app || !version) {
		return bad(400, 'invalid_payload', 'license_key, device_id_hash, app, dan version wajib diisi');
	}
	if (app !== 'santri-streamer') {
		return bad(400, 'invalid_app', 'app harus "santri-streamer"');
	}

	const deviceIdHash = normalizeDeviceIdHash(deviceIdHashRaw);
	if (deviceIdHash.length < 8 || deviceIdHash.length > 255) {
		return bad(400, 'invalid_device_id_hash', 'device_id_hash tidak valid');
	}

	const now = Date.now();
	const ip = getRequestIp(request);
	const licenseKeyHash = await hashLicenseKey(licenseKey);
	const license = await getStreamerLicenseByHash(db, licenseKeyHash);

	if (!license) {
		await logStreamerLicenseEvent(db, {
			eventType: 'activate_failed',
			meta: { reason: 'license_not_found', app, version: version || null, device_id_hash: deviceIdHash, ip }
		});
		return bad(404, 'license_not_found', 'License tidak ditemukan');
	}

	const usable = isStreamerLicenseUsable(license, now);
	if (!usable.ok) {
		await logStreamerLicenseEvent(db, {
			licenseId: license.id,
			eventType: 'activate_failed',
			meta: { reason: usable.code, app, version: version || null, device_id_hash: deviceIdHash, ip },
			now
		});
		return bad(usable.code === 'revoked' ? 403 : 403, usable.code, `License ${usable.code}`);
	}

	const existingDevice = await getStreamerDevice(db, license.id, deviceIdHash);
	if (!existingDevice) {
		const deviceCount = await countStreamerDevices(db, license.id);
		if (deviceCount >= license.max_devices) {
			await logStreamerLicenseEvent(db, {
				licenseId: license.id,
				eventType: 'activate_failed',
				meta: {
					reason: 'device_limit_reached',
					app,
					version: version || null,
					device_id_hash: deviceIdHash,
					device_count: deviceCount,
					max_devices: license.max_devices,
					ip
				},
				now
			});
			return bad(409, 'device_limit_reached', 'Batas device untuk license ini sudah penuh');
		}
	}

	await upsertStreamerDevice(db, { licenseId: license.id, deviceIdHash, now });
	await logStreamerLicenseEvent(db, {
		licenseId: license.id,
		eventType: existingDevice ? 'refresh_touch' : 'activate',
		meta: { app, version: version || null, device_id_hash: deviceIdHash, ip },
		now
	});

	const signingSecret = getSigningSecret(platform);
	if (!signingSecret) {
		return bad(500, 'signing_secret_missing', 'Signing secret license belum dikonfigurasi');
	}

	let token = '';
	try {
		token = await generateLicenseToken(
			buildClaimsFromLicense({
				license,
				validUntilMs: usable.validUntil ?? null,
				issuedAtMs: now,
				deviceIdHash,
				app
			}),
			signingSecret
		);
	} catch {
		return bad(500, 'signing_secret_missing', 'Signing secret belum dikonfigurasi');
	}

	return json({ token });
};
