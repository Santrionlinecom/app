import type { D1Database } from '@cloudflare/workers-types';
import { buildStrmLicenseKey, isStrmLicenseKeyFormat, normalizeStrmLicenseKey } from './key-format';
import {
	countStreamerDevices,
	ensureStreamerLicenseTables,
	getStreamerDevice,
	getStreamerLicenseByKey,
	isStreamerLicenseUsable,
	logStreamerLicenseEvent,
	normalizeDeviceIdHash,
	removeStreamerDevice,
	upsertStreamerDevice,
	type StreamerLicenseRow
} from './streamer-db';

export type DesktopLicenseResponse =
	| {
			ok: true;
			plan: string;
			email: string;
	  }
	| {
			ok: false;
			reason: string;
	  };

type DesktopAction = 'activate' | 'validate' | 'deactivate';

type DesktopLicensePayload = {
	key: string;
	machineId: string;
};

const EMPTY_EMAIL = '';

const REQUEST_INVALID_REASON = 'request invalid';
const KEY_NOT_FOUND_REASON = 'key tidak ditemukan';
const KEY_REVOKED_REASON = 'key revoked/nonaktif';
const KEY_EXPIRED_REASON = 'key expired';
const DEVICE_MISMATCH_REASON = 'device mismatch';
const KEY_ACTIVE_ELSEWHERE_REASON = 'key sudah aktif di device lain';
const SERVER_ERROR_REASON = 'server error';

const ok = (license: StreamerLicenseRow): DesktopLicenseResponse => ({
	ok: true,
	plan: license.plan_type,
	email: EMPTY_EMAIL
});

const fail = (reason: string): DesktopLicenseResponse => ({
	ok: false,
	reason
});

const getFailureEventType = (action: DesktopAction) => `${action}_failed`;

const parseDesktopPayload = (body: Record<string, unknown>): DesktopLicensePayload | null => {
	const key = typeof body.key === 'string' ? normalizeStrmLicenseKey(body.key) : '';
	const machineIdRaw = typeof body.machineId === 'string' ? body.machineId.trim() : '';
	const machineId = machineIdRaw ? normalizeDeviceIdHash(machineIdRaw) : '';

	if (!key || !machineId) return null;
	if (machineId.length > 255) return null;
	if (!isStrmLicenseKeyFormat(key)) return null;

	return { key, machineId };
};

const resolveLicense = async (params: {
	action: DesktopAction;
	body: Record<string, unknown>;
	db: D1Database;
	ip?: string | null;
}): Promise<
	| {
			response: DesktopLicenseResponse;
	  }
	| {
			license: StreamerLicenseRow;
			machineId: string;
			now: number;
	  }
> => {
	const payload = parseDesktopPayload(params.body);
	if (!payload) {
		return { response: fail(REQUEST_INVALID_REASON) } as const;
	}

	const now = Date.now();
	const license = await getStreamerLicenseByKey(params.db, payload.key);
	if (!license) {
		await logStreamerLicenseEvent(params.db, {
			eventType: getFailureEventType(params.action),
			meta: { reason: 'license_not_found', key: payload.key, machine_id: payload.machineId, ip: params.ip },
			now
		});
		return { response: fail(KEY_NOT_FOUND_REASON) } as const;
	}

	const usable = isStreamerLicenseUsable(license, now);
	if (!usable.ok) {
		await logStreamerLicenseEvent(params.db, {
			licenseId: license.id,
			eventType: getFailureEventType(params.action),
			meta: { reason: usable.code, key: payload.key, machine_id: payload.machineId, ip: params.ip },
			now
		});
		return {
			response: fail(usable.code === 'revoked' ? KEY_REVOKED_REASON : KEY_EXPIRED_REASON)
		} as const;
	}

	return { license, machineId: payload.machineId, now } as const;
};

export const isDesktopLicenseContractRequest = (body: Record<string, unknown>) =>
	Object.prototype.hasOwnProperty.call(body, 'key') || Object.prototype.hasOwnProperty.call(body, 'machineId');

