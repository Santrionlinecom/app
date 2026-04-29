import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { uploadDigitalPaymentProof } from '$lib/server/digital-payment-proof';
import {
	attachDigitalSaleProof,
	ensureDigitalCommerceSchema,
	getDigitalOrderByReference
} from '$lib/server/digital-commerce';
import { getRequestIp } from '$lib/server/logger';
import { TURNSTILE_FAILURE_MESSAGE, verifyTurnstileFormData } from '$lib/server/turnstile';

const normalizeText = (value: FormDataEntryValue | null) =>
	typeof value === 'string' ? value.trim() : '';

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

export const load: PageServerLoad = async ({ params, url, locals }) => {
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	await ensureDigitalCommerceSchema(locals.db);
	const token = (url.searchParams.get('token') ?? '').trim();
	if (!token) {
		throw error(404, 'Token pesanan tidak valid');
	}

	const order = await loadOrder(locals.db, params.reference, token);

	return {
		token,
		proofUpdated: url.searchParams.get('proof') === 'updated',
		order
	};
};

export const actions: Actions = {
	uploadProof: async ({ request, params, locals, platform }) => {
		if (!locals.db) {
			return fail(500, { error: 'Database tidak tersedia.' });
		}

		await ensureDigitalCommerceSchema(locals.db);
		const formData = await request.formData();
		const turnstile = await verifyTurnstileFormData(formData, getRequestIp(request) ?? undefined);
		if (!turnstile.success) {
			return fail(400, { error: TURNSTILE_FAILURE_MESSAGE });
		}

		const token = normalizeText(formData.get('token'));
		const proofFile = formData.get('proofFile');

		if (!token) {
			return fail(400, { error: 'Token order tidak valid.' });
		}

		const order = await getDigitalOrderByReference(locals.db, params.reference, token);
		if (!order) {
			return fail(404, { error: 'Pesanan tidak ditemukan.' });
		}
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

		throw redirect(
			303,
			`/digital-store/order/${order.referenceCode}?token=${encodeURIComponent(token)}&proof=updated`
		);
	}
};
