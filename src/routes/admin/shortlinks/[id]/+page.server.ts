import { error, fail, redirect } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import type { Actions, PageServerLoad } from './$types';
import {
	DEFAULT_SHORTLINK_CATEGORY,
	isShortlinkCategoryKey,
	SHORTLINK_CATEGORY_MAP,
	SHORTLINK_CATEGORIES,
	type ShortlinkCategoryKey
} from '$lib/constants/shortlink-categories';
import { requireD1 } from '$lib/server/cloudflare';
import {
	getDateKey,
	getShortLinkBySlug,
	isValidTargetUrl,
	requireAdmin,
	sanitizeSlug
} from '$lib/server/shortlink';

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

type ClickLogRow = {
	clicked_at: string;
	source: string | null;
	campaign: string | null;
	medium: string | null;
	referrer: string | null;
	user_agent: string | null;
	country: string | null;
	city: string | null;
	colo: string | null;
	has_ip_hash: number | null;
};

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const cleanText = (value: string, maxLength = 500) => {
	const text = value.trim();
	return text ? text.slice(0, maxLength) : '';
};

const normalizeCategory = (value: string | null): ShortlinkCategoryKey =>
	value && isShortlinkCategoryKey(value) ? value : DEFAULT_SHORTLINK_CATEGORY;

const readUpdateForm = async (request: Request) => {
	const form = await request.formData();
	const category = normalizeCategory(String(form.get('category') ?? ''));

	return {
		title: cleanText(String(form.get('title') ?? ''), 160),
		description: cleanText(String(form.get('description') ?? ''), 500),
		targetUrl: String(form.get('target_url') ?? '').trim(),
		category,
		notes: cleanText(String(form.get('notes') ?? ''), 1000),
		isActive: form.get('is_active') === 'on'
	};
};

const readSlugParam = (value: string) => {
	const slug = sanitizeSlug(value);
	if (!slug || slug !== value.trim().toLowerCase()) {
		throw error(404, 'Shortlink tidak ditemukan.');
	}
	return slug;
};

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

	const slug = readSlugParam(event.params.id);
	const db = requireD1(event);
	const link = await getShortLinkBySlug(db, slug);
	if (!link) throw error(404, 'Shortlink tidak ditemukan.');

	const todayKey = getDateKey(new Date());
	const last7Key = getDateKey(daysAgo(6));
	const last30Key = getDateKey(daysAgo(29));
	const category = normalizeCategory(link.category);
	const categoryMetadata = SHORTLINK_CATEGORY_MAP.get(category);

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
		clickLogsResult
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
					user_agent,
					country,
					city,
					colo,
					CASE WHEN ip_hash IS NULL THEN 0 ELSE 1 END AS has_ip_hash
				 FROM short_link_clicks
				 WHERE slug = ?
				 ORDER BY clicked_at DESC, id DESC`
			)
			.bind(slug)
			.all<ClickLogRow>()
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
		categories: SHORTLINK_CATEGORIES,
		link: {
			id: link.id,
			slug: link.slug,
			title: link.title,
			description: link.description ?? '',
			targetUrl: link.target_url,
			category,
			categoryLabel: categoryMetadata?.label ?? 'Lainnya',
			categoryColor: categoryMetadata?.color ?? 'gray',
			notes: link.notes ?? '',
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
		clickLogs: (clickLogsResult.results ?? []).map((row) => ({
			clickedAt: row.clicked_at,
			source: row.source,
			campaign: row.campaign,
			medium: row.medium,
			referrer: row.referrer,
			userAgent: row.user_agent,
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

export const actions: Actions = {
	update: async (event) => {
		requireAdmin(event);
		const slug = readSlugParam(event.params.id);
		const db = requireD1(event);
		const values = await readUpdateForm(event.request);

		if (!values.title) {
			return fail(400, { error: 'Title wajib diisi.', values });
		}
		if (!isValidTargetUrl(values.targetUrl)) {
			return fail(400, { error: 'Target URL wajib valid dan memakai http/https.', values });
		}

		try {
			await db
				.prepare(
					`UPDATE short_links
					 SET title = ?,
						description = ?,
						target_url = ?,
						category = ?,
						notes = ?,
						is_active = ?,
						updated_at = CURRENT_TIMESTAMP
					 WHERE slug = ?`
				)
				.bind(
					values.title,
					values.description || null,
					values.targetUrl,
					values.category,
					values.notes || null,
					values.isActive ? 1 : 0,
					slug
				)
				.run();
		} catch (err) {
			console.error('shortlink:update', err);
			return fail(500, { error: 'Gagal menyimpan perubahan.', values });
		}

		return { updated: true };
	},
	delete: async (event) => {
		requireAdmin(event);
		const slug = readSlugParam(event.params.id);
		const db = requireD1(event);
		const form = await event.request.formData();
		const confirmation = String(form.get('confirm_delete') ?? '').trim();

		if (confirmation !== slug) {
			return fail(400, { error: `Ketik ${slug} untuk menghapus shortlink ini.` });
		}

		try {
			await db.batch([
				db.prepare('DELETE FROM short_link_clicks WHERE slug = ?').bind(slug),
				db.prepare('DELETE FROM short_link_daily_stats WHERE slug = ?').bind(slug),
				db.prepare('DELETE FROM short_links WHERE slug = ?').bind(slug)
			]);
		} catch (err) {
			console.error('shortlink:delete', err);
			return fail(500, { error: 'Gagal menghapus shortlink.' });
		}

		throw redirect(303, '/admin/shortlinks');
	}
};
