import { error, fail, redirect } from '@sveltejs/kit';
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
		title: String(form.get('title') ?? '').trim(),
		description: String(form.get('description') ?? '').trim(),
		targetUrl: String(form.get('target_url') ?? '').trim(),
		isActive: form.get('is_active') === 'on'
	};
};

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);

	const slug = sanitizeSlug(event.params.id);
	if (!slug || slug !== event.params.id.trim().toLowerCase()) {
		throw error(404, 'Shortlink tidak ditemukan.');
	}

	const db = requireD1(event);
	const link = await getShortLinkBySlug(db, slug);
	if (!link) throw error(404, 'Shortlink tidak ditemukan.');

	return {
		link: {
			slug: link.slug,
			title: link.title,
			description: link.description ?? '',
			targetUrl: link.target_url,
			isActive: Number(link.is_active) === 1
		}
	};
};

export const actions: Actions = {
	default: async (event) => {
		requireAdmin(event);

		const slug = sanitizeSlug(event.params.id);
		if (!slug || slug !== event.params.id.trim().toLowerCase()) {
			return fail(400, { error: 'Slug tidak valid.' });
		}

		const db = requireD1(event);
		const values = await readForm(event.request);

		if (!values.title) {
			return fail(400, { error: 'Title wajib diisi.', values });
		}
		if (!isValidTargetUrl(values.targetUrl)) {
			return fail(400, { error: 'Target URL wajib valid dan memakai http/https.', values });
		}

		const link = await getShortLinkBySlug(db, slug);
		if (!link) {
			return fail(404, { error: 'Shortlink tidak ditemukan.', values });
		}

		try {
			await db
				.prepare(
					`UPDATE short_links
					 SET title = ?, description = ?, target_url = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
					 WHERE slug = ?`
				)
				.bind(values.title, values.description || null, values.targetUrl, values.isActive ? 1 : 0, slug)
				.run();
		} catch (err) {
			console.error('shortlink:update', err);
			return fail(500, { error: 'Gagal menyimpan perubahan.', values });
		}

		throw redirect(303, `/admin/shortlinks/${slug}`);
	}
};
