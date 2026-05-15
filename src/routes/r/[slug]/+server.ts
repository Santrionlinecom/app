import type { RequestHandler } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import {
	createShortLinkClick,
	getDateKey,
	getShortLinkBySlug,
	hashIp,
	hasSeenIpHashToday,
	incrementDailyStats,
	sanitizeSlug
} from '$lib/server/shortlink';

type RequestCf = {
	country?: string;
	city?: string;
	colo?: string;
};

const getParam = (url: URL, name: string) => {
	const value = url.searchParams.get(name)?.trim();
	return value ? value.slice(0, 120) : null;
};

const notFoundResponse = () =>
	new Response(
		'<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shortlink Tidak Ditemukan</title></head><body style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#f8fafc;color:#0f172a"><main style="min-height:100vh;display:grid;place-items:center;padding:24px"><section style="max-width:520px;border:1px solid #e2e8f0;background:white;border-radius:12px;padding:28px;box-shadow:0 1px 2px rgba(15,23,42,.06)"><p style="margin:0 0 8px;color:#047857;font-weight:700">404</p><h1 style="margin:0;font-size:26px;line-height:1.2">Shortlink tidak ditemukan</h1><p style="margin:12px 0 0;color:#475569;line-height:1.6">Link yang dibuka tidak tersedia atau sudah nonaktif.</p></section></main></body></html>',
		{
			status: 404,
			headers: {
				'content-type': 'text/html; charset=utf-8',
				'cache-control': 'no-store'
			}
		}
	);

const inactiveResponse = () =>
	new Response(
		'<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Link Tidak Aktif</title></head><body style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#f8fafc;color:#0f172a"><main style="min-height:100vh;display:grid;place-items:center;padding:24px"><section style="max-width:520px;border:1px solid #e2e8f0;background:white;border-radius:12px;padding:28px;box-shadow:0 1px 2px rgba(15,23,42,.06)"><p style="margin:0 0 8px;color:#b45309;font-weight:700">410</p><h1 style="margin:0;font-size:26px;line-height:1.2">Link ini sudah tidak aktif.</h1></section></main></body></html>',
		{
			status: 410,
			headers: {
				'content-type': 'text/html; charset=utf-8',
				'cache-control': 'no-store'
			}
		}
	);

export const GET: RequestHandler = async ({ params, url, locals, platform, request }) => {
	const rawSlug = params.slug ?? '';
	const normalizedSlug = rawSlug.trim().toLowerCase();
	const slug = sanitizeSlug(rawSlug);
	if (!slug || slug !== normalizedSlug) return notFoundResponse();

	const db = (locals.db ?? platform?.env?.DB) as D1Database | undefined;
	if (!db) return notFoundResponse();

	const link = await getShortLinkBySlug(db, slug);
	if (!link) return notFoundResponse();
	if (Number(link.is_active) !== 1) return inactiveResponse();
	const activeLink = link;

	const cf = (request as Request & { cf?: RequestCf }).cf;
	const ip = request.headers.get('cf-connecting-ip');
	const dateKey = getDateKey(new Date());

	const analyticsTask = (async () => {
		const ipHash = await hashIp(ip, platform?.env?.SHORTLINK_SECRET);
		const uniqueClick = ipHash ? !(await hasSeenIpHashToday(db, slug, dateKey, ipHash)) : false;
		await createShortLinkClick(db, {
			link_id: activeLink.id,
			slug,
			source: getParam(url, 'src'),
			campaign: getParam(url, 'campaign'),
			medium: getParam(url, 'medium'),
			referrer: request.headers.get('referer'),
			user_agent: request.headers.get('user-agent'),
			country: cf?.country,
			city: cf?.city,
			colo: cf?.colo,
			ip_hash: ipHash,
			date_key: dateKey
		});
		await incrementDailyStats(db, {
			link_id: activeLink.id,
			slug,
			date_key: dateKey,
			unique_click: uniqueClick
		});
	})().catch((err) => {
		console.error('shortlink:analytics', err);
	});

	if (platform?.context?.waitUntil) {
		platform.context.waitUntil(analyticsTask);
	} else {
		await analyticsTask;
	}

	return new Response(null, {
		status: 302,
		headers: {
			location: activeLink.target_url,
			'cache-control': 'no-store'
		}
	});
};
