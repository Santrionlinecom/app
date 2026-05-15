import { fail } from '@sveltejs/kit';
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

type ShortLinkListRow = {
	id: number;
	slug: string;
	title: string;
	description: string | null;
	target_url: string;
	category: ShortlinkCategoryKey | string;
	tags: string | null;
	notes: string | null;
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

type CategoryStatsRow = {
	category: ShortlinkCategoryKey | string;
	link_count: number | null;
	total_clicks: number | null;
};

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const cleanText = (value: string, maxLength = 500) => {
	const text = value.trim();
	return text ? text.slice(0, maxLength) : '';
};

const parseTagsInput = (value: string) => {
	const tags = value
		.split(',')
		.map((tag) => tag.trim().toLowerCase())
		.filter(Boolean)
		.map((tag) => tag.replace(/\s+/g, '-').slice(0, 40));

	return Array.from(new Set(tags)).slice(0, 12);
};

const stringifyTags = (tags: string[]) => (tags.length > 0 ? JSON.stringify(tags) : null);

const parseStoredTags = (value: string | null) => {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((tag): tag is string => typeof tag === 'string').slice(0, 12);
	} catch {
		return [];
	}
};

const normalizeCategory = (value: string | null): ShortlinkCategoryKey =>
	value && isShortlinkCategoryKey(value) ? value : DEFAULT_SHORTLINK_CATEGORY;

const readCreateForm = async (request: Request) => {
	const form = await request.formData();
	const category = normalizeCategory(String(form.get('category') ?? ''));
	const tags = parseTagsInput(String(form.get('tags') ?? ''));

	return {
		slug: sanitizeSlug(String(form.get('slug') ?? '')),
		title: cleanText(String(form.get('title') ?? ''), 160),
		description: cleanText(String(form.get('description') ?? ''), 500),
		targetUrl: String(form.get('target_url') ?? '').trim(),
		category,
		tags,
		tagsInput: tags.join(', '),
		notes: cleanText(String(form.get('notes') ?? ''), 1000),
		isActive: form.get('is_active') === 'on'
	};
};

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);

	const db = requireD1(event);
	const todayKey = getDateKey(new Date());
	const last7Key = getDateKey(daysAgo(6));
	const last14Key = getDateKey(daysAgo(13));
	const selectedCategory = event.url.searchParams.get('category');
	const activeFilter = event.url.searchParams.get('is_active') ?? 'all';
	const search = cleanText(event.url.searchParams.get('q') ?? '', 120);

	const where: string[] = [];
	const binds: (string | number)[] = [];
	const categoryFilter = selectedCategory && isShortlinkCategoryKey(selectedCategory) ? selectedCategory : 'all';

	if (categoryFilter !== 'all') {
		where.push('sl.category = ?');
		binds.push(categoryFilter);
	}

	if (activeFilter === 'active' || activeFilter === 'inactive') {
		where.push('sl.is_active = ?');
		binds.push(activeFilter === 'active' ? 1 : 0);
	}

	if (search) {
		where.push('(sl.slug LIKE ? OR sl.target_url LIKE ? OR sl.title LIKE ?)');
		const searchPattern = `%${search}%`;
		binds.push(searchPattern, searchPattern, searchPattern);
	}

	const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

	const [linksResult, dailyResult, categoryStatsResult] = await Promise.all([
		db
			.prepare(
				`SELECT
					sl.id,
					sl.slug,
					sl.title,
					sl.description,
					sl.target_url,
					sl.category,
					sl.tags,
					sl.notes,
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
				${whereSql}
				ORDER BY sl.updated_at DESC, sl.id DESC`
			)
			.bind(todayKey, last7Key, ...binds)
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
			.all<DailyChartRow>(),
		db
			.prepare(
				`SELECT
					sl.category,
					COUNT(*) AS link_count,
					COALESCE(SUM(total.total_clicks), 0) AS total_clicks
				FROM short_links sl
				LEFT JOIN (
					SELECT slug, COUNT(*) AS total_clicks
					FROM short_link_clicks
					GROUP BY slug
				) total ON total.slug = sl.slug
				GROUP BY sl.category
				ORDER BY total_clicks DESC, link_count DESC`
			)
			.all<CategoryStatsRow>()
	]);

	const shortlinks = (linksResult.results ?? []).map((row) => {
		const category = normalizeCategory(row.category);
		return {
			id: row.id,
			slug: row.slug,
			title: row.title,
			description: row.description,
			targetUrl: row.target_url,
			category,
			categoryLabel: SHORTLINK_CATEGORY_MAP.get(category)?.label ?? 'Lainnya',
			tags: parseStoredTags(row.tags),
			notes: row.notes,
			hasNotes: Boolean(row.notes?.trim()),
			isActive: Number(row.is_active) === 1,
			totalClicks: Number(row.total_clicks ?? 0),
			clicksToday: Number(row.clicks_today ?? 0),
			clicks7d: Number(row.clicks_7d ?? 0),
			copyUrl: `https://app.santrionline.com/r/${row.slug}`
		};
	});

	const categoryStats = (categoryStatsResult.results ?? [])
		.map((row) => {
			const category = normalizeCategory(row.category);
			const metadata = SHORTLINK_CATEGORY_MAP.get(category);
			return {
				key: category,
				label: metadata?.label ?? 'Lainnya',
				description: metadata?.description ?? '',
				color: metadata?.color ?? 'gray',
				linkCount: Number(row.link_count ?? 0),
				totalClicks: Number(row.total_clicks ?? 0)
			};
		})
		.filter((row) => row.linkCount > 0);

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
		categories: SHORTLINK_CATEGORIES,
		categoryStats,
		filters: {
			category: categoryFilter,
			isActive: activeFilter === 'active' || activeFilter === 'inactive' ? activeFilter : 'all',
			q: search
		},
		createDefaults: {
			category: DEFAULT_SHORTLINK_CATEGORY,
			isActive: true
		},
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

