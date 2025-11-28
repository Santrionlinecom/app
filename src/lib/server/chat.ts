import type { D1Database } from '@cloudflare/workers-types';

export const ensureChatTable = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`
		)
		.run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at)').run();
};
