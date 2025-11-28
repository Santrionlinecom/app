import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PUBLIC_BASE_URL } from '$env/static/public';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

export type CertificateRow = {
    id: string;
    santri_id: string;
    ustadz_id: string | null;
    title: string;
    description: string | null;
    issued_at: string;
    duration_days: number;
    total_hifz_ayat: number;
    total_doa: number;
    total_sessions: number;
    certificate_url: string | null;
};

const CERT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  santri_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ustadz_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  issued_at TEXT NOT NULL,
  duration_days INTEGER,
  total_hifz_ayat INTEGER DEFAULT 0,
  total_doa INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  certificate_url TEXT
);
`; // indexes dibuat saat init agar tidak error jika skema lama

export const ensureCertificateTable = async (db: D1Database) => {
    await db.prepare(CERT_TABLE_SQL).run();
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_certificates_santri ON certificates(santri_id)').run();
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_certificates_ustadz ON certificates(ustadz_id)').run();
};

export type CertificateStats = {
    totalHifzAyat: number;
    totalDoa: number;
    totalSessions: number;
    durationDays: number;
    startDate: string | null;
    endDate: string | null;
};

export const collectCertificateStats = async (db: D1Database, santriId: string): Promise<CertificateStats> => {
    const base =
        (await db
            .prepare(
                `SELECT
                    SUM(CASE WHEN status = 'disetujui' THEN 1 ELSE 0 END) as totalApproved,
                    COUNT(DISTINCT DATE(COALESCE(tanggal_setor, tanggal_approve))) as totalSessions,
                    MIN(COALESCE(tanggal_setor, tanggal_approve)) as startDate,
                    MAX(COALESCE(tanggal_approve, tanggal_setor)) as endDate
                 FROM hafalan_progress
                 WHERE user_id = ?`
            )
            .bind(santriId)
            .first<{
                totalApproved: number | null;
                totalSessions: number | null;
                startDate: string | null;
                endDate: string | null;
            }>()) ?? {
            totalApproved: 0,
            totalSessions: 0,
            startDate: null,
            endDate: null
        };

    let totalDoa = 0;
    try {
        const info = await db.prepare(`PRAGMA table_info('doa_progress')`).all<{ name: string }>();
        const hasTable = (info?.results ?? []).length > 0;
        const hasUser = (info?.results ?? []).some((c) => c.name === 'user_id');
        if (hasTable && hasUser) {
            const doaRow = await db
                .prepare(`SELECT COUNT(*) as total FROM doa_progress WHERE user_id = ?`)
                .bind(santriId)
                .first<{ total: number | null }>();
            totalDoa = doaRow?.total ? Number(doaRow.total) : 0;
        }
    } catch (err) {
        console.warn('doa_progress not found, skip totalDoa', err);
        totalDoa = 0;
    }

    const start = base.startDate ? new Date(base.startDate) : null;
    const end = base.endDate ? new Date(base.endDate) : null;
    const durationDays = start && end ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1) : 0;

    return {
        totalHifzAyat: base.totalApproved ? Number(base.totalApproved) : 0,
        totalDoa,
        totalSessions: base.totalSessions ? Number(base.totalSessions) : 0,
        durationDays,
        startDate: base.startDate,
        endDate: base.endDate
    };
};

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .slice(0, 80) || 'sertifikat';

const drawWrappedText = (
    page: import('pdf-lib').PDFPage,
    text: string,
    opts: { x: number; y: number; font: any; size: number; maxWidth: number; lineHeight: number; color?: any }
) => {
    const words = text.split(/\s+/);
    let current = '';
    let cursorY = opts.y;
    for (const word of words) {
        const tentative = current ? `${current} ${word}` : word;
        const width = opts.font.widthOfTextAtSize(tentative, opts.size);
        if (width > opts.maxWidth) {
            page.drawText(current, { x: opts.x, y: cursorY, size: opts.size, font: opts.font, color: opts.color });
            cursorY -= opts.lineHeight;
            current = word;
        } else {
            current = tentative;
        }
    }
    if (current) {
        page.drawText(current, { x: opts.x, y: cursorY, size: opts.size, font: opts.font, color: opts.color });
    }
};

export const buildCertificatePdf = async (params: {
    studentName: string;
    ustadzName: string;
    programTitle: string;
    issuedAt: string;
    summary: string;
    stats: CertificateStats;
}) => {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4 portrait
    const { width, height } = page.getSize();

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    // Header block
    page.drawRectangle({
        x: 36,
        y: height - 180,
        width: width - 72,
        height: 120,
        color: rgb(0.0, 0.45, 0.33),
        opacity: 0.92
    });
    page.drawText('SERTIFIKAT PENCAPAIAN', {
        x: 52,
        y: height - 90,
        size: 20,
        font: bold,
        color: rgb(1, 1, 1)
    });
    page.drawText(params.programTitle, {
        x: 52,
        y: height - 120,
        size: 14,
        font,
        color: rgb(0.9, 0.98, 0.95)
    });

    // Body
    const labelColor = rgb(0.26, 0.35, 0.39);
    const textColor = rgb(0.1, 0.13, 0.15);

    page.drawText('Nama Santri', { x: 52, y: height - 220, size: 11, font, color: labelColor });
    page.drawText(params.studentName, { x: 52, y: height - 238, size: 18, font: bold, color: textColor });

    page.drawText('Ustadz Pembimbing', { x: 52, y: height - 270, size: 11, font, color: labelColor });
    page.drawText(params.ustadzName, { x: 52, y: height - 288, size: 14, font, color: textColor });

    page.drawText('Ringkasan Capaian', { x: 52, y: height - 320, size: 11, font, color: labelColor });
    drawWrappedText(page, params.summary, {
        x: 52,
        y: height - 340,
        font,
        size: 12,
        maxWidth: width - 104,
        lineHeight: 16,
        color: textColor
    });

    const statStartY = height - 420;
    const statBoxWidth = (width - 120) / 3;
    const statData = [
        { label: 'Ayat Disetujui', value: params.stats.totalHifzAyat.toString() },
        { label: 'Sesi Setor/Murajaah', value: params.stats.totalSessions.toString() },
        { label: 'Durasi Belajar', value: `${params.stats.durationDays || 0} hari` }
    ];

    statData.forEach((item, idx) => {
        const x = 52 + idx * (statBoxWidth + 8);
        page.drawRectangle({ x, y: statStartY - 10, width: statBoxWidth, height: 70, color: rgb(0.96, 0.98, 0.98) });
        page.drawText(item.label, { x: x + 12, y: statStartY + 46, size: 9, font, color: labelColor });
        page.drawText(item.value, { x: x + 12, y: statStartY + 22, size: 16, font: bold, color: textColor });
    });

    page.drawText('Diterbitkan pada', { x: 52, y: statStartY - 80, size: 11, font, color: labelColor });
    page.drawText(params.issuedAt, { x: 52, y: statStartY - 98, size: 12, font: bold, color: textColor });

    return pdf.save();
};

export const uploadCertificateToR2 = async (
    bucket: R2Bucket,
    key: string,
    pdfBytes: Uint8Array,
    meta: { santriId: string; ustadzId?: string | null; title: string }
) => {
    await bucket.put(key, pdfBytes, {
        httpMetadata: {
            contentType: 'application/pdf'
        },
        customMetadata: {
            santriId: meta.santriId,
            ustadzId: meta.ustadzId ?? '',
            title: meta.title
        }
    });
};

export const listCertificatesForSantri = async (db: D1Database, santriId: string) => {
    await ensureCertificateTable(db);
    const { results } =
        (await db
            .prepare(
                'SELECT id, santri_id, ustadz_id, title, description, issued_at, duration_days, total_hifz_ayat, total_doa, total_sessions, certificate_url FROM certificates WHERE santri_id = ? ORDER BY issued_at DESC'
            )
            .bind(santriId)
            .all<CertificateRow>()) ?? {};
    return (results ?? []) as CertificateRow[];
};

export const getCertificateById = async (db: D1Database, id: string) => {
    await ensureCertificateTable(db);
    return (
        (await db
            .prepare(
                'SELECT id, santri_id, ustadz_id, title, description, issued_at, duration_days, total_hifz_ayat, total_doa, total_sessions, certificate_url FROM certificates WHERE id = ?'
            )
            .bind(id)
            .first<CertificateRow>()) ?? null
    );
};

export const createCertificateRecord = async (
    db: D1Database,
    payload: Omit<CertificateRow, 'certificate_url'> & { certificate_url: string | null }
) => {
    await ensureCertificateTable(db);
    await db
        .prepare(
            `INSERT INTO certificates (id, santri_id, ustadz_id, title, description, issued_at, duration_days, total_hifz_ayat, total_doa, total_sessions, certificate_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
            payload.id,
            payload.santri_id,
            payload.ustadz_id,
            payload.title,
            payload.description,
            payload.issued_at,
            payload.duration_days,
            payload.total_hifz_ayat,
            payload.total_doa,
            payload.total_sessions,
            payload.certificate_url
        )
        .run();
};

export const buildDownloadUrl = (certificateId: string) => {
    try {
        return new URL(`/api/certificates/${certificateId}/file`, PUBLIC_BASE_URL).toString();
    } catch {
        return `/api/certificates/${certificateId}/file`;
    }
};

export const buildStorageKey = (santriId: string, certificateId: string) =>
    `certificates/${santriId}/${certificateId}.pdf`;

export const formatIssuedAtLabel = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!d || Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(d);
};

