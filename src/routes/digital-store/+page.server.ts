import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ensureDefaultManualPaymentMethods } from '$lib/server/default-manual-payments';
import {
	ensureDigitalCommerceSchema,
	listPublishedDigitalProducts
} from '$lib/server/digital-commerce';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	await ensureDigitalCommerceSchema(locals.db);
	await ensureDefaultManualPaymentMethods(locals.db);

	const products = await listPublishedDigitalProducts(locals.db);
	const paymentMethodIds = new Set(
		products.flatMap((product) => product.paymentMethods.map((method) => method.id))
	);

	return {
		products,
		stats: {
			totalProducts: products.length,
			featuredProducts: products.filter((product) => product.featured).length,
			paymentMethods: paymentMethodIds.size
		}
	};
};
