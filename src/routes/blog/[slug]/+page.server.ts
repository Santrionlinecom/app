import { error } from '@sveltejs/kit';
import { getPostBySlug } from '$lib/server/cms';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
  const post = await getPostBySlug(platform!.env.DB, params.slug);
  
  if (!post || post.status !== 'published') {
    throw error(404, 'Post not found');
  }
  
  return { post };
};
