import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const body = `User-agent: *
Allow: /

# Blokir halaman admin dan private
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /akun/
Disallow: /auth/
Disallow: /logout/

# Sitemap
Sitemap: https://app.santrionline.com/sitemap.xml

# Crawl delay untuk hemat bandwidth
Crawl-delay: 1`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
