// 👇 BARIS INI WAJIB ADA (Supaya D1Database & R2Bucket dikenali sistem)
import type { Ai, D1Database, R2Bucket, VectorizeIndex } from '@cloudflare/workers-types';

declare global {
    namespace App {
        // interface Error {}

        // Mendefinisikan data User & Session agar dikenali di hooks
        interface Locals {
            user:
                | (import('lucia').User & {
                        originalRole?: string | null;
                        actualRole?: string | null;
                        actualOrgId?: string | null;
                        avatarUrl?: string | null;
                        isImpersonating?: boolean;
                        impersonatedOrgId?: string | null;
                  })
                | null;
            session: import('lucia').Session | null;
            isSuperAdmin: boolean;
            orgType: import('$lib/types/rbac').OrgType | null;
            can: (permission: import('$lib/types/rbac').Permission) => boolean;
            // Saya beri tanda tanya (?) jaga-jaga jika di hooks belum di-set
            db?: D1Database; 
        }

        // interface PageData {}
        // interface PageState {}

        // Mendefinisikan Platform Cloudflare
        interface Platform {
            env: {
                // Pastikan binding di wrangler.toml namanya "DB"
                DB: D1Database;
                VECTORIZE_INDEX: VectorizeIndex;
                AI: Ai;
                MIGRATE_SECRET?: string;
                SEED_SECRET?: string;
                LICENSE_SIGNING_SECRET?: string;
                LICENSE_KEY_HASH_SECRET?: string;
                STREAMER_LICENSE_SIGNING_SECRET?: string;
                GROQ_API_KEY?: string;
                NEWS_FETCH_SECRET?: string;
                NEWS_FETCHER_URL?: string;
                SHORTLINK_SECRET?: string;
                MIDTRANS_SERVER_KEY?: string;
                MIDTRANS_CLIENT_KEY?: string;
                MIDTRANS_IS_PRODUCTION?: string;
                TURNSTILE_SITE_KEY?: string;
                TURNSTILE_SECRET_KEY?: string;
                R2_PUBLIC_BASE_URL?: string;
                R2_PUBLIC_URL?: string;
                MAX_PHOTO_SIZE_BYTES?: string;
                MAX_STORAGE_PER_USER_BYTES?: string;
                // Pastikan binding di wrangler.toml namanya "BUCKET"
                // (Jika belum pakai R2, baris ini boleh dihapus atau biarkan saja)
                BUCKET: R2Bucket;
                MEDIA_BUCKET?: R2Bucket;
            }
            context: {
                waitUntil(promise: Promise<unknown>): void;
            }
            caches: CacheStorage & { default: Cache }
        }
    }
}

export { };
