import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireD1 } from '$lib/server/cloudflare';
import {
	getShortLinkBySlug,
	isValidTargetUrl,
	requireAdmin,
	sanitizeSlug
} from '$lib/server/shortlink';

const readForm = async (request: Request) => {
	const form = await request.formData();
	return {
		slug: sanitizeSlug(String(form.get('slug') ?? '')),
		title: String(form.get('title') ?? '').trim(),
		description: String(form.get('description') ?? '').trim(),
		targetUrl: String(form.get('target_url') ?? '').trim(),
		isActive: form.get('is_active') === 'on'
	};
};

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const user = requireAdmin(event);
		const db = requireD1(event);
		const values = await readForm(event.request);

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
						slug, title, description, target_url, is_active, created_by, created_at, updated_at
					) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
				)
				.bind(
					values.slug,
					values.title,
					values.description || null,
					values.targetUrl,
					values.isActive ? 1 : 0,
					user.id
				)
				.run();
		} catch (err) {
			console.error('shortlink:create', err);
			return fail(500, { error: 'Gagal membuat shortlink. Pastikan slug belum dipakai.', values });
		}

		throw redirect(303, `/admin/shortlinks/${values.slug}`);
	}
};
