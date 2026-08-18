import { error } from '@sveltejs/kit';
import MarkdownIt from 'markdown-it';

import { loadCuratedKitabContext } from '$lib/server/curated-kitab';
import { normalizeKitabSlug } from '$lib/kitab';

import type { PageServerLoad } from './$types';

const md = new MarkdownIt({ html: false, linkify: true, breaks: false });

const ARABIC_RE = /[\u0600-\u06ff]/;

/** Bungkus baris/paragraf Arab dengan div RTL agar tampil rapi. */
const renderMarkdown = (raw: string) => {
	const html = md.render(raw);
	return html.replace(/<(p|h1|h2|h3|li|td|th)([^>]*)>([\s\S]*?)<\/\1>/g, (match, tag, attrs, inner) => {
		const text = inner.replace(/<[^>]+>/g, '');
		const arabicChars = (text.match(/[\u0600-\u06ff]/g) ?? []).length;
		if (arabicChars > 0 && arabicChars >= text.replace(/\s/g, '').length * 0.5) {
			return `<${tag}${attrs} dir="rtl" class="arabic-text">${inner}</${tag}>`;
		}
		if (ARABIC_RE.test(text)) {
			return `<${tag}${attrs} class="mixed-arabic">${inner}</${tag}>`;
		}
		return match;
	});
};

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const slug = normalizeKitabSlug(params.slug);
	if (!slug) throw error(404, 'Kitab tidak ditemukan');

	const bucket = platform?.env?.BUCKET;
	if (!bucket) throw error(503, 'Penyimpanan tidak tersedia');

	const object = await bucket.get(`kitab-markdown/${slug}.md`);
	if (!object) throw error(404, 'Versi baca kitab ini belum tersedia');

	const raw = await object.text();

	let judul = slug;
	let ringkasan: string | null = null;
	try {
		const db = locals.db ?? platform?.env?.DB;
		const { item, curatedItem } = await loadCuratedKitabContext(slug, db);
		judul = curatedItem?.title ?? item?.title ?? slug;
		ringkasan = curatedItem?.summary ?? item?.summary ?? null;
	} catch {
		// metadata opsional; halaman baca tetap tampil
	}

	// Manifest parsing (opsional) untuk info halaman & waktu parse
	let pages: number | null = null;
	try {
		const manifest = await bucket.get(`kitab-markdown/${slug}.json`);
		if (manifest) {
			const data = (await manifest.json()) as { pages?: number };
			if (typeof data.pages === 'number') pages = data.pages;
		}
	} catch {
		// abaikan manifest rusak
	}

	return {
		slug,
		judul,
		ringkasan,
		pages,
		html: renderMarkdown(raw),
		bisaTanya: Boolean(locals.user)
	};
};
