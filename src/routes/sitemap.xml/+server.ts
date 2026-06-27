import type { D1Database } from '@cloudflare/workers-types';
import { designTemplates } from '$lib/data/desain';
import type { RequestHandler } from './$types';

const BASE_URL = 'https://app.santrionline.com';

type SitemapPage = {
	loc: string;
	priority: string;
	changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
	lastmod?: string | null;
};

type CmsPostRow = {
	slug: string;
	updated_at: number | null;
	created_at: number | null;
	scheduled_at: number | null;
};

type BookRow = {
	slug: string;
	updated_at: string | number | null;
};

const staticPages: SitemapPage[] = [
	{ loc: '/', priority: '1.0', changefreq: 'daily' },
	{ loc: '/buku', priority: '0.9', changefreq: 'daily' },
	{ loc: '/kitab', priority: '0.9', changefreq: 'daily' },
	{ loc: '/kitab/quran', priority: '0.9', changefreq: 'weekly' },
	{ loc: '/fitur', priority: '0.8', changefreq: 'weekly' },
	{ loc: '/tokoh', priority: '0.8', changefreq: 'weekly' },
	{ loc: '/ulama', priority: '0.8', changefreq: 'weekly' },
	{ loc: '/dinasti', priority: '0.7', changefreq: 'weekly' },
	{ loc: '/ormas', priority: '0.8', changefreq: 'weekly' },
	{ loc: '/blog', priority: '0.9', changefreq: 'daily' },
	{ loc: '/desain', priority: '0.9', changefreq: 'weekly' },
	{ loc: '/desain/cetak', priority: '0.8', changefreq: 'weekly' },
	{ loc: '/digital-store', priority: '0.7', changefreq: 'weekly' },
	{ loc: '/tentang', priority: '0.5', changefreq: 'monthly' },
	{ loc: '/kontak', priority: '0.5', changefreq: 'monthly' },
	{ loc: '/privacy', priority: '0.4', changefreq: 'yearly' },
	{ loc: '/syarat', priority: '0.4', changefreq: 'yearly' }
];

const escapeXml = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

const toDateOnly = (value: string | number | null | undefined) => {
	if (!value) return null;
	const date = typeof value === 'number' ? new Date(value) : new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return date.toISOString().slice(0, 10);
};

const loadArticlePages = async (db: D1Database): Promise<SitemapPage[]> => {
	const { results } = await db
		.prepare(
			`SELECT slug, updated_at, created_at, scheduled_at
			 FROM cms_posts
			 WHERE status = 'published'
			   AND (scheduled_at IS NULL OR scheduled_at <= strftime('%s','now') * 1000)
			 ORDER BY COALESCE(updated_at, scheduled_at, created_at) DESC
			 LIMIT 1000`
		)
		.all<CmsPostRow>();

	return (results ?? []).map((row) => ({
		loc: `/blog/${row.slug}`,
		priority: '0.8',
		changefreq: 'weekly',
		lastmod: toDateOnly(row.updated_at ?? row.scheduled_at ?? row.created_at)
	}));
};

const loadBookPages = async (db: D1Database): Promise<SitemapPage[]> => {
	const { results } = await db
		.prepare(
			`SELECT slug, updated_at
			 FROM buku_books
			 WHERE status = 'published'
			 ORDER BY updated_at DESC
			 LIMIT 500`
		)
		.all<BookRow>();

	return (results ?? []).map((row) => ({
		loc: `/buku/${row.slug}`,
		priority: '0.7',
		changefreq: 'monthly',
		lastmod: toDateOnly(row.updated_at)
	}));
};

const renderUrl = (page: SitemapPage, fallbackLastmod: string) => {
	const loc = new URL(page.loc, BASE_URL).toString();
	return [
		'  <url>',
		`    <loc>${escapeXml(loc)}</loc>`,
		`    <lastmod>${escapeXml(page.lastmod || fallbackLastmod)}</lastmod>`,
		`    <changefreq>${page.changefreq}</changefreq>`,
		`    <priority>${page.priority}</priority>`,
		'  </url>'
	].join('\n');
};

export const GET: RequestHandler = async ({ locals, platform }) => {
	const db = (locals.db ?? platform?.env?.DB ?? null) as D1Database | null;
	const today = new Date().toISOString().slice(0, 10);
	let dynamicPages: SitemapPage[] = [];

	if (db) {
		const [articlePages, bookPages] = await Promise.all([
			loadArticlePages(db).catch(() => []),
			loadBookPages(db).catch(() => [])
		]);
		dynamicPages = [...articlePages, ...bookPages];
	}

	const xml = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
		'        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
		'        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
		...[
			...staticPages,
			...designTemplates.map((template) => ({
				loc: `/desain/${template.slug}`,
				priority: '0.8',
				changefreq: 'monthly' as const
			})),
			...dynamicPages
		].map((page) => renderUrl(page, today)),
		'</urlset>'
	].join('\n');

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600, s-maxage=3600'
		}
	});
};
