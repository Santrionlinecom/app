import type { D1Database } from '@cloudflare/workers-types';

const MAX_KEY_LENGTH = 160;

export type RateLimitResult = {
	allowed: boolean;
	scope: string;
	limit: number;
	remaining: number;
	count: number;
	resetAt: number;
	retryAfterSeconds: number;
};

export const ensureApiRateLimitTable = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS api_rate_limits (
				scope TEXT NOT NULL,
				limiter_key TEXT NOT NULL,
				window_start INTEGER NOT NULL,
				request_count INTEGER NOT NULL DEFAULT 0,
				updated_at INTEGER NOT NULL,
				PRIMARY KEY (scope, limiter_key)
			)`
		)
		.run();

	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_api_rate_limits_updated_at ON api_rate_limits(updated_at)'
		)
		.run();
};

export const consumeApiRateLimit = async (params: {
	db: D1Database;
	scope: string;
	key: string;
	limit: number;
	windowMs: number;
	now?: number;
}): Promise<RateLimitResult> => {
	const { db, scope, limit, windowMs } = params;
	const now = params.now ?? Date.now();
	const windowStart = now - (now % windowMs);
	const limiterKey = (params.key || 'anonymous').trim().slice(0, MAX_KEY_LENGTH) || 'anonymous';

	await ensureApiRateLimitTable(db);

	await db
		.prepare(
			`INSERT INTO api_rate_limits (scope, limiter_key, window_start, request_count, updated_at)
			 VALUES (?, ?, ?, 1, ?)
			 ON CONFLICT(scope, limiter_key) DO UPDATE SET
				request_count = CASE
					WHEN excluded.window_start > api_rate_limits.window_start THEN 1
					ELSE api_rate_limits.request_count + 1
				END,
				window_start = CASE
					WHEN excluded.window_start > api_rate_limits.window_start THEN excluded.window_start
					ELSE api_rate_limits.window_start
				END,
				updated_at = excluded.updated_at`
		)
		.bind(scope, limiterKey, windowStart, now)
		.run();

	const row = await db
		.prepare(
			`SELECT window_start as windowStart, request_count as requestCount
			 FROM api_rate_limits
			 WHERE scope = ? AND limiter_key = ?`
		)
		.bind(scope, limiterKey)
		.first<{ windowStart: number; requestCount: number }>();

	const count = Number(row?.requestCount ?? 1);
	const activeWindowStart = Number(row?.windowStart ?? windowStart);
	const resetAt = activeWindowStart + windowMs;
	const remaining = Math.max(0, limit - count);
	const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));

	return {
		allowed: count <= limit,
		scope,
		limit,
		remaining,
		count,
		resetAt,
		retryAfterSeconds
	};
};

export const buildRateLimitHeaders = (result: RateLimitResult) => ({
	'X-RateLimit-Limit': String(result.limit),
	'X-RateLimit-Remaining': String(result.remaining),
	'X-RateLimit-Reset': String(result.resetAt),
	'Retry-After': String(result.retryAfterSeconds)
});
