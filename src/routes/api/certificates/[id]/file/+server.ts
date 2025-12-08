import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildStorageKey, getCertificateById } from '$lib/server/certificates';

export const GET: RequestHandler = async ({ locals, params, platform }) => {
    if (!locals.user) {
        throw error(401, 'Unauthorized');
    }
    if (!locals.db) {
        throw error(500, 'Database tidak tersedia');
    }

    const cert = await getCertificateById(locals.db!, params.id);
    if (!cert) {
        throw error(404, 'Sertifikat tidak ditemukan');
    }

    const isOwner = cert.santri_id === locals.user.id;
    const isPrivileged = locals.user.role === 'admin' || locals.user.role === 'ustadz' || locals.user.role === 'ustadzah';
    if (!isOwner && !isPrivileged) {
        throw error(403, 'Tidak boleh mengunduh sertifikat ini');
    }

    const bucket = platform?.env?.BUCKET;
    if (!bucket) {
        throw error(500, 'Storage R2 tidak tersedia');
    }

    const objectKey = buildStorageKey(cert.santri_id, cert.id);
    const object = await bucket.get(objectKey);
    if (!object) {
        throw error(404, 'File sertifikat belum tersedia');
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType ?? 'application/pdf');
    headers.set('Content-Disposition', `inline; filename="${cert.id}.pdf"`);

    return new Response(object.body as any, { status: 200, headers });
};
