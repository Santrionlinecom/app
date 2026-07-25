import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import {
	deactivateOneDevice,
	getAdminLicense,
	listActivationsForLicense,
	listActiveLicenseProducts,
	listAdminDigitalLicenses,
	reactivateLicense,
	resetLicenseDevices,
	revokeLicense,
	setLicenseCustomer,
	setLicenseExpiry
} from '$lib/server/domains/digital-store/licenses/admin';

const normalizeStatus = (value: string | null) => {
	if (value === 'active' || value === 'revoked' || value === 'expired') return value;
	return 'all' as const;
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const { db } = requireSuperAdmin(locals);
	const q = url.searchParams.get('q')?.trim() ?? '';
	const productSlug = url.searchParams.get('product')?.trim() ?? '';
	const status = normalizeStatus(url.searchParams.get('status'));
	const selectedId = url.searchParams.get('id')?.trim() ?? '';

	const [products, licenses] = await Promise.all([
		listActiveLicenseProducts(db),
		listAdminDigitalLicenses(db, { q, productSlug, status, limit: 100 })
	]);

	const selected = selectedId ? await getAdminLicense(db, selectedId) : null;
	const activations = selected ? await listActivationsForLicense(db, selected.licenseId) : [];

	return {
		q,
		productSlug,
		status,
		products,
		licenses,
		selected,
		activations
	};
};

export const actions: Actions = {
	revoke: async ({ locals, request }) => {
		const { db } = requireSuperAdmin(locals);
		const form = await request.formData();
		const licenseId = String(form.get('licenseId') ?? '').trim();
		if (!licenseId) return fail(400, { error: 'licenseId wajib.' });
		const changed = await revokeLicense(db, licenseId);
		if (!changed) return fail(404, { error: 'Lisensi tidak ditemukan.' });
		return { success: true, message: 'Lisensi di-revoke.', licenseId };
	},
	reactivate: async ({ locals, request }) => {
		const { db } = requireSuperAdmin(locals);
		const form = await request.formData();
		const licenseId = String(form.get('licenseId') ?? '').trim();
		if (!licenseId) return fail(400, { error: 'licenseId wajib.' });
		const changed = await reactivateLicense(db, licenseId);
		if (!changed) {
			return fail(400, {
				error: 'Tidak bisa reactivate (tidak ditemukan atau sudah expired).',
				licenseId
			});
		}
		return { success: true, message: 'Lisensi diaktifkan kembali.', licenseId };
	},
	resetDevices: async ({ locals, request }) => {
		const { db } = requireSuperAdmin(locals);
		const form = await request.formData();
		const licenseId = String(form.get('licenseId') ?? '').trim();
		if (!licenseId) return fail(400, { error: 'licenseId wajib.' });
		const count = await resetLicenseDevices(db, licenseId);
		return {
			success: true,
			message: `Reset ${count} perangkat aktif.`,
			licenseId
		};
	},
	deactivateDevice: async ({ locals, request }) => {
		const { db } = requireSuperAdmin(locals);
		const form = await request.formData();
		const licenseId = String(form.get('licenseId') ?? '').trim();
		const deviceHash = String(form.get('deviceHash') ?? '').trim().toLowerCase();
		if (!licenseId || !deviceHash) return fail(400, { error: 'licenseId dan deviceHash wajib.' });
		const changed = await deactivateOneDevice(db, { licenseId, deviceHash });
		if (!changed) return fail(404, { error: 'Perangkat aktif tidak ditemukan.', licenseId });
		return { success: true, message: 'Perangkat dinonaktifkan.', licenseId };
	},
	setExpiry: async ({ locals, request }) => {
		const { db } = requireSuperAdmin(locals);
		const form = await request.formData();
		const licenseId = String(form.get('licenseId') ?? '').trim();
		const raw = String(form.get('expiresAt') ?? '').trim();
		if (!licenseId) return fail(400, { error: 'licenseId wajib.' });
		let expiresAt: number | null = null;
		if (raw) {
			const parsed = new Date(raw).getTime();
			if (!Number.isFinite(parsed)) {
				return fail(400, { error: 'Tanggal expiry tidak valid.', licenseId });
			}
			expiresAt = parsed;
		}
		const changed = await setLicenseExpiry(db, { licenseId, expiresAt });
		if (!changed) return fail(404, { error: 'Lisensi tidak ditemukan.', licenseId });
		return { success: true, message: 'Expiry diperbarui.', licenseId };
	},
	setCustomer: async ({ locals, request }) => {
		const { db } = requireSuperAdmin(locals);
		const form = await request.formData();
		const licenseId = String(form.get('licenseId') ?? '').trim();
		const userEmail = String(form.get('userEmail') ?? '').trim();
		const notes = String(form.get('notes') ?? '').trim();
		if (!licenseId) return fail(400, { error: 'licenseId wajib.' });
		const changed = await setLicenseCustomer(db, {
			licenseId,
			userEmail: userEmail || null,
			notes: notes || null
		});
		if (!changed) return fail(404, { error: 'Lisensi tidak ditemukan.', licenseId });
		return { success: true, message: 'Data pelanggan diperbarui.', licenseId };
	}
};
