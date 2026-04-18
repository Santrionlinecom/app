import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ensureDigitalCommerceSchema, getDigitalOrderByReference } from '$lib/server/digital-commerce';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	await ensureDigitalCommerceSchema(locals.db);
	const token = (url.searchParams.get('token') ?? '').trim();
	if (!token) {
		throw error(404, 'Token order tidak valid');
	}

	const order = await getDigitalOrderByReference(locals.db, params.reference, token);
	if (!order) {
		throw error(404, 'Pesanan tidak ditemukan');
	}
	if (order.status !== 'paid') {
		throw error(403, 'File digital baru bisa diakses setelah pembayaran diverifikasi.');
	}
	if (!order.productFileUrl) {
		throw error(404, 'File digital belum tersedia.');
	}

	throw redirect(302, order.productFileUrl);
};
