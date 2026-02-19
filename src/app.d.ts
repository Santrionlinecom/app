// 👇 BARIS INI WAJIB ADA (Supaya D1Database & R2Bucket dikenali sistem)
import type { Ai, D1Database, R2Bucket, VectorizeIndex } from '@cloudflare/workers-types';

declare global {
    namespace App {
        // interface Error {}

        // Mendefinisikan data User & Session agar dikenali di hooks
        interface Locals {
            user: import('lucia').User | null;
            session: import('lucia').Session | null;
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
                R2_PUBLIC_BASE_URL?: string;
                // Pastikan binding di wrangler.toml namanya "BUCKET"
                // (Jika belum pakai R2, baris ini boleh dihapus atau biarkan saja)
                BUCKET: R2Bucket; 
            }
            context: {
                waitUntil(promise: Promise<unknown>): void;
            }
            caches: CacheStorage & { default: Cache }
        }
    }
}

export { };
