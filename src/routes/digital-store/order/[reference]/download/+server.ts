import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ensureDigitalCommerceSchema, getDigitalOrderByReference } from '$lib/server/domains/digital-store/commerce';
import { requireR2Bucket } from '$lib/server/cloudflare';

const resolveR2Key = (fileUrl: string) => {
	if (fileUrl.startsWith('r2://')) return fileUrl.slice('r2://'.length).replace(/^\/+/, '');
	try {
		const parsed = new URL(fileUrl);
		if (parsed.hostname === 'files.santrionline.com') return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
	} catch {
		return null;
	}
	return null;
};

export const GET: RequestHandler = async ({ params, cookies, locals, platform }) => {
	if (!locals.db) throw error(500, 'Layanan data tidak tersedia');

	await ensureDigitalCommerceSchema(locals.db);
	const token = cookies.get('digital_order_access')?.trim() ?? '';
	if (!token) throw error(404, 'Kode akses pesanan tidak valid');

	const order = await getDigitalOrderByReference(locals.db, params.reference, token);
	if (!order) throw error(404, 'Pesanan tidak ditemukan');
	if (order.status !== 'paid') throw error(403, 'File digital baru bisa diakses setelah pembayaran diverifikasi.');
	if (!order.productFileUrl) throw error(404, 'File digital belum tersedia.');

	const key = resolveR2Key(order.productFileUrl);
	if (!key) throw error(500, 'Lokasi file digital tidak valid.');
	const object = await requireR2Bucket(platform).get(key);
	if (!object) throw error(404, 'File digital belum tersedia di penyimpanan.');

	const filename = key.split('/').at(-1) || 'SantriPrint-installer.exe';
	const headers = new Headers({
		'content-type': object.httpMetadata?.contentType || 'application/octet-stream',
		'content-disposition': `attachment; filename="${filename.replace(/["\\]/g, '')}"`,
		'cache-control': 'private, no-store',
		'referrer-policy': 'no-referrer',
		'x-content-type-options': 'nosniff'
	});
	return new Response(object.body as unknown as BodyInit, { headers });
};
