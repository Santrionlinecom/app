import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ensureDefaultManualPaymentMethods } from '$lib/server/default-manual-payments';
import { uploadDigitalPaymentProof } from '$lib/server/digital-payment-proof';
import {
	attachDigitalSaleProof,
	createManualDigitalOrder,
	ensureDigitalCommerceSchema,
	getPublishedDigitalProductBySlug
} from '$lib/server/digital-commerce';
import { getRequestIp } from '$lib/server/logger';
import { TURNSTILE_FAILURE_MESSAGE, verifyTurnstileFormData } from '$lib/server/turnstile';

const normalizeText = (value: FormDataEntryValue | null) =>
	typeof value === 'string' ? value.trim() : '';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	await ensureDigitalCommerceSchema(locals.db);
	await ensureDefaultManualPaymentMethods(locals.db);

	const product = await getPublishedDigitalProductBySlug(locals.db, params.slug);
	if (!product) {
		throw error(404, 'Produk digital tidak ditemukan');
	}

	return {
		product
	};
};

export const actions: Actions = {
	createOrder: async ({ request, params, locals, platform }) => {
		if (!locals.db) {
			return fail(500, { error: 'Database tidak tersedia.' });
		}

		const formData = await request.formData();
		const turnstile = await verifyTurnstileFormData(formData, getRequestIp(request) ?? undefined);
		if (!turnstile.success) {
			return fail(400, { error: TURNSTILE_FAILURE_MESSAGE });
		}

		await ensureDigitalCommerceSchema(locals.db);
		await ensureDefaultManualPaymentMethods(locals.db);

		const product = await getPublishedDigitalProductBySlug(locals.db, params.slug);
		if (!product) {
			return fail(404, { error: 'Produk digital tidak ditemukan.' });
		}

		const buyerName = normalizeText(formData.get('buyerName'));
		const buyerContact = normalizeText(formData.get('buyerContact'));
		const paymentMethodId = normalizeText(formData.get('paymentMethodId'));
		const proofFile = formData.get('proofFile');

		if (!buyerName) {
			return fail(400, { error: 'Nama pembeli wajib diisi.' });
		}
		if (!buyerContact) {
			return fail(400, { error: 'Nomor WhatsApp atau kontak wajib diisi.' });
		}
		if (!paymentMethodId) {
			return fail(400, { error: 'Pilih salah satu metode pembayaran.' });
		}

		try {
			const order = await createManualDigitalOrder(locals.db, {
				productId: product.id,
				buyerName,
				buyerContact,
				paymentMethodId
			});

			if (proofFile instanceof File && proofFile.size > 0) {
				const uploaded = await uploadDigitalPaymentProof(locals.db, platform, proofFile, order.referenceCode);
				await attachDigitalSaleProof(locals.db, {
					referenceCode: order.referenceCode,
					accessToken: order.accessToken,
					proofUrl: uploaded.url,
					proofKey: uploaded.key,
					proofMimeType: uploaded.mimeType,
					proofSize: uploaded.size
				});
			}

			throw redirect(
				303,
				`/digital-store/order/${order.referenceCode}?token=${encodeURIComponent(order.accessToken)}`
			);
		} catch (err: any) {
			if (err?.status === 303) throw err;
			return fail(400, {
				error: err?.message || 'Gagal membuat pesanan manual.'
			});
		}
	}
};
