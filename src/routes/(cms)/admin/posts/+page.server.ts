import { redirect, fail } from '@sveltejs/kit';
import { deletePost, ensureCmsSchema, getAllPosts, updatePost } from '$lib/server/cms';
import { canManageCms } from '$lib/server/auth/cms-access';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
  if (!locals.user) throw redirect(302, '/auth');
  if (!canManageCms(locals.user)) {
    throw redirect(302, '/dashboard');
  }

  const db = locals.db ?? platform?.env?.DB;
  if (!db) {
    return {
      posts: [],
      error:
        'Database (D1) tidak tersedia. Jalankan dev via Wrangler: `npx wrangler pages dev` atau pastikan binding DB pada wrangler.toml.'
    };
  }

  await ensureCmsSchema(db as any);

  const page = Number(url.searchParams.get('page') ?? '1');
  const limit = Number(url.searchParams.get('limit') ?? '10');
  const result = await getAllPosts(db, { page, limit });
  return {
    posts: result.posts,
    pagination: {
      page: result.page,
      limit: result.limit,
      totalCount: result.totalCount
    }
  };
};

export const actions: Actions = {
  delete: async ({ request, platform, locals }) => {
    if (!canManageCms(locals.user)) {
      return fail(403, { error: 'Tidak diizinkan' });
    }
    const db = locals.db ?? platform?.env?.DB;
    if (!db) return fail(500, { error: 'Database (D1) tidak tersedia' });
    await ensureCmsSchema(db as any);
    const data = await request.formData();
    const id = data.get('id') as string;
    await deletePost(db, id);
    return { success: true };
  },
  toggle: async ({ request, platform, locals }) => {
    if (!canManageCms(locals.user)) {
      return fail(403, { error: 'Tidak diizinkan' });
    }
    const db = locals.db ?? platform?.env?.DB;
    if (!db) return fail(500, { error: 'Database (D1) tidak tersedia' });
    await ensureCmsSchema(db as any);
    const data = await request.formData();
    const id = data.get('id') as string;
    const next = data.get('next') as 'draft' | 'published';
    await updatePost(db, id, { status: next });
    return { success: true };
  }
};
