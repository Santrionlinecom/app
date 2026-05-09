import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getD1, getR2Bucket, getR2PublicBaseUrl } from '$lib/server/cloudflare';
import { isSuperAdminUser } from '$lib/auth/session-user';

const toErrorMessage = (err: unknown) => {
	if (err instanceof Error) return err.message;
	return String(err);
};

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user || !isSuperAdminUser(locals.user)) {
		throw error(403, 'Tidak diizinkan.');
	}

	const db = getD1({ locals, platform });
	const bucket = getR2Bucket(platform);

	const d1 = {
		binding: Boolean(db),
		ok: false,
		message: ''
	};

	if (!db) {
		d1.message = 'Layanan data belum tersedia.';
	} else {
		try {
			await db.prepare('SELECT 1 as ok').first<{ ok: number }>();
			d1.ok = true;
			d1.message = 'Layanan data aktif.';
		} catch (err) {
			d1.message = `Tes layanan data gagal: ${toErrorMessage(err)}`;
		}
	}

	const r2 = {
		binding: Boolean(bucket),
		ok: false,
		message: '',
		publicBaseUrl: getR2PublicBaseUrl(platform)
	};

	if (!bucket) {
		r2.message = 'Layanan media belum tersedia.';
	} else {
		try {
			await bucket.list({ limit: 1 });
			r2.ok = true;
			r2.message = 'Layanan media aktif.';
		} catch (err) {
			r2.message = `Tes layanan media gagal: ${toErrorMessage(err)}`;
		}
	}

	const ok = d1.ok && r2.ok;

	return json(
		{
			ok,
			checkedAt: new Date().toISOString(),
			d1,
			r2
		},
		{ status: ok ? 200 : 503 }
	);
};
