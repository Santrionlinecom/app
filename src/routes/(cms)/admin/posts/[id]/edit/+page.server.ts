import { redirect, fail, error } from '@sveltejs/kit';
import { getPostById, updatePost } from '$lib/server/cms';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, params, platform }) => {
  if (!locals.user) throw redirect(302, '/login');
  
  const post = await getPostById(platform!.env.DB, params.id);
  if (!post) throw error(404, 'Post not found');
  
  return { post };
};

export const actions: Actions = {
  default: async ({ request, params, platform }) => {
    const data = await request.formData();
    const title = data.get('title') as string;
    const slug = data.get('slug') as string;
    const content = data.get('content') as string;
    const excerpt = data.get('excerpt') as string;
    const status = data.get('status') as 'draft' | 'published';
    const seo_keyword = data.get('seo_keyword') as string;
    const meta_description = data.get('meta_description') as string;

    if (!title || !slug || !content) {
      return fail(400, { error: 'Missing required fields' });
    }

    await updatePost(platform!.env.DB, params.id, { title, slug, content, excerpt, status, seo_keyword, meta_description });
    
    throw redirect(303, '/admin/posts');
  }
};
