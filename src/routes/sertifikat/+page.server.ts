import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
    buildDownloadUrl,
    collectCertificateStats,
    ensureCertificateTable,
    listCertificatesForSantri
} from '$lib/server/certificates';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(302, '/auth');
    }
    if (!locals.db) {
        throw error(500, 'Database tidak tersedia');
    }

    await ensureCertificateTable(locals.db!);
    const certificates = await listCertificatesForSantri(locals.db!, locals.user.id);
    const stats = await collectCertificateStats(locals.db!, locals.user.id);

    return {
        user: locals.user,
        certificates: certificates.map((c) => ({ ...c, downloadUrl: buildDownloadUrl(c.id) })),
        stats
    };
};
