import { redirect, fail } from '@sveltejs/kit';
import { createPost } from '$lib/server/cms';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/login');
  return {};
};

export const actions: Actions = {
  default: async ({ request, platform }) => {
    const data = await request.formData();
    const title = data.get('title') as string;
    const slug = data.get('slug') as string;
    const content = data.get('content') as string;
    const excerpt = data.get('excerpt') as string;
    const status = data.get('status') as 'draft' | 'published';

    if (!title || !slug || !content) {
      return fail(400, { error: 'Missing required fields' });
    }

    const id = crypto.randomUUID();
    await createPost(platform!.env.DB, { id, title, slug, content, excerpt, status });
    
    throw redirect(303, '/admin/posts');
  }
};