export const desktopLicenseResponseStatus = (response: DesktopLicenseResponse) => {
	if (response.ok) return 200;
	switch (response.reason) {
		case REQUEST_INVALID_REASON:
			return 400;
		case KEY_NOT_FOUND_REASON:
			return 404;
		case KEY_REVOKED_REASON:
		case KEY_EXPIRED_REASON:
			return 403;
		case DEVICE_MISMATCH_REASON:
		case KEY_ACTIVE_ELSEWHERE_REASON:
			return 409;
		default:
			return 500;
	}
};

export const desktopServerError = () => fail(SERVER_ERROR_REASON);

export const activateDesktopLicense = async (params: {
	body: Record<string, unknown>;
	db: D1Database;
	ip?: string | null;
}): Promise<DesktopLicenseResponse> => {
	await ensureStreamerLicenseTables(params.db);

	const resolved = await resolveLicense({
		action: 'activate',
		body: params.body,
		db: params.db,
		ip: params.ip
	});
	if ('response' in resolved) return resolved.response;

	const { license, machineId, now } = resolved;
	const existingDevice = await getStreamerDevice(params.db, license.id, machineId);

	if (!existingDevice) {
		const deviceCount = await countStreamerDevices(params.db, license.id);
		if (deviceCount >= license.max_devices) {
			await logStreamerLicenseEvent(params.db, {
				licenseId: license.id,
				eventType: 'activate_failed',
				meta: {
					reason: 'device_limit_reached',
					key: license.license_key_plain,
					machine_id: machineId,
					device_count: deviceCount,
					max_devices: license.max_devices,
					ip: params.ip
				},
				now
			});
			return fail(KEY_ACTIVE_ELSEWHERE_REASON);
		}
	}

	await upsertStreamerDevice(params.db, { licenseId: license.id, deviceIdHash: machineId, now });
	await logStreamerLicenseEvent(params.db, {
		licenseId: license.id,
		eventType: existingDevice ? 'refresh_touch' : 'activate',
		meta: { key: license.license_key_plain, machine_id: machineId, ip: params.ip },
		now
	});

	return ok(license);
};

export const validateDesktopLicense = async (params: {
	body: Record<string, unknown>;
	db: D1Database;
	ip?: string | null;
}): Promise<DesktopLicenseResponse> => {
	await ensureStreamerLicenseTables(params.db);

	const resolved = await resolveLicense({
		action: 'validate',
		body: params.body,
		db: params.db,
		ip: params.ip
	});
	if ('response' in resolved) return resolved.response;

	const { license, machineId, now } = resolved;
	const device = await getStreamerDevice(params.db, license.id, machineId);
	if (!device) {
		await logStreamerLicenseEvent(params.db, {
			licenseId: license.id,
			eventType: 'validate_failed',
			meta: { reason: 'device_mismatch', key: license.license_key_plain, machine_id: machineId, ip: params.ip },
			now
		});
		return fail(DEVICE_MISMATCH_REASON);
	}

	await upsertStreamerDevice(params.db, { licenseId: license.id, deviceIdHash: machineId, now });
	await logStreamerLicenseEvent(params.db, {
		licenseId: license.id,
		eventType: 'validate',
		meta: { key: license.license_key_plain, machine_id: machineId, ip: params.ip },
		now
	});

	return ok(license);
};

export const deactivateDesktopLicense = async (params: {
	body: Record<string, unknown>;
	db: D1Database;
	ip?: string | null;
}): Promise<DesktopLicenseResponse> => {
	await ensureStreamerLicenseTables(params.db);

	const resolved = await resolveLicense({
		action: 'deactivate',
		body: params.body,
		db: params.db,
		ip: params.ip
	});
	if ('response' in resolved) return resolved.response;

	const { license, machineId, now } = resolved;
	const device = await getStreamerDevice(params.db, license.id, machineId);
	if (!device) {
		await logStreamerLicenseEvent(params.db, {
			licenseId: license.id,
			eventType: 'deactivate_failed',
			meta: { reason: 'device_mismatch', key: license.license_key_plain, machine_id: machineId, ip: params.ip },
			now
		});
		return fail(DEVICE_MISMATCH_REASON);
	}

	await removeStreamerDevice(params.db, license.id, machineId);
	await logStreamerLicenseEvent(params.db, {
		licenseId: license.id,
		eventType: 'deactivate',
		meta: { key: license.license_key_plain, machine_id: machineId, ip: params.ip },
		now
	});

	return ok(license);
};

export { buildStrmLicenseKey };
