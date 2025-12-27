import type { D1Database } from '@cloudflare/workers-types';
import { generateId } from 'lucia';

type LogMetadata = Record<string, unknown> | string | null | undefined;

export type LogActivityDetails = {
	userId?: string | null;
	userEmail?: string | null;
	metadata?: LogMetadata;
	ipAddress?: string | null;
	waitUntil?: (promise: Promise<unknown>) => void;
};

const serializeMetadata = (metadata?: LogMetadata) => {
	if (!metadata) return null;
	if (typeof metadata === 'string') return metadata;
	try {
		return JSON.stringify(metadata);
	} catch {
		return null;
	}
};

export const getRequestIp = (request: Request) => {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) return forwarded.split(',')[0]?.trim() || null;
	return (
		request.headers.get('cf-connecting-ip') ||
		request.headers.get('x-real-ip') ||
		null
	);
};

export const logActivity = (
	db: D1Database | null | undefined,
	action: string,
	details: LogActivityDetails = {}
) => {
	if (!db || !action) return;
	const metadataValue = serializeMetadata(details.metadata);
	const logPromise = db
		.prepare(
			`INSERT INTO system_logs (id, user_id, user_email, action, metadata, ip_address, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			generateId(15),
			details.userId ?? null,
			details.userEmail ?? null,
			action,
			metadataValue,
			details.ipAddress ?? null,
			Date.now()
		)
		.run();

	if (details.waitUntil) {
		details.waitUntil(logPromise.catch(() => undefined));
	} else {
		void logPromise.catch(() => undefined);
	}
};
