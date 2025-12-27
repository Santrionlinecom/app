import { generateId } from 'lucia';
import type { D1Database } from '@cloudflare/workers-types';

type ActivityPayload = {
	userId?: string | null;
	action: string;
	metadata?: Record<string, unknown> | string | null;
};

const serializeMetadata = (metadata?: ActivityPayload['metadata']) => {
	if (!metadata) return null;
	if (typeof metadata === 'string') return metadata;
	try {
		return JSON.stringify(metadata);
	} catch {
		return null;
	}
};

export const logActivity = async (db: D1Database, payload: ActivityPayload) => {
	const metadataValue = serializeMetadata(payload.metadata);
	try {
		await db
			.prepare(
				`INSERT INTO activity_logs (id, user_id, action, metadata, created_at)
				 VALUES (?, ?, ?, ?, ?)`
			)
			.bind(generateId(15), payload.userId ?? null, payload.action, metadataValue, Date.now())
			.run();
	} catch (err) {
		console.error('activity log insert failed', err);
	}
};
