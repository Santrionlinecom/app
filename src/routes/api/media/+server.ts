import { json } from '@sveltejs/kit';
import { getD1 } from '$lib/server/cloudflare';
import { ensureMediaSchema, listMedia } from '$lib/server/media';

const allowedRoles = new Set(['admin', 'ustadz', 'ustadzah', 'tamir', 'bendahara', 'SUPER_ADMIN']);

export async function GET({ locals, platform, url }) {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!allowedRoles.has(locals.user.role ?? '')) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getD1({ locals, platform });
  const limitParam = Number(url.searchParams.get('limit') ?? '60');
  const offsetParam = Number(url.searchParams.get('offset') ?? '0');
  const limit = Number.isFinite(limitParam) ? limitParam : 60;
  const offset = Number.isFinite(offsetParam) ? offsetParam : 0;

  if (!db) {
    return json({ items: [] });
  }

  try {
    await ensureMediaSchema(db);
    const items = await listMedia(db, { limit, offset });
    return json({ items });
  } catch (err) {
    console.error('Failed to load media gallery:', err);
    return json({ items: [], error: 'Failed to load media gallery' }, { status: 500 });
  }
}
