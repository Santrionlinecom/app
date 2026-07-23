import { redirect, fail } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import { createPost, ensureCmsSchema } from '$lib/server/cms';
import { canManageCms } from '$lib/server/auth/cms-access';
import type { PageServerLoad, Actions } from './$types';

const toJakartaEpoch = (dateStr: string | null, timeStr: string | null) => {
  if (!dateStr) return null;
  const time = timeStr && timeStr.trim() ? timeStr : '00:00';
  const parsed = Date.parse(`${dateStr}T${time}+07:00`);
  return Number.isFinite(parsed) ? parsed : null;
};

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/auth');
  if (!canManageCms(locals.user)) {
    throw redirect(302, '/dashboard');
  }
  return {};
};

export const actions: Actions = {
  default: async ({ request, platform, locals }) => {
    if (!canManageCms(locals.user)) {
      return fail(403, { error: 'Tidak diizinkan' });
    }
    const data = await request.formData();
    const title = data.get('title') as string;
    const slug = data.get('slug') as string;
    const content = data.get('content') as string;
    const excerpt = data.get('excerpt') as string;
    const status = data.get('status') as 'draft' | 'published';
    const seo_keyword = data.get('seo_keyword') as string;
    const meta_description = data.get('meta_description') as string;
    const thumbnail_url = (data.get('thumbnail_url') as string) || null;
    const schedule_date = data.get('schedule_date') as string;
    const schedule_time = data.get('schedule_time') as string;

    const scheduled_at = toJakartaEpoch(schedule_date, schedule_time);

    if (!title || !slug || !content) {
      return fail(400, { error: 'Missing required fields' });
    }

    const db = (locals.db ?? platform?.env?.DB) as unknown as D1Database | undefined;
    if (!db) {
      return fail(500, {
        error: 'Layanan data belum tersedia. Hubungi super admin.'
      });
    }

    try {
      await ensureCmsSchema(db as any);
      const id = crypto.randomUUID();
      await createPost(db as any, {
        id,
        title,
        slug,
        content,
        excerpt,
        status,
        thumbnail_url,
        seo_keyword,
        meta_description,
        scheduled_at
      });
    } catch (e: any) {
      const msg = String(e?.message || e || '');
      if (msg.includes('UNIQUE') && msg.toLowerCase().includes('slug')) {
        return fail(400, { error: 'Slug sudah digunakan. Silakan pilih slug lain.' });
      }
      return fail(500, {
        error: 'Gagal menyimpan data. Hubungi super admin.'
      });
    }

    throw redirect(303, '/admin/posts');
  }
};
