import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as XLSX from 'xlsx';
import {
	DEFAULT_SHORTLINK_CATEGORY,
	isShortlinkCategoryKey,
	SHORTLINK_CATEGORY_MAP,
	type ShortlinkCategoryKey
} from '$lib/constants/shortlink-categories';
import { requireD1 } from '$lib/server/cloudflare';
import { getDateKey, requireAdmin } from '$lib/server/shortlink';

type ShortlinkReportRow = {
	slug: string;
	title: string;
	description: string | null;
	target_url: string;
	category: ShortlinkCategoryKey | string;
	notes: string | null;
	is_active: number;
	created_at: string;
	updated_at: string;
	total_clicks: number | null;
	clicks_today: number | null;
	clicks_7d: number | null;
};

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const cleanText = (value: string, maxLength = 120) => {
	const text = value.trim();
	return text ? text.slice(0, maxLength) : '';
};

const normalizeCategory = (value: string | null): ShortlinkCategoryKey =>
	value && isShortlinkCategoryKey(value) ? value : DEFAULT_SHORTLINK_CATEGORY;

const formatDateTime = (value?: string | null) => {
	if (!value) return '';
	const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
	const date = new Date(normalized);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat('id-ID', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'Asia/Jakarta'
	}).format(date);
};

const escapeCsvCell = (value: unknown) => {
	let text = `${value ?? ''}`;
	if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
	return `"${text.replace(/"/g, '""')}"`;
};

const toCsv = (rows: unknown[][]) => `\ufeff${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}`;

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const db = requireD1(event);

	const format = `${event.url.searchParams.get('format') ?? 'xlsx'}`.toLowerCase();
	if (format !== 'xlsx' && format !== 'csv') {
		throw error(400, 'Format laporan tidak valid.');
	}

	const todayKey = getDateKey(new Date());
	const last7Key = getDateKey(daysAgo(6));
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
	const { results } = await db
		.prepare(
			`SELECT
				sl.slug,
				sl.title,
				sl.description,
				sl.target_url,
				sl.category,
				sl.notes,
				sl.is_active,
				sl.created_at,
				sl.updated_at,
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
		.all<ShortlinkReportRow>();

	const header = [
		'Slug',
		'Short URL',
		'Judul',
		'Deskripsi',
		'Target URL',
		'Kategori',
		'Status',
		'Total Klik',
		'Klik Hari Ini',
		'Klik 7 Hari',
		'Catatan',
		'Dibuat Pada',
		'Diupdate Pada'
	];

	const rows = (results ?? []).map((row) => {
		const category = normalizeCategory(row.category);
		return [
			row.slug,
			new URL(`/r/${row.slug}`, event.url.origin).toString(),
			row.title,
			row.description ?? '',
			row.target_url,
			SHORTLINK_CATEGORY_MAP.get(category)?.label ?? 'Lainnya',
			Number(row.is_active) === 1 ? 'Active' : 'Inactive',
			Number(row.total_clicks ?? 0),
			Number(row.clicks_today ?? 0),
			Number(row.clicks_7d ?? 0),
			row.notes ?? '',
			formatDateTime(row.created_at),
			formatDateTime(row.updated_at)
		];
	});

	const dateStamp = new Date().toISOString().slice(0, 10);
	const filename = `laporan-shortlink-${dateStamp}.${format}`;
	const table = [header, ...rows];

	if (format === 'csv') {
		return new Response(toCsv(table), {
			headers: {
				'Content-Type': 'text/csv;charset=utf-8',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	}

	const worksheet = XLSX.utils.aoa_to_sheet(table);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Shortlinks');
	const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

	return new Response(output, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
