import { redirect, fail } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
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
    const seo_keyword = data.get('seo_keyword') as string;
    const meta_description = data.get('meta_description') as string;

    if (!title || !slug || !content) {
      return fail(400, { error: 'Missing required fields' });
    }

    // Pastikan binding D1 tersedia (saat dev pakai `npx wrangler pages dev` / `wrangler dev`)
    const db = platform?.env?.DB as unknown as D1Database | undefined;
    if (!db) {
      return fail(500, {
        error:
          'Database (D1) belum terhubung. Jalankan dev dengan Cloudflare Wrangler: `npx wrangler pages dev` atau pastikan binding DB ada di wrangler.toml.'
      });
    }

    try {
      const id = crypto.randomUUID();
      await createPost(db as any, {
        id,
        title,
        slug,
        content,
        excerpt,
        status,
        seo_keyword,
        meta_description
      });
    } catch (e: any) {
      return fail(500, {
        error:
          'Gagal menyimpan ke database. Pastikan migrasi D1 sudah dijalankan (lihat folder migrations/ atau file schema.sql).',
        detail: String(e?.message || e)
      });
    }

    throw redirect(303, '/admin/posts');
  }
};
