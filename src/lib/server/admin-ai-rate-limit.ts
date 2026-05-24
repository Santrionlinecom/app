import { json } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import { buildRateLimitHeaders, consumeApiRateLimit } from '$lib/server/rate-limit';

export const enforceAdminAiRateLimit = async (params: {
	db: D1Database | null | undefined;
	user: NonNullable<App.Locals['user']>;
	scope: string;
	limit: number;
	windowMs: number;
}) => {
	if (!params.db) return null;

	try {
		const rateLimit = await consumeApiRateLimit({
			db: params.db,
			scope: params.scope,
			key: `user:${params.user.id}`,
			limit: params.limit,
			windowMs: params.windowMs
		});

		if (!rateLimit.allowed) {
			return json(
				{
					success: false,
					error: 'Limit penggunaan AI tercapai. Coba lagi setelah jeda rate limit.',
					limit: rateLimit.limit,
					resetAt: rateLimit.resetAt
				},
				{ status: 429, headers: buildRateLimitHeaders(rateLimit) }
			);
		}
	} catch (err) {
		console.warn(`${params.scope} rate limit check failed:`, err);
	}

	return null;
};
