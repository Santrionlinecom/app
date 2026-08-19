import { error } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import { getPostBySlug } from '$lib/server/cms';
import { sisipkanTautanInternal } from '$lib/server/seo/internal-links';
import type { PageServerLoad } from './$types';

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const load: PageServerLoad = async ({ params, platform, url }) => {
  const db = platform!.env.DB as D1Database;
  const post = await getPostBySlug(db, params.slug);
  
  if (!post || post.status !== 'published') {
    throw error(404, 'Post not found');
  }

  const origin = url.origin.replace(/\/+$/, '');
  const canonicalUrl = `${origin}/blog/${post.slug}`;
  const publishedAt = post.scheduled_at ?? post.created_at;
  const modifiedAt = post.updated_at ?? publishedAt;
  const description =
    post.meta_description?.trim() ||
    post.excerpt?.trim() ||
    stripHtml(post.content).slice(0, 160) ||
    post.title;

  return {
    post: {
      ...post,
      // Tautan disisipkan saat render, bukan disimpan ke basis data: seluruh
      // arsip lama ikut mendapat backlink tanpa satu pun UPDATE berisiko, dan
      // isi asli artikel tetap utuh bila peta tautan kelak berubah.
      content: sisipkanTautanInternal(post.content)
    },
    seo: {
      title: post.title,
      description,
      canonicalUrl,
      imageUrl: post.thumbnail_url ?? `${origin}/santrionline.png`,
      datePublished: new Date(publishedAt).toISOString(),
      dateModified: new Date(modifiedAt).toISOString(),
      authorName: 'Redaksi Santri Online',
      authorUrl: `${origin}/tentang`,
      siteName: 'Santri Online',
      publisherName: 'Santri Online',
      publisherLogoUrl: `${origin}/icons/icon-192.png`,
      keywords: post.seo_keyword,
      // GEO: artikel berbahasa Indonesia untuk pembaca Indonesia. Tanpa ini
      // mesin pencari harus menebak bahasa dan wilayah sasarannya.
      locale: 'id_ID',
      language: 'id-ID',
      region: 'ID',
      articleSection: post.kategori ?? 'dakwah'
    },
    relatedPosts: (
      (
        await db
          .prepare(
            `SELECT title, slug, thumbnail_url as thumbnail
             FROM cms_posts
             WHERE status = 'published'
               AND slug <> ?
               AND (scheduled_at IS NULL OR scheduled_at <= strftime('%s','now')*1000)
             ORDER BY COALESCE(updated_at, scheduled_at, created_at) DESC
             LIMIT 5`
          )
          .bind(post.slug)
          .all()
          .catch(() => ({ results: [] }))
      ).results ?? []
    ) as Array<{ title: string; slug: string; thumbnail?: string | null }>
  };
};
