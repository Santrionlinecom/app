import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { D1Database } from '@cloudflare/workers-types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const db = platform?.env?.DB as D1Database | undefined;
	if (!db) {
		throw error(500, 'Database tidak tersedia');
	}

	const institutionId = (locals.user as { institution_id?: string | null }).institution_id ?? null;
	let institutionType: string | null = null;

	if (institutionId) {
		const row = await db
			.prepare('SELECT type FROM institutions WHERE id = ?')
			.bind(institutionId)
			.first<{ type: string | null }>();
		institutionType = row?.type ?? null;
	}

	return {
		user: locals.user,
		institution_type: institutionType
	};
};
