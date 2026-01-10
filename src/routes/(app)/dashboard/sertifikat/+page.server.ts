import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
    buildDownloadUrl,
    collectCertificateStats
} from '$lib/server/certificates';
import { assertFeature, assertLoggedIn, assertOrgMember } from '$lib/server/auth/rbac';
import { getOrganizationById } from '$lib/server/organizations';

export const load: PageServerLoad = async ({ locals }) => {
    const user = assertLoggedIn({ locals });
    if (user.role !== 'admin' && user.role !== 'ustadz' && user.role !== 'ustadzah') {
        throw redirect(302, '/dashboard');
    }
    if (!locals.db) {
        throw error(500, 'Database tidak tersedia');
    }
    const orgId = assertOrgMember(user);
    const org = await getOrganizationById(locals.db, orgId);
    if (!org) {
        throw error(404, 'Lembaga tidak ditemukan');
    }
    assertFeature(org.type, user.role, 'raport');

    const { results: santriRows } =
        (await locals.db!
            .prepare("SELECT id, username, email FROM users WHERE role = 'santri' ORDER BY COALESCE(username, email)")
            .all<{ id: string; username: string | null; email: string | null }>()) ?? {};

    const { results: certRows } =
        (await locals.db!
            .prepare(
                `SELECT c.*, u.username as santriName, u.email as santriEmail, m.username as ustadzName, m.email as ustadzEmail
                 FROM certificates c
                 JOIN users u ON u.id = c.santri_id
                 LEFT JOIN users m ON m.id = c.ustadz_id
                 ORDER BY c.issued_at DESC
                 LIMIT 50`
            )
            .all()) ?? {};

    const firstSantriId = santriRows?.[0]?.id ?? null;
    const selectedStats = firstSantriId ? await collectCertificateStats(locals.db!, firstSantriId) : null;

    return {
        role: user.role,
        santri: (santriRows ?? []).map((row: { id: string; username: string | null; email: string | null }) => ({
            ...row,
            label: row.username || row.email || row.id
        })),
        certificates: (certRows ?? []).map((row: any) => ({
            ...row,
            downloadUrl: buildDownloadUrl(row.id),
            santriName: row.santriName || row.santriEmail,
            ustadzName: row.ustadzName || row.ustadzEmail
        })),
        selectedStats
    };
};
