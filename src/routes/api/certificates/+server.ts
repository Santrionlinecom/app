import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
    buildCertificatePdf,
    buildDownloadUrl,
    buildStorageKey,
    collectCertificateStats,
    createCertificateRecord,
    formatIssuedAtLabel,
    listCertificatesForSantri,
    uploadCertificateToR2
} from '$lib/server/certificates';
import { generateId } from 'lucia';
import { assertFeature, assertLoggedIn, assertOrgMember, isSystemAdmin } from '$lib/server/auth/rbac';
import { getOrganizationById } from '$lib/server/organizations';

const ensureAuth = (locals: App.Locals) => {
    const user = assertLoggedIn({ locals });
    if (!locals.db) {
        throw error(500, 'Database tidak tersedia');
    }
    return user;
};

export const GET: RequestHandler = async ({ locals, url }) => {
    const user = ensureAuth(locals);
    const orgId = assertOrgMember(user);
    const org = await getOrganizationById(locals.db!, orgId);
    if (!org) {
        throw error(404, 'Lembaga tidak ditemukan');
    }
    assertFeature(org.type, user.role, 'raport');
    const targetId =
        user.role === 'santri' ? user.id : url.searchParams.get('userId') || user.id;

    const withStats = url.searchParams.get('withStats') === '1';

    if (!targetId) {
        throw error(400, 'userId wajib diisi');
    }
    if (!isSystemAdmin(user.role)) {
        const target = await locals.db!
            .prepare('SELECT org_id as orgId FROM users WHERE id = ?')
            .bind(targetId)
            .first<{ orgId: string | null }>();
        if (target?.orgId && target.orgId !== orgId) {
            throw error(403, 'Tidak boleh mengakses sertifikat lembaga lain');
        }
    }

    const certificates = await listCertificatesForSantri(locals.db!, targetId);
    const mapped = certificates.map((row) => ({
        ...row,
        downloadUrl: buildDownloadUrl(row.id)
    }));

    const payload: Record<string, unknown> = { certificates: mapped };
    if (withStats) {
        payload.stats = await collectCertificateStats(locals.db!, targetId);
    }

    return json(payload);
};

export const POST: RequestHandler = async ({ locals, request, platform }) => {
    const user = ensureAuth(locals);
    const bucket = platform?.env?.BUCKET;
    if (!bucket) {
        throw error(500, 'Storage R2 tidak tersedia');
    }
    const orgId = assertOrgMember(user);
    const org = await getOrganizationById(locals.db!, orgId);
    if (!org) {
        throw error(404, 'Lembaga tidak ditemukan');
    }
    assertFeature(org.type, user.role, 'raport');

    const body = await request.json().catch(() => ({}));

    const programTitle = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Program Tahfiz';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const minAyat = typeof body.minAyat === 'number' ? body.minAyat : 30;
    const minSessions = typeof body.minSessions === 'number' ? body.minSessions : 8;
    const targetSantri =
        user.role === 'santri'
            ? user.id
            : typeof body.userId === 'string'
              ? body.userId
              : user.id;

    if (!targetSantri) {
        throw error(400, 'userId santri wajib diisi');
    }

    if (user.role === 'santri' && targetSantri !== user.id) {
        throw error(403, 'Santri hanya bisa membuat sertifikat untuk dirinya sendiri');
    }
    if (!isSystemAdmin(user.role)) {
        const target = await locals.db!
            .prepare('SELECT org_id as orgId FROM users WHERE id = ?')
            .bind(targetSantri)
            .first<{ orgId: string | null }>();
        if (target?.orgId && target.orgId !== orgId) {
            throw error(403, 'Tidak boleh membuat sertifikat lembaga lain');
        }
    }

    const stats = await collectCertificateStats(locals.db!, targetSantri);
    if (stats.totalHifzAyat < minAyat || stats.totalSessions < minSessions) {
        return json(
            {
                error: `Belum memenuhi syarat minimal (${minAyat} ayat disetujui & ${minSessions} sesi).`,
                stats
            },
            { status: 400 }
        );
    }

    const santri = await locals.db!
        .prepare('SELECT username, email FROM users WHERE id = ?')
        .bind(targetSantri)
        .first<{ username: string | null; email: string }>();
    if (!santri) {
        throw error(404, 'Data santri tidak ditemukan');
    }

    // Tentukan ustadz yang tercantum di sertifikat
    let ustadzId: string | null =
        user.role === 'ustadz' || user.role === 'ustadzah' || user.role === 'admin'
            ? user.id
            : null;
    if (!ustadzId && typeof body.ustadzId === 'string') {
        ustadzId = body.ustadzId;
    }
    let ustadzName =
        user.role === 'ustadz' || user.role === 'ustadzah' || user.role === 'admin'
            ? user.username || user.email
            : 'Ustadz Pembimbing';
    if (ustadzId && (!ustadzName || ustadzId !== user?.id)) {
        const ustadzRow = await locals.db!
            .prepare('SELECT username, email FROM users WHERE id = ?')
            .bind(ustadzId)
            .first<{ username: string | null; email: string | null }>();
        ustadzName = ustadzRow?.username || ustadzRow?.email || ustadzName;
    }

    const certificateId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : generateId(20);
    const storageKey = buildStorageKey(targetSantri, certificateId);
    const issuedAt = new Date().toISOString();
    const issuedLabel = formatIssuedAtLabel(issuedAt) || issuedAt;

    const summary =
        description ||
        `Berhasil menuntaskan ${stats.totalHifzAyat} ayat disetujui, ${stats.totalDoa} doa dikuasai, dan ${stats.totalSessions} sesi setor/murajaah dalam ${stats.durationDays || 0} hari.`;

    const pdfBytes = await buildCertificatePdf({
        studentName: santri.username || santri.email,
        ustadzName,
        programTitle,
        issuedAt: issuedLabel,
        summary,
        stats
    });

    await uploadCertificateToR2(bucket, storageKey, pdfBytes, {
        santriId: targetSantri,
        ustadzId,
        title: programTitle
    });

    const downloadUrl = buildDownloadUrl(certificateId);
    await createCertificateRecord(locals.db!, {
        id: certificateId,
        santri_id: targetSantri,
        ustadz_id: ustadzId,
        title: programTitle,
        description: summary,
        issued_at: issuedAt,
        duration_days: stats.durationDays,
        total_hifz_ayat: stats.totalHifzAyat,
        total_doa: stats.totalDoa,
        total_sessions: stats.totalSessions,
        certificate_url: downloadUrl
    });

    return json({
        id: certificateId,
        downloadUrl,
        title: programTitle,
        issuedAt,
        stats,
        summary,
        ustadzId,
        santriId: targetSantri
    });
};
