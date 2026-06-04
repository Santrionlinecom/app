import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	ensureDigitalCommerceSchema,
	listPublishedDigitalProducts
} from '$lib/server/domains/digital-store/commerce';
import { getCoinBalance } from '$lib/server/domains/buku/wallet';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.db) {
		throw error(500, 'Layanan data tidak tersedia');
	}

	await ensureDigitalCommerceSchema(locals.db);

	const products = await listPublishedDigitalProducts(locals.db);
	const paymentMethodIds = new Set(
		products.flatMap((product) => product.paymentMethods.map((method) => method.id))
	);

	// Get user's coin balance if logged in
	let coinBalance = 0;
	if (locals.user) {
		coinBalance = await getCoinBalance(locals.db, locals.user.id);
	}

	return {
		products,
		stats: {
			totalProducts: products.length,
			featuredProducts: products.filter((product) => product.featured).length,
			paymentMethods: paymentMethodIds.size
		},
		coinBalance,
		isLoggedIn: !!locals.user
	};
};