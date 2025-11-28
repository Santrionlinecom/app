// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}

		// Mendefinisikan data User & Session agar dikenali di hooks
		interface Locals {
			user: import('lucia').User | null;
			session: import('lucia').Session | null;
			db: D1Database;
		}

		// interface PageData {}
		// interface PageState {}

		// Mendefinisikan Platform Cloudflare
		interface Platform {
			env: {
				DB: D1Database;
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