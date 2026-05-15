import { error, redirect } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import { isSuperAdminUser } from '$lib/auth/session-user';

export type ShortLink = {
	id: number;
	slug: string;
	title: string;
	description: string | null;
	target_url: string;
	category: string;
	tags: string | null;
	notes: string | null;
	is_active: number;
	created_by: string | null;
	created_at: string;
	updated_at: string;
};

export type ShortLinkClickInput = {
	link_id: number | null;
	slug: string;
	source?: string | null;
	campaign?: string | null;
	medium?: string | null;
	referrer?: string | null;
	user_agent?: string | null;
	country?: string | null;
	city?: string | null;
	colo?: string | null;
	ip_hash?: string | null;
	date_key: string;
	clicked_at?: string | null;
};

export type DailyStatsInput = {
	link_id: number | null;
	slug: string;
	date_key: string;
	unique_click?: boolean;
};

const ADMIN_ROLES = new Set(['admin']);
const MAX_TEXT_LENGTH = 500;

const cleanText = (value?: string | null, maxLength = MAX_TEXT_LENGTH) => {
	const text = value?.trim();
	return text ? text.slice(0, maxLength) : null;
};

export const sanitizeSlug = (slug: string) =>
	slug
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, '')
		.slice(0, 96);

export const getDateKey = (date: Date) => date.toISOString().slice(0, 10);

export const isValidTargetUrl = (url: string) => {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
};

export async function hashIp(ip?: string | null, secret?: string | null) {
	const normalizedIp = ip?.trim();
	const normalizedSecret = secret?.trim();
	if (!normalizedIp || !normalizedSecret) return null;

	const input = new TextEncoder().encode(`${normalizedSecret}:${normalizedIp}`);
	const digest = await globalThis.crypto.subtle.digest('SHA-256', input);
	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}

export async function getShortLinkBySlug(db: D1Database, slug: string): Promise<ShortLink | null> {
	const safeSlug = sanitizeSlug(slug);
	if (!safeSlug) return null;

	try {
		return await db
			.prepare(
				`SELECT id, slug, title, description, target_url, category, tags, notes, is_active, created_by, created_at, updated_at
				 FROM short_links
				 WHERE slug = ?
				 LIMIT 1`
			)
			.bind(safeSlug)
			.first<ShortLink>();
	} catch (err) {
		console.error('shortlink:getShortLinkBySlug', err);
		return null;
	}
}

export async function createShortLinkClick(db: D1Database, data: ShortLinkClickInput) {
	try {
		await db
			.prepare(
				`INSERT INTO short_link_clicks (
					link_id, slug, source, campaign, medium, referrer, user_agent,
					country, city, colo, ip_hash, date_key, clicked_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`
			)
			.bind(
				data.link_id,
				data.slug,
				cleanText(data.source, 120),
				cleanText(data.campaign, 120),
				cleanText(data.medium, 120),
				cleanText(data.referrer, 500),
				cleanText(data.user_agent, 500),
				cleanText(data.country, 80),
				cleanText(data.city, 120),
				cleanText(data.colo, 20),
				cleanText(data.ip_hash, 128),
				data.date_key,
				data.clicked_at ?? null
			)
			.run();
		return true;
	} catch (err) {
		console.error('shortlink:createShortLinkClick', err);
		return false;
	}
}

export async function incrementDailyStats(db: D1Database, data: DailyStatsInput) {
	const uniqueIncrement = data.unique_click ? 1 : 0;

	try {
		await db
			.prepare(
				`INSERT INTO short_link_daily_stats (
					link_id, slug, date_key, clicks, unique_clicks, created_at, updated_at
				) VALUES (?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
				ON CONFLICT(slug, date_key) DO UPDATE SET
					link_id = COALESCE(excluded.link_id, short_link_daily_stats.link_id),
					clicks = short_link_daily_stats.clicks + 1,
					unique_clicks = short_link_daily_stats.unique_clicks + excluded.unique_clicks,
					updated_at = CURRENT_TIMESTAMP`
			)
			.bind(data.link_id, data.slug, data.date_key, uniqueIncrement)
			.run();
		return true;
	} catch (err) {
		console.error('shortlink:incrementDailyStats', err);
		return false;
	}
}

export async function hasSeenIpHashToday(
	db: D1Database,
	slug: string,
	dateKey: string,
	ipHash?: string | null
) {
	if (!ipHash) return false;

	try {
		const row = await db
			.prepare(
				`SELECT id
				 FROM short_link_clicks
				 WHERE slug = ? AND date_key = ? AND ip_hash = ?
				 LIMIT 1`
			)
			.bind(slug, dateKey, ipHash)
			.first<{ id: number }>();
		return Boolean(row);
	} catch (err) {
		console.error('shortlink:hasSeenIpHashToday', err);
		return false;
	}
}

export function requireAdmin(event: { locals: App.Locals }) {
	const user = event.locals.user;
	if (!user) throw redirect(302, '/auth');
	if (!isSuperAdminUser(user) && !ADMIN_ROLES.has(user.role ?? '')) {
		throw error(403, 'Tidak diizinkan mengakses admin shortlink.');
	}
	return user;
}
