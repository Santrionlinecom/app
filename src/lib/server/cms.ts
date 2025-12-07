import type { D1Database } from '@cloudflare/workers-types';

export interface CmsPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: 'draft' | 'published';
  created_at: number;
  updated_at: number;
}

export async function getAllPosts(db: D1Database): Promise<CmsPost[]> {
  const { results } = await db.prepare('SELECT * FROM cms_posts ORDER BY created_at DESC').all();
  return results as CmsPost[];
}

export async function getPublishedPosts(db: D1Database): Promise<CmsPost[]> {
  const { results } = await db.prepare("SELECT * FROM cms_posts WHERE status = 'published' ORDER BY created_at DESC").all();
  return results as CmsPost[];
}

export async function getPostById(db: D1Database, id: string): Promise<CmsPost | null> {
  return await db.prepare('SELECT * FROM cms_posts WHERE id = ?').bind(id).first();
}

export async function getPostBySlug(db: D1Database, slug: string): Promise<CmsPost | null> {
  return await db.prepare('SELECT * FROM cms_posts WHERE slug = ?').bind(slug).first();
}

export async function createPost(db: D1Database, post: Omit<CmsPost, 'created_at' | 'updated_at'>): Promise<void> {
  const now = Date.now();
  await db.prepare('INSERT INTO cms_posts (id, title, slug, content, excerpt, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(post.id, post.title, post.slug, post.content, post.excerpt, post.status, now, now).run();
}

export async function updatePost(db: D1Database, id: string, post: Partial<Omit<CmsPost, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
  const now = Date.now();
  const fields = Object.keys(post).map(k => `${k} = ?`).join(', ');
  await db.prepare(`UPDATE cms_posts SET ${fields}, updated_at = ? WHERE id = ?`)
    .bind(...Object.values(post), now, id).run();
}

export async function deletePost(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM cms_posts WHERE id = ?').bind(id).run();
}
