import type { D1Database } from '@cloudflare/workers-types';

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mime_type: string | null;
  size: number | null;
  created_at: number;
}

export async function ensureMediaSchema(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS media_library (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        url TEXT NOT NULL,
        mime_type TEXT,
        size INTEGER,
        created_at INTEGER NOT NULL
      )`
    )
    .run();

  await db.prepare('CREATE INDEX IF NOT EXISTS idx_media_created_at ON media_library(created_at DESC)').run();
}

export async function recordMedia(
  db: D1Database,
  item: { filename: string; url: string; mime_type?: string | null; size?: number | null }
): Promise<void> {
  const now = Date.now();
  await db
    .prepare(
      'INSERT INTO media_library (id, filename, url, mime_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind(crypto.randomUUID(), item.filename, item.url, item.mime_type ?? null, item.size ?? null, now)
    .run();
}

export async function listMedia(
  db: D1Database,
  { limit = 60, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<MediaItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, 200));
  const safeOffset = Math.max(0, offset);
  const { results } = await db
    .prepare('SELECT * FROM media_library ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(safeLimit, safeOffset)
    .all();
  return (results ?? []) as unknown as MediaItem[];
}
