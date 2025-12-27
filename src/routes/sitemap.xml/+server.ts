import type { RequestHandler } from './$types';
import type { D1Database } from '@cloudflare/workers-types';

type SitemapRow = {
  slug: string;
  updated_at: number;
  created_at: number;
  scheduled_at: number | null;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: RequestHandler = async ({ locals, platform, url }) => {
  const db = (locals.db ?? platform?.env.DB) as D1Database | undefined;
  if (!db) {
    return new Response('Database not available', { status: 500 });
  }

  const { results } = await db
    .prepare(
      "SELECT slug, updated_at, created_at, scheduled_at FROM cms_posts WHERE status = 'published' AND (scheduled_at IS NULL OR scheduled_at <= strftime('%s','now')*1000) ORDER BY COALESCE(scheduled_at, created_at) DESC"
    )
    .all();

  const rows = (results ?? []) as SitemapRow[];
  const origin = url.origin.replace(/\/+$/, '');

  const urls = rows.map((row) => {
    const lastmodTs = row.updated_at ?? row.scheduled_at ?? row.created_at;
    const lastmod = lastmodTs ? new Date(lastmodTs).toISOString() : null;
    const loc = new URL(`/blog/${row.slug}`, origin).toString();
    return [
      '  <url>',
      `    <loc>${escapeXml(loc)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
      '  </url>'
    ]
      .filter(Boolean)
      .join('\n');
  });

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>'
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=600'
    }
  });
};
