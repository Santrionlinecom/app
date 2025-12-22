import type { RequestHandler } from './$types';

const BASE_URL = 'https://app.santrionline.com';
const allowedTypes = new Set(['pondok', 'masjid', 'musholla']);

const toIsoDate = (value?: number | null) => {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const GET: RequestHandler = async ({ locals }) => {
	const db = locals.db;
	if (!db) {
		return new Response('Database tidak tersedia', { status: 500 });
	}

	const { results } = await db
		.prepare(
			`SELECT slug, type, created_at as createdAt
			 FROM organizations
			 WHERE status = 'active'`
		)
		.all<{ slug: string; type: string; createdAt: number }>();

	const urls = (results ?? [])
		.filter((row) => allowedTypes.has(row.type))
		.map((row) => {
			const loc = `${BASE_URL}/${encodeURIComponent(row.type)}/${encodeURIComponent(row.slug)}`;
			const lastmod = toIsoDate(row.createdAt);
			return `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
		})
		.join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		`${urls}\n` +
		`</urlset>`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
};
