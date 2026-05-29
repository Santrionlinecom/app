import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { jsonError, requireSosmedContext } from '$lib/server/sosmed/context';
import {
	getMaxPhotoSize,
	getMaxStoragePerUser,
	getMediaBucket,
	getPublicMediaBaseUrl,
	uploadSosmedImage
} from '$lib/server/sosmed/upload';
import { requirePermission } from '$lib/rbac/helpers';

export const POST: RequestHandler = async ({ locals, request, platform }) => {
	const ctx = requireSosmedContext(locals);
	if (!ctx.ok) return ctx.error;
	requirePermission(locals, 'social.post');

	const bucket = getMediaBucket(platform?.env);
	const publicBaseUrl = getPublicMediaBaseUrl(platform?.env);
	if (!bucket || !publicBaseUrl) return jsonError('Storage media belum dikonfigurasi.', 503);

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return jsonError('Form upload tidak valid.', 400);
	}

	const file = formData.get('file');
	if (!(file instanceof File)) return jsonError('File foto wajib diisi.', 400);

	const result = await uploadSosmedImage(ctx.db, bucket, {
		file,
		lembagaId: ctx.lembagaId,
		userId: ctx.user.id,
		publicBaseUrl,
		maxPhotoSizeBytes: getMaxPhotoSize(platform?.env.MAX_PHOTO_SIZE_BYTES),
		maxStorageBytes: getMaxStoragePerUser(platform?.env.MAX_STORAGE_PER_USER_BYTES)
	});

	if (!result.ok) return json({ error: result.error }, { status: result.status });

	return json({
		url: result.url,
		size_bytes: result.size_bytes,
		used_bytes: result.used_bytes
	});
};