export const actions: Actions = {
	default: async (event) => {
		const user = requireAdmin(event);
		const db = requireD1(event);
		const values = await readCreateForm(event.request);

		if (!values.slug) {
			return fail(400, { error: 'Slug wajib diisi.', values });
		}
		if (!values.title) {
			return fail(400, { error: 'Title wajib diisi.', values });
		}
		if (!isValidTargetUrl(values.targetUrl)) {
			return fail(400, { error: 'Target URL wajib valid dan memakai http/https.', values });
		}

		const existing = await getShortLinkBySlug(db, values.slug);
		if (existing) {
			return fail(400, { error: 'Slug sudah dipakai.', values });
		}

		try {
			await db
				.prepare(
					`INSERT INTO short_links (
						slug, title, description, target_url, category, tags, notes, is_active, created_by, created_at, updated_at
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
				)
				.bind(
					values.slug,
					values.title,
					values.description || null,
					values.targetUrl,
					values.category,
					stringifyTags(values.tags),
					values.notes || null,
					values.isActive ? 1 : 0,
					user.id
				)
				.run();
		} catch (err) {
			console.error('shortlink:create', err);
			return fail(500, { error: 'Gagal membuat shortlink. Pastikan slug belum dipakai.', values });
		}

		return { created: true };
	},
	toggleStatus: async (event) => {
		requireAdmin(event);
		const db = requireD1(event);
		const form = await event.request.formData();
		const id = Number(form.get('id'));
		const isActive = form.get('is_active') === '1';

		if (!Number.isInteger(id) || id < 1) {
			return fail(400, { error: 'Shortlink tidak valid.' });
		}

		try {
			await db
				.prepare('UPDATE short_links SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
				.bind(isActive ? 1 : 0, id)
				.run();
		} catch (err) {
			console.error('shortlink:toggleStatus', err);
			return fail(500, { error: 'Gagal mengubah status shortlink.' });
		}

		return { updated: true };
	}
};
