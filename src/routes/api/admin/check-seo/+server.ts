import { json } from '@sveltejs/kit';
import { canManageCms } from '$lib/server/auth/cms-access';
import type { RequestHandler } from './$types';

type SeoCheck = {
	label: string;
	ok: boolean;
	value?: string;
	bobot: number;
};

const readString = (value: unknown, maxLength = 24000) =>
	typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 });
	}

	if (!canManageCms(locals.user)) {
		return json({ error: 'Tidak diizinkan.' }, { status: 403 });
	}

	const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
	const judul = readString(body.judul ?? body.title, 180);
	const isi = readString(body.isi ?? body.content);
	const metaDescription = readString(body.meta_description, 240);
	const focusKeyword = readString(body.focus_keyword ?? body.seo_keyword, 120);
	const slug = readString(body.slug, 120);
	const thumbnailUrl = readString(body.thumbnail_url, 500);
	const plainContent = stripHtml(isi);
	const keywordLower = focusKeyword.toLowerCase();
	const checks: SeoCheck[] = [];
	let score = 0;

	const addCheck = (check: SeoCheck) => {
		checks.push(check);
		if (check.ok) score += check.bobot;
	};

	const judulLen = judul.length;
	addCheck({
		label: 'Judul 40-60 karakter',
		ok: judulLen >= 40 && judulLen <= 60,
		value: `${judulLen}/60 karakter`,
		bobot: 15
	});

	addCheck({
		label: 'Keyword ada di judul',
		ok: Boolean(keywordLower && judul.toLowerCase().includes(keywordLower)),
		bobot: 15
	});

	const awal100 = plainContent.slice(0, 100).toLowerCase();
	addCheck({
		label: 'Keyword muncul di awal konten',
		ok: Boolean(keywordLower && awal100.includes(keywordLower)),
		bobot: 10
	});

	const wordCount = plainContent ? plainContent.split(/\s+/).filter(Boolean).length : 0;
	addCheck({
		label: 'Konten minimal 300 kata',
		ok: wordCount >= 300,
		value: `${wordCount} kata`,
		bobot: 15
	});

	const metaLen = metaDescription.length;
	addCheck({
		label: 'Meta description 140-160 karakter',
		ok: metaLen >= 140 && metaLen <= 160,
		value: `${metaLen}/160 karakter`,
		bobot: 10
	});

	addCheck({
		label: 'Ada heading H2 di konten',
		ok: /<h2[\s>]/i.test(isi),
		bobot: 10
	});

	addCheck({
		label: 'Slug SEO-friendly',
		ok: Boolean(slug && /^[a-z0-9-]+$/.test(slug) && slug.length <= 60),
		bobot: 10
	});

	addCheck({
		label: 'Ada gambar di konten atau thumbnail',
		ok: Boolean(thumbnailUrl || /<img[\s>]/i.test(isi)),
		bobot: 10
	});

	addCheck({
		label: 'Ada internal link',
		ok: /href=["']\/[^"']+["']/i.test(isi),
		bobot: 5
	});

	return json({ score, checks, wordCount });
};
