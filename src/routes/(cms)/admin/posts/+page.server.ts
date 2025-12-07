import { redirect } from '@sveltejs/kit';
import { getAllPosts, deletePost } from '$lib/server/cms';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!locals.user) throw redirect(302, '/login');
  
  const posts = await getAllPosts(platform!.env.DB);
  return { posts };
};

export const actions: Actions = {
  delete: async ({ request, platform }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    await deletePost(platform!.env.DB, id);
    return { success: true };
  }
};
