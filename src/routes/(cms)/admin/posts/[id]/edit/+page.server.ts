import { redirect, fail, error } from '@sveltejs/kit';
import { getPostById, updatePost } from '$lib/server/cms';
import type { PageServerLoad, Actions } from './$types';

const toJakartaEpoch = (dateStr: string | null, timeStr: string | null) => {
  if (!dateStr) return null;
  const time = timeStr && timeStr.trim() ? timeStr : '00:00';
  const parsed = Date.parse(`${dateStr}T${time}+07:00`);
  return Number.isFinite(parsed) ? parsed : null;
};

export const load: PageServerLoad = async ({ locals, params, platform }) => {
  if (!locals.user) throw redirect(302, '/auth');
  if (locals.user.role !== 'admin' && locals.user.role !== 'ustadz' && locals.user.role !== 'ustadzah') {
    throw redirect(302, '/dashboard');
  }
  const db = platform?.env?.DB;
  if (!db) throw error(500, 'Database (D1) tidak tersedia');

  const post = await getPostById(db, params.id);
  if (!post) throw error(404, 'Post not found');
  
  return { post };
};

export const actions: Actions = {
  default: async ({ request, params, platform, locals }) => {
    if (
      !locals.user ||
      (locals.user.role !== 'admin' && locals.user.role !== 'ustadz' && locals.user.role !== 'ustadzah')
    ) {
      return fail(403, { error: 'Tidak diizinkan' });
    }
    const db = platform?.env?.DB;
    if (!db) return fail(500, { error: 'Database (D1) tidak tersedia' });
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
    try {
      await updatePost(db, params.id, {
        title,
        slug,
        content,
        excerpt,
        status,
        seo_keyword,
        meta_description,
        thumbnail_url,
        scheduled_at
      });
    } catch (e: any) {
      const msg = String(e?.message || e || '');
      if (msg.includes('UNIQUE') && msg.toLowerCase().includes('slug')) {
        return fail(400, { error: 'Slug sudah digunakan. Silakan pilih slug lain.' });
      }
      return fail(500, { error: 'Gagal memperbarui post', detail: msg });
    }
    
    throw redirect(303, '/admin/posts');
  }
};
