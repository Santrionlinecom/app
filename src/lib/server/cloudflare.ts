import { error } from '@sveltejs/kit';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

type BindingContext = {
	locals?: App.Locals;
	platform?: App.Platform | null;
};

const FALLBACK_R2_PUBLIC_BASE_URL = 'https://files.santrionline.com';

const normalizeBaseUrl = (value?: string | null) => value?.trim().replace(/\/+$/, '') || '';

const encodeR2Key = (key: string) =>
	key
		.split('/')
		.filter(Boolean)
		.map((segment) => encodeURIComponent(segment))
		.join('/');

export const getD1 = ({ locals, platform }: BindingContext): D1Database | null =>
	(locals?.db ?? platform?.env?.DB ?? null) as D1Database | null;

export const requireD1 = (ctx: BindingContext): D1Database => {
	const db = getD1(ctx);
	if (!db) {
		throw error(500, 'Database (D1) tidak tersedia. Pastikan binding `DB` aktif di Wrangler.');
	}
	return db;
};

export const getR2Bucket = (platform?: App.Platform | null): R2Bucket | null =>
	(platform?.env?.BUCKET ?? null) as R2Bucket | null;

export const requireR2Bucket = (platform?: App.Platform | null): R2Bucket => {
	const bucket = getR2Bucket(platform);
	if (!bucket) {
		throw error(500, 'Storage (R2 BUCKET) tidak tersedia. Pastikan binding `BUCKET` aktif di Wrangler.');
	}
	return bucket;
};

export const getR2PublicBaseUrl = (platform?: App.Platform | null) =>
	normalizeBaseUrl(platform?.env?.R2_PUBLIC_BASE_URL) || FALLBACK_R2_PUBLIC_BASE_URL;

export const buildR2PublicUrl = (key: string, platform?: App.Platform | null) => {
	const normalizedKey = encodeR2Key(key);
	return `${getR2PublicBaseUrl(platform)}/${normalizedKey}`;
};
