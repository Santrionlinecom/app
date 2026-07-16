import { json, type RequestHandler } from '@sveltejs/kit';

import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import { businessApiError } from '$lib/server/business-agent/http';
import { createBusinessQuote, listBusinessQuotes } from '$lib/server/business-agent/repository';
import { createQuoteSchema } from '$lib/server/business-agent/schemas';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { db } = requireSuperAdmin(locals);
	const limit = Number(url.searchParams.get('limit') ?? 50);
	return json({ ok: true, quotes: await listBusinessQuotes(db, limit) });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const { db, user } = requireSuperAdmin(locals);
	const parsed = createQuoteSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return json({ ok: false, message: 'Data quote tidak valid' }, { status: 400 });
	}
	try {
		const quote = await createBusinessQuote(db, parsed.data, { id: user.id, type: 'admin' });
		return json({ ok: true, quote }, { status: 201 });
	} catch (error) {
		return businessApiError(error, 'create_quote');
	}
};
