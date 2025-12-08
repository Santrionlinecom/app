import type { D1Database } from '@cloudflare/workers-types';

export interface CmsPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: 'draft' | 'published';
  thumbnail_url: string | null;
  seo_keyword: string | null;
  meta_description: string | null;
  created_at: number;
  updated_at: number;
}

async function ensureCmsSchema(db: D1Database) {
  // Buat tabel jika belum ada, dan tambahkan kolom SEO jika belum ada
  // Catatan: D1 menggunakan SQLite, ALTER akan error jika kolom sudah ada — kita abaikan errornya
  // Tabel dasar (langsung termasuk kolom SEO agar idempotent)
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS cms_posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        thumbnail_url TEXT,
        seo_keyword TEXT,
        meta_description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`
    )
    .run();

  // Index dasar
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_cms_posts_slug ON cms_posts(slug)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_cms_posts_status ON cms_posts(status)').run();

  // Untuk kompatibilitas jika tabel lama tanpa kolom SEO masih ada
  try {
    await db.prepare('ALTER TABLE cms_posts ADD COLUMN seo_keyword TEXT').run();
  } catch (_) {
    // abaikan jika sudah ada
  }
  try {
    await db.prepare('ALTER TABLE cms_posts ADD COLUMN meta_description TEXT').run();
  } catch (_) {
    // abaikan jika sudah ada
  }
  try {
    await db.prepare('ALTER TABLE cms_posts ADD COLUMN thumbnail_url TEXT').run();
  } catch (_) {
    // abaikan jika sudah ada
  }
}

export async function getAllPosts(db: D1Database): Promise<CmsPost[]> {
  await ensureCmsSchema(db);
  const { results } = await db.prepare('SELECT * FROM cms_posts ORDER BY created_at DESC').all();
  return results as CmsPost[];
}

export async function getPublishedPosts(db: D1Database): Promise<CmsPost[]> {
  await ensureCmsSchema(db);
  const { results } = await db
    .prepare("SELECT * FROM cms_posts WHERE status = 'published' ORDER BY created_at DESC")
    .all();
  return results as CmsPost[];
}

export async function getPostById(db: D1Database, id: string): Promise<CmsPost | null> {
  await ensureCmsSchema(db);
  return await db.prepare('SELECT * FROM cms_posts WHERE id = ?').bind(id).first();
}

export async function getPostBySlug(db: D1Database, slug: string): Promise<CmsPost | null> {
  await ensureCmsSchema(db);
  return await db.prepare('SELECT * FROM cms_posts WHERE slug = ?').bind(slug).first();
}

export async function createPost(db: D1Database, post: Omit<CmsPost, 'created_at' | 'updated_at'>): Promise<void> {
  await ensureCmsSchema(db);
  const now = Date.now();
  await db
    .prepare(
      'INSERT INTO cms_posts (id, title, slug, content, excerpt, status, thumbnail_url, seo_keyword, meta_description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      post.id,
      post.title,
      post.slug,
      post.content,
      post.excerpt ?? null,
      post.status ?? 'draft',
      post.thumbnail_url ?? null,
      post.seo_keyword ?? null,
      post.meta_description ?? null,
      now,
      now
    )
    .run();
}

export async function updatePost(db: D1Database, id: string, post: Partial<Omit<CmsPost, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
  await ensureCmsSchema(db);
  const now = Date.now();
  const fields = Object.keys(post).map(k => `${k} = ?`).join(', ');
  await db.prepare(`UPDATE cms_posts SET ${fields}, updated_at = ? WHERE id = ?`)
    .bind(...Object.values(post), now, id).run();
}

export async function deletePost(db: D1Database, id: string): Promise<void> {
  await ensureCmsSchema(db);
  await db.prepare('DELETE FROM cms_posts WHERE id = ?').bind(id).run();
}
