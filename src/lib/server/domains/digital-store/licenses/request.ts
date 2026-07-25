/** Shared request parsing for unified digital product license APIs. */

export type LicenseApiBody = {
	licenseKey: string;
	deviceHash: string;
	productSlug: string;
	deviceName: string;
	appVersion: string;
};

const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const parseLicenseApiBody = async (request: Request): Promise<LicenseApiBody> => {
	const body = await request.json().catch(() => ({} as Record<string, unknown>));
	const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};

	return {
		licenseKey: asString(record.licenseKey) || asString(record.license_key),
		deviceHash: asString(record.deviceHash) || asString(record.device_hash),
		productSlug: asString(record.productSlug) || asString(record.product_slug),
		deviceName: asString(record.deviceName) || asString(record.device_name),
		appVersion: asString(record.appVersion) || asString(record.app_version)
	};
};

export const licensePayload = (
	status: string,
	plan: string | null = null,
	expiresAt: number | null = null,
	features: string[] = [],
	detail?: { missingFields?: string[]; invalidFields?: string[] }
) => ({
	status,
	plan,
	expiresAt,
	features,
	...(detail ? { detail } : {})
});
