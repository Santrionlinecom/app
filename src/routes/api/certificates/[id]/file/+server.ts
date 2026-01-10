import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildStorageKey, getCertificateById } from '$lib/server/certificates';
import { assertFeature, assertLoggedIn, assertOrgMember, isSystemAdmin } from '$lib/server/auth/rbac';
import { getOrganizationById } from '$lib/server/organizations';

export const GET: RequestHandler = async ({ locals, params, platform }) => {
    const user = assertLoggedIn({ locals });
    if (!locals.db) {
        throw error(500, 'Database tidak tersedia');
    }
    const orgId = assertOrgMember(user);
    const org = await getOrganizationById(locals.db!, orgId);
    if (!org) {
        throw error(404, 'Lembaga tidak ditemukan');
    }
    assertFeature(org.type, user.role, 'raport');

    const cert = await getCertificateById(locals.db!, params.id);
    if (!cert) {
        throw error(404, 'Sertifikat tidak ditemukan');
    }

    const isOwner = cert.santri_id === user.id;
    const isPrivileged = user.role === 'admin' || user.role === 'ustadz' || user.role === 'ustadzah';
    if (!isOwner && !isPrivileged) {
        throw error(403, 'Tidak boleh mengunduh sertifikat ini');
    }
    if (!isSystemAdmin(user.role) && !isOwner) {
        const target = await locals.db!
            .prepare('SELECT org_id as orgId FROM users WHERE id = ?')
            .bind(cert.santri_id)
            .first<{ orgId: string | null }>();
        if (target?.orgId && target.orgId !== orgId) {
            throw error(403, 'Tidak boleh mengunduh sertifikat lembaga lain');
        }
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
