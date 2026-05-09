import { error, json } from '@sveltejs/kit';
import { requireSuperAdmin } from '$lib/server/auth/requireSuperAdmin';
import type { RequestHandler } from './$types';

const normalizeTriggerUrl = (value?: string | null) => {
	const raw = value?.trim();
	if (!raw) return null;

	const url = new URL(raw);
	if (url.pathname === '/' || !url.pathname) {
		url.pathname = '/trigger';
	}
	return url.toString();
};

export const POST: RequestHandler = async ({ fetch, locals, platform }) => {
	requireSuperAdmin(locals);

	const secret = platform?.env?.NEWS_FETCH_SECRET?.trim();
	if (!secret) {
		throw error(500, 'NEWS_FETCH_SECRET belum dikonfigurasi.');
	}

	let workerUrl: string | null = null;
	try {
		workerUrl = normalizeTriggerUrl(platform?.env?.NEWS_FETCHER_URL);
	} catch {
		throw error(500, 'NEWS_FETCHER_URL tidak valid.');
	}

	if (!workerUrl) {
		throw error(500, 'NEWS_FETCHER_URL belum dikonfigurasi.');
	}

	const response = await fetch(workerUrl, {
		method: 'POST',
		headers: {
			'X-Secret': secret
		}
	});

	const payload = (await response.json().catch(() => ({}))) as {
		message?: string;
		error?: string;
	};

	if (!response.ok) {
		throw error(502, payload.error || payload.message || 'Gagal trigger news fetcher.');
	}

	return json({
		success: true,
		message: payload.message || 'Pengambilan berita dimulai. Tunggu 2-3 menit.'
	});
};
