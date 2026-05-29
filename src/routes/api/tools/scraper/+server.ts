import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isSuperAdminUser } from '$lib/auth/session-user';

const scraperTargets = {
	posts_demo: {
		label: 'JSONPlaceholder Posts',
		buildUrl: (limit: number) => `https://jsonplaceholder.typicode.com/posts?_limit=${limit}`
	},
	users_demo: {
		label: 'JSONPlaceholder Users',
		buildUrl: (limit: number) => `https://jsonplaceholder.typicode.com/users?_limit=${limit}`
	},
	quran_surah_demo: {
		label: 'Quran API Surah',
		buildUrl: (limit: number) => `https://api.quran.gading.dev/surah?limit=${limit}`
	}
} as const;

const allowedDomains = ['shopee.co.id', 'tokopedia.com', 'dummyjson.com'];
type ScraperTargetKey = keyof typeof scraperTargets;

const isScraperTargetKey = (value: string): value is ScraperTargetKey => value in scraperTargets;

const normalizeLimit = (value: unknown) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return 10;
	return Math.min(Math.max(Math.floor(parsed), 1), 50);
};

const parseCustomUrl = (value: unknown) => {
	if (typeof value !== 'string' || !value.trim()) {
		throw error(400, 'custom_url wajib diisi untuk target custom');
	}

	let parsedUrl: URL;
	try {
		parsedUrl = new URL(value.trim());
	} catch {
		throw error(400, 'Format custom_url tidak valid');
	}

	// Dapur Teknis: batasi protokol agar URL seperti file://, ftp://, atau skema internal tidak bisa dipakai.
	if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
		throw error(403, 'Akses ditolak: protokol URL tidak diizinkan');
	}

	// Dapur Teknis: tolak credential di URL untuk mencegah request seperti https://user:pass@domain.com.
	if (parsedUrl.username || parsedUrl.password) {
		throw error(403, 'Akses ditolak: URL dengan credential tidak diizinkan');
	}

	const hostname = parsedUrl.hostname.toLowerCase();
	const isAllowedDomain = allowedDomains.some((domain) => {
		const normalizedDomain = domain.toLowerCase();
		return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`);
	});

	// Dapur Teknis: whitelist domain mencegah SSRF ke localhost, metadata service, atau jaringan internal.
	if (!isAllowedDomain) {
		throw error(403, 'Akses ditolak: domain tidak masuk whitelist');
	}

	return parsedUrl.toString();
};

export const POST: RequestHandler = async ({ locals, request, fetch }) => {
	// Proteksi API: endpoint ini tetap memverifikasi session walaupun UI sudah diproteksi.
	// Request langsung dari Postman/curl tanpa session super_admin akan berhenti di sini.
	// Logic session berasal dari hooks.server.ts agar mengikuti sistem auth lama proyek.
	if (!locals.user || !isSuperAdminUser(locals.user)) {
		throw error(403, 'Forbidden');
	}

	const body = await request.json().catch(() => ({}));
	const target = typeof body.target === 'string' ? body.target : '';
	const limit = normalizeLimit(body.limit);
	const customUrl = body.custom_url;

	let targetUrl = '';
	let label = '';

	if (target === 'custom') {
		targetUrl = parseCustomUrl(customUrl);
		label = 'Target Kustom';
	} else if (isScraperTargetKey(target)) {
		const selectedTarget = scraperTargets[target];
		targetUrl = selectedTarget.buildUrl(limit);
		label = selectedTarget.label;
	} else {
		throw error(400, 'Target scraper tidak valid');
	}

	const startedAt = Date.now();

	const response = await fetch(targetUrl, {
		headers: {
			accept: 'application/json',
			'user-agent': 'SantriOnline-Scraper/1.0'
		}
	});

	const contentType = response.headers.get('content-type') ?? '';
	if (!response.ok) {
		throw error(response.status, `Target gagal merespons: ${response.statusText}`);
	}
	if (!contentType.includes('application/json')) {
		throw error(502, 'Target tidak mengembalikan JSON');
	}

	const rawData = await response.json();

	return json({
		ok: true,
		target,
		label,
		sourceUrl: targetUrl,
		url_fetched: targetUrl,
		fetchedBy: {
			id: locals.user.id,
			email: locals.user.email ?? 'super-admin@santrionline.local',
			role: 'super_admin'
		},
		meta: {
			status: response.status,
			durationMs: Date.now() - startedAt,
			fetchedAt: new Date().toISOString()
		},
		data: rawData
	});
};

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || !isSuperAdminUser(locals.user)) {
		throw error(403, 'Forbidden');
	}

	return json({
		ok: true,
		targets: [
			...Object.entries(scraperTargets).map(([key, value]) => ({
				key,
				label: value.label
			})),
			{ key: 'custom', label: 'Target Kustom (Paste Link)' }
		],
		allowedDomains
	});
};
