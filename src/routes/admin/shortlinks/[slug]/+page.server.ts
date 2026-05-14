import { error } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import type { PageServerLoad } from './$types';
import { requireD1 } from '$lib/server/cloudflare';
import { getDateKey, getShortLinkBySlug, requireAdmin, sanitizeSlug } from '$lib/server/shortlink';

type CountRow = {
	total: number | null;
};

type DailyRow = {
	date_key: string;
	clicks: number | null;
	unique_clicks: number | null;
};

type TopRow = {
	label: string | null;
	total: number | null;
};

type RecentClickRow = {
	clicked_at: string;
	source: string | null;
	campaign: string | null;
	medium: string | null;
	referrer: string | null;
	country: string | null;
	city: string | null;
	colo: string | null;
	has_ip_hash: number | null;
};

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const getStatsSum = async (db: D1Database, slug: string, sinceDateKey?: string) => {
	const row = sinceDateKey
		? await db
				.prepare('SELECT COALESCE(SUM(clicks), 0) AS total FROM short_link_daily_stats WHERE slug = ? AND date_key >= ?')
				.bind(slug, sinceDateKey)
				.first<CountRow>()
		: await db
				.prepare('SELECT COALESCE(SUM(clicks), 0) AS total FROM short_link_daily_stats WHERE slug = ?')
				.bind(slug)
				.first<CountRow>();
	return Number(row?.total ?? 0);
};

const getTopRows = async (db: D1Database, slug: string, expression: string) => {
	const { results } = await db
		.prepare(
			`SELECT ${expression} AS label, COUNT(*) AS total
			 FROM short_link_clicks
			 WHERE slug = ?
			 GROUP BY ${expression}
			 ORDER BY total DESC
			 LIMIT 10`
		)
		.bind(slug)
		.all<TopRow>();

	return (results ?? []).map((row) => ({
		label: row.label ?? '(kosong)',
		total: Number(row.total ?? 0)
	}));
};

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);

	const slug = sanitizeSlug(event.params.slug);
	if (!slug || slug !== event.params.slug.trim().toLowerCase()) {
		throw error(404, 'Shortlink tidak ditemukan.');
	}

	const db = requireD1(event);
	const link = await getShortLinkBySlug(db, slug);
	if (!link) throw error(404, 'Shortlink tidak ditemukan.');

	const todayKey = getDateKey(new Date());
	const last7Key = getDateKey(daysAgo(6));
	const last30Key = getDateKey(daysAgo(29));

	const [
		totalRow,
		uniqueRow,
		clicksToday,
		clicks7d,
		clicks30d,
		dailyResult,
		topSource,
		topCampaign,
		topCountry,
		topReferrer,
		recentResult
	] = await Promise.all([
		db.prepare('SELECT COUNT(*) AS total FROM short_link_clicks WHERE slug = ?').bind(slug).first<CountRow>(),
		db
			.prepare('SELECT COUNT(DISTINCT ip_hash) AS total FROM short_link_clicks WHERE slug = ? AND ip_hash IS NOT NULL')
			.bind(slug)
			.first<CountRow>(),
		getStatsSum(db, slug, todayKey),
		getStatsSum(db, slug, last7Key),
		getStatsSum(db, slug, last30Key),
		db
			.prepare(
				`SELECT date_key, clicks, unique_clicks
				 FROM short_link_daily_stats
				 WHERE slug = ? AND date_key >= ?
				 ORDER BY date_key DESC`
			)
			.bind(slug, last30Key)
			.all<DailyRow>(),
		getTopRows(db, slug, "COALESCE(NULLIF(source, ''), '(tanpa source)')"),
		getTopRows(db, slug, "COALESCE(NULLIF(campaign, ''), '(tanpa campaign)')"),
		getTopRows(db, slug, "COALESCE(NULLIF(country, ''), '(tanpa country)')"),
		getTopRows(db, slug, "COALESCE(NULLIF(referrer, ''), '(tanpa referrer)')"),
		db
			.prepare(
				`SELECT
					clicked_at,
					source,
					campaign,
					medium,
					referrer,
					country,
					city,
					colo,
					CASE WHEN ip_hash IS NULL THEN 0 ELSE 1 END AS has_ip_hash
				 FROM short_link_clicks
				 WHERE slug = ?
				 ORDER BY clicked_at DESC, id DESC
				 LIMIT 50`
			)
			.bind(slug)
			.all<RecentClickRow>()
	]);

	const dailyByDate = new Map(
		(dailyResult.results ?? []).map((row) => [
			row.date_key,
			{
				dateKey: row.date_key,
				clicks: Number(row.clicks ?? 0),
				uniqueClicks: Number(row.unique_clicks ?? 0)
			}
		])
	);

	const dailyStats = Array.from({ length: 30 }, (_, index) => {
		const dateKey = getDateKey(daysAgo(index));
		return dailyByDate.get(dateKey) ?? { dateKey, clicks: 0, uniqueClicks: 0 };
	});

	const baseShortUrl = `https://app.santrionline.com/r/${link.slug}`;

	return {
		link: {
			id: link.id,
			slug: link.slug,
			title: link.title,
			description: link.description,
			targetUrl: link.target_url,
			isActive: Number(link.is_active) === 1,
			shortUrl: baseShortUrl
		},
		summary: {
			totalClicks: Number(totalRow?.total ?? 0),
			uniqueClicks: Number(uniqueRow?.total ?? 0),
			clicksToday,
			clicks7d,
			clicks30d
		},
		dailyStats,
		topSource,
		topCampaign,
		topCountry,
		topReferrer,
		recentClicks: (recentResult.results ?? []).map((row) => ({
			clickedAt: row.clicked_at,
			source: row.source,
			campaign: row.campaign,
			medium: row.medium,
			referrer: row.referrer,
			country: row.country,
			city: row.city,
			colo: row.colo,
			hasIpHash: Number(row.has_ip_hash ?? 0) === 1
		})),
		campaignExamples: ['channel-wa', 'grup-wa', 'tiktok-bio', 'instagram-story', 'youtube-desc'].map(
			(source) => `${baseShortUrl}?src=${source}`
		)
	};
};
