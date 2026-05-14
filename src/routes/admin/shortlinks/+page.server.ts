import type { PageServerLoad } from './$types';
import { requireD1 } from '$lib/server/cloudflare';
import { getDateKey, requireAdmin } from '$lib/server/shortlink';

type ShortLinkListRow = {
	id: number;
	slug: string;
	title: string;
	target_url: string;
	is_active: number;
	total_clicks: number | null;
	clicks_today: number | null;
	clicks_7d: number | null;
};

type DailyChartRow = {
	date_key: string;
	clicks: number | null;
	unique_clicks: number | null;
};

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);

	const db = requireD1(event);
	const todayKey = getDateKey(new Date());
	const last7Key = getDateKey(daysAgo(6));
	const last14Key = getDateKey(daysAgo(13));

	const [linksResult, dailyResult] = await Promise.all([
		db
			.prepare(
				`SELECT
					sl.id,
					sl.slug,
					sl.title,
					sl.target_url,
					sl.is_active,
					COALESCE(total.total_clicks, 0) AS total_clicks,
					COALESCE(today.clicks_today, 0) AS clicks_today,
					COALESCE(last7.clicks_7d, 0) AS clicks_7d
				FROM short_links sl
				LEFT JOIN (
					SELECT slug, COUNT(*) AS total_clicks
					FROM short_link_clicks
					GROUP BY slug
				) total ON total.slug = sl.slug
				LEFT JOIN (
					SELECT slug, SUM(clicks) AS clicks_today
					FROM short_link_daily_stats
					WHERE date_key = ?
					GROUP BY slug
				) today ON today.slug = sl.slug
				LEFT JOIN (
					SELECT slug, SUM(clicks) AS clicks_7d
					FROM short_link_daily_stats
					WHERE date_key >= ?
					GROUP BY slug
				) last7 ON last7.slug = sl.slug
				ORDER BY sl.updated_at DESC, sl.id DESC`
			)
			.bind(todayKey, last7Key)
			.all<ShortLinkListRow>(),
		db
			.prepare(
				`SELECT
					date_key,
					COALESCE(SUM(clicks), 0) AS clicks,
					COALESCE(SUM(unique_clicks), 0) AS unique_clicks
				FROM short_link_daily_stats
				WHERE date_key >= ?
				GROUP BY date_key
				ORDER BY date_key ASC`
			)
			.bind(last14Key)
			.all<DailyChartRow>()
	]);

	const shortlinks = (linksResult.results ?? []).map((row) => ({
		id: row.id,
		slug: row.slug,
		title: row.title,
		targetUrl: row.target_url,
		isActive: Number(row.is_active) === 1,
		totalClicks: Number(row.total_clicks ?? 0),
		clicksToday: Number(row.clicks_today ?? 0),
		clicks7d: Number(row.clicks_7d ?? 0),
		copyUrl: `https://app.santrionline.com/r/${row.slug}`
	}));

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

	const dailyChart = Array.from({ length: 14 }, (_, index) => {
		const dateKey = getDateKey(daysAgo(13 - index));
		return dailyByDate.get(dateKey) ?? { dateKey, clicks: 0, uniqueClicks: 0 };
	});

	return {
		shortlinks,
		summary: {
			totalLinks: shortlinks.length,
			activeLinks: shortlinks.filter((link) => link.isActive).length,
			totalClicks: shortlinks.reduce((sum, link) => sum + link.totalClicks, 0),
			clicksToday: shortlinks.reduce((sum, link) => sum + link.clicksToday, 0),
			clicks7d: shortlinks.reduce((sum, link) => sum + link.clicks7d, 0)
		},
		dailyChart
	};
};
