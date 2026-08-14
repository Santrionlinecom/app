import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { uploadDigitalPaymentProof } from '$lib/server/domains/digital-store/payment-proof';
import {
	attachDigitalSaleProof,
	ensureDigitalCommerceSchema,
	getDigitalOrderByReference
} from '$lib/server/domains/digital-store/commerce';
import { getRequestIp } from '$lib/server/logger';
import { TURNSTILE_FAILURE_MESSAGE, verifyTurnstileFormData } from '$lib/server/turnstile';
import { claimPaidDigitalOrderLicense } from '$lib/server/domains/digital-store/licenses/paid-entitlement';

const loadOrder = async (
	db: NonNullable<App.Locals['db']>,
	reference: string,
	token: string
) => {
	const order = await getDigitalOrderByReference(db, reference, token);
	if (!order) {
		throw error(404, 'Pesanan tidak ditemukan');
	}
	return order;
};

export const load: PageServerLoad = async ({ params, url, locals, cookies, setHeaders }) => {
	if (!locals.db) {
		throw error(500, 'Layanan data tidak tersedia');
	}

	await ensureDigitalCommerceSchema(locals.db);
	setHeaders({ 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'private, no-store' });
	const token = cookies.get('digital_order_access')?.trim() ?? '';
	if (!token) {
		throw error(404, 'Kode akses pesanan tidak valid');
	}

	const order = await loadOrder(locals.db, params.reference, token);

	return {
		proofUpdated: url.searchParams.get('proof') === 'updated',
		order
	};
};

export const actions: Actions = {
	claimLicense: async ({ params, locals, platform, cookies, setHeaders }) => {
		if (!locals.user) return fail(401, { error: 'Silakan login untuk klaim lisensi.' });
		if (!locals.db) return fail(500, { error: 'Layanan data tidak tersedia.' });
		const secret = platform?.env?.LICENSE_KEY_HASH_SECRET?.trim();
		if (!secret) return fail(503, { error: 'Layanan lisensi belum siap. Silakan hubungi admin.' });

		await ensureDigitalCommerceSchema(locals.db);
		setHeaders({ 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'private, no-store' });
		const token = cookies.get('digital_order_access')?.trim() ?? '';
		if (!token) return fail(404, { error: 'Kode akses pesanan tidak valid.' });
		try {
			const claimed = await claimPaidDigitalOrderLicense({
				db: locals.db,
				referenceCode: params.reference,
				accessToken: token,
				userId: locals.user.id,
				secret
			});
			return { success: true, type: 'license_claimed', ...claimed };
		} catch (err) {
			return fail(403, { error: err instanceof Error ? err.message : 'Lisensi gagal diklaim.' });
		}
	},
	uploadProof: async ({ request, params, locals, platform, cookies, setHeaders }) => {
		if (!locals.db) {
			return fail(500, { error: 'Layanan data tidak tersedia.' });
		}

		await ensureDigitalCommerceSchema(locals.db);
		setHeaders({ 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'private, no-store' });
		const formData = await request.formData();
		const token = cookies.get('digital_order_access')?.trim() ?? '';

		if (!token) {
			return fail(400, { error: 'Kode akses pesanan tidak valid.' });
		}

		const order = await getDigitalOrderByReference(locals.db, params.reference, token);
		if (!order) {
			return fail(404, { error: 'Pesanan tidak ditemukan.' });
		}
		if (order.paymentMethodType !== 'manual' || order.status !== 'pending') {
			return fail(409, { error: 'Pesanan ini tidak menerima unggahan bukti pembayaran.' });
		}

		const turnstile = await verifyTurnstileFormData(formData, getRequestIp(request) ?? undefined);
		if (!turnstile.success) {
			return fail(400, { error: TURNSTILE_FAILURE_MESSAGE });
		}

		const proofFile = formData.get('proofFile');
		if (!(proofFile instanceof File) || proofFile.size <= 0) {
			return fail(400, { error: 'Pilih file bukti bayar terlebih dahulu.' });
		}

		try {
			const uploaded = await uploadDigitalPaymentProof(locals.db, platform, proofFile, order.referenceCode);
				await attachDigitalSaleProof(locals.db, {
					referenceCode: order.referenceCode,
					accessToken: token,
					proofUrl: uploaded.url,
					proofKey: uploaded.key,
					proofMimeType: uploaded.mimeType,
					proofSize: uploaded.size
				});
		} catch (err: any) {
			return fail(400, { error: err?.message || 'Gagal mengunggah bukti bayar.' });
		}

		throw redirect(303, `/digital-store/order/${order.referenceCode}?proof=updated`);
	}
};
