import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { getLembagaTanpaKoordinat } from '$lib/server/lembaga-map';

export const GET: RequestHandler = async ({ locals }) => {
	const { db } = requireSuperAdmin(locals);
	return json(await getLembagaTanpaKoordinat(db));
};
