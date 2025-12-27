import { error } from '@sveltejs/kit';
import { getPostBySlug } from '$lib/server/cms';
import type { PageServerLoad } from './$types';

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const load: PageServerLoad = async ({ params, platform, url }) => {
  const post = await getPostBySlug(platform!.env.DB, params.slug);
  
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
    post,
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
      publisherLogoUrl: `${origin}/pwa-192x192.png`,
      keywords: post.seo_keyword
    }
  };
};
