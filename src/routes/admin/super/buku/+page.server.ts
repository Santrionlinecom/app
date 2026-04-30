import type { PageServerLoad } from './$types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import {
	BUKU_BOOK_STATUSES,
	ensureBukuLibrarySchema,
	getAdminBukuStatusCounts,
	isBukuBookStatus,
	listAdminBukuBooks
} from '$lib/server/buku-library';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { db } = requireSuperAdmin(locals);
	await ensureBukuLibrarySchema(db);

	const statusParam = url.searchParams.get('status') ?? 'pending';
	const currentStatus = isBukuBookStatus(statusParam) ? statusParam : 'pending';
	const [books, counts] = await Promise.all([
		listAdminBukuBooks(db, currentStatus),
		getAdminBukuStatusCounts(db)
	]);

	return {
		books,
		counts,
		currentStatus,
		statuses: BUKU_BOOK_STATUSES
	};
};
