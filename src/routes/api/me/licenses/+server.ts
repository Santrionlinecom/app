import { json, type RequestHandler } from '@sveltejs/kit';
import { requireD1 } from '$lib/server/cloudflare';
import {
	getFeaturesForLicense,
	getMaxDevicesForLicense,
	getPlanForLicense,
	isLicenseExpired,
	listUserProductLicenses
} from '$lib/server/licenses/digital-products';

export const GET: RequestHandler = async ({ locals, platform, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });

	if (!locals.user?.id) {
		return json({ ok: false, error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	const db = requireD1({ locals, platform });
	const now = Date.now();
	const rows = await listUserProductLicenses(db, {
		id: locals.user.id,
		email: locals.user.email
	});

	return json({
		ok: true,
		licenses: rows.map((license) => ({
			id: license.licenseId,
			productId: license.productId,
			productSlug: license.productSlug,
			productName: license.productName,
			status: isLicenseExpired(license, now) ? 'expired' : license.status,
			plan: getPlanForLicense(license),
			expiresAt: license.expiresAt ?? null,
			features: getFeaturesForLicense(license),
			maxDevices: getMaxDevicesForLicense(license),
			activeDevices: Number(license.activeDevices ?? 0)
		}))
	});
};
