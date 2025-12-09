import { json } from '@sveltejs/kit';
import { listMedia } from '$lib/server/media';

export async function GET({ platform, url }) {
  const db = platform?.env?.DB;
  const limitParam = Number(url.searchParams.get('limit') ?? '60');
  const offsetParam = Number(url.searchParams.get('offset') ?? '0');
  const limit = Number.isFinite(limitParam) ? limitParam : 60;
  const offset = Number.isFinite(offsetParam) ? offsetParam : 0;

  if (!db) {
    return json({ items: [] });
  }

  try {
    const items = await listMedia(db, { limit, offset });
    return json({ items });
  } catch (err) {
    console.error('Failed to load media gallery:', err);
    return json({ items: [], error: 'Failed to load media gallery' }, { status: 500 });
  }
}
