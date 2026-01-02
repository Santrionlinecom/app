// src/lib/server/progress.ts

// PERBAIKAN: Ganti Argon2id dengan Scrypt agar kompatibel dengan Cloudflare
import { Scrypt } from '$lib/server/password'; 
import { generateId } from 'lucia';
import type { D1Database } from '@cloudflare/workers-types';
import { SURAH_DATA } from '$lib/surah-data';

export type HafalanStatus = 'belum' | 'setor' | 'disetujui';
export type QualityStatus = 'merah' | 'kuning' | 'hijau';

export type ChecklistRow = {
    surahNumber: number;
    name: string;
    totalAyah: number;
    setor: number;
    disetujui: number;
};

type ChecklistQueryRow = ChecklistRow & { setor: number | null; disetujui: number | null };

export const getSantriChecklist = async (db: D1Database, userId: string): Promise<ChecklistRow[]> => {
    // Ambil agregat hafalan santri
    const { results: agg } =
        (await db
            .prepare(
                `SELECT surah_number as surahNumber,
                        SUM(CASE WHEN status = 'setor' THEN 1 ELSE 0 END) as setor,
                        SUM(CASE WHEN status = 'disetujui' THEN 1 ELSE 0 END) as disetujui
                   FROM hafalan_progress
                  WHERE user_id = ?
                  GROUP BY surah_number`
            )
            .bind(userId)
            .all<{ surahNumber: number; setor: number | null; disetujui: number | null }>()) ?? { results: [] };
    const aggMap = new Map<number, { setor: number; disetujui: number }>();
    for (const row of agg ?? []) {
        aggMap.set(row.surahNumber, {
            setor: row.setor ?? 0,
            disetujui: row.disetujui ?? 0
        });
    }

    // Ambil daftar surah dari DB bila ada, fallback ke SURAH_DATA bila kosong
    let surahRows: { surahNumber: number; name: string; totalAyah: number }[] = [];
    try {
        const info = await db.prepare(`PRAGMA table_info('surah')`).all<{ name: string }>();
        const cols = new Set((info?.results ?? []).map((c) => c.name));
        const numCol = cols.has('number') ? 'number' : cols.has('id') ? 'id' : undefined;
        const nameCol = cols.has('nama') ? 'nama' : cols.has('name') ? 'name' : undefined;
        const totalCol = cols.has('total_ayat') ? 'total_ayat' : cols.has('totalAyat') ? 'totalAyat' : undefined;

        if (numCol) {
            const sql = `SELECT ${numCol} as surahNumber, ${nameCol ? `${nameCol}` : "''"} as name, ${
                totalCol ? totalCol : 0
            } as totalAyah FROM surah ORDER BY ${numCol}`;
            const { results } =
                (await db.prepare(sql).all<{ surahNumber: number; name: string; totalAyah: number }>()) ?? {};
            if (results && results.length) {
                surahRows = results as { surahNumber: number; name: string; totalAyah: number }[];
            }
        }
    } catch (err) {
        console.warn('surah table read failed, fallback to SURAH_DATA', err);
    }

    if (!surahRows.length) {
        surahRows = SURAH_DATA.map((s) => ({
            surahNumber: s.number,
            name: s.name,
            totalAyah: s.totalAyah
        }));
    }

    return surahRows.map((surah) => {
        const aggCounts = aggMap.get(surah.surahNumber) ?? { setor: 0, disetujui: 0 };
        return {
            surahNumber: surah.surahNumber,
            name: surah.name,
            totalAyah: surah.totalAyah ?? 0,
            setor: aggCounts.setor,
            disetujui: aggCounts.disetujui
        };
    });
};

export const getSantriStats = async (db: D1Database, userId: string) => {
    const totals =
        (await db
            .prepare(
                `SELECT
                    SUM(CASE WHEN status = 'disetujui' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'setor' THEN 1 ELSE 0 END) as submitted
                FROM hafalan_progress
                WHERE user_id = ?`
            )
            .bind(userId)
            .first<{ approved: number | null; submitted: number | null }>()) ?? { approved: 0, submitted: 0 };

    const today =
        (await db
            .prepare(
                `SELECT COUNT(*) as total
                 FROM hafalan_progress
                 WHERE user_id = ?
                   AND status = 'disetujui'
                   AND DATE(tanggal_approve) = DATE('now','localtime')`
            )
            .bind(userId)
            .first<{ total: number | null }>()) ?? { total: 0 };

    return {
        approved: totals.approved ?? 0,
        submitted: totals.submitted ?? 0,
        todayApproved: today.total ?? 0
    };
};

export const getDailySeries = async (db: D1Database, userId: string, days = 7) => {
    const { results } = await db
        .prepare(
            `SELECT DATE(tanggal_approve) as tanggal,
                    COUNT(*) as approved
             FROM hafalan_progress
             WHERE user_id = ?
               AND status = 'disetujui'
               AND DATE(tanggal_approve) >= DATE('now','localtime', ?)
             GROUP BY DATE(tanggal_approve)`
        )
        .bind(userId, `-${days} days`)
        .all<{ tanggal: string; approved: number }>();

    const rows = (results ?? []) as { tanggal: string; approved: number }[];
    const lookup = new Map(rows.map((row) => [row.tanggal, row.approved]));
    const result: { label: string; approved: number }[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const label = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date);
        const key = date.toISOString().slice(0, 10);
        result.push({ label, approved: lookup.get(key) ?? 0 });
    }
    return result;
};

export const markHafalanStatus = async (
    db: D1Database,
    params: {
        userId: string;
        surahNumber: number;
        ayahNumber: number;
        status: HafalanStatus;
    }
) => {
    const now = new Date().toISOString();
    const setorTime = params.status === 'setor' ? now : null;
    const approveTime = params.status === 'disetujui' ? now : null;
    await db
        .prepare(
            `INSERT INTO hafalan_progress (user_id, surah_number, ayah_number, status, tanggal_setor, tanggal_approve)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(user_id, surah_number, ayah_number)
             DO UPDATE SET status = excluded.status,
                           tanggal_setor = CASE
                             WHEN excluded.status = 'setor' THEN excluded.tanggal_setor
                             WHEN excluded.status = 'belum' THEN NULL
                             ELSE hafalan_progress.tanggal_setor
                           END,
                           tanggal_approve = CASE
                             WHEN excluded.status = 'disetujui' THEN excluded.tanggal_approve
                             WHEN excluded.status = 'belum' THEN NULL
                             ELSE hafalan_progress.tanggal_approve
                           END`
        )
        .bind(params.userId, params.surahNumber, params.ayahNumber, params.status, setorTime, approveTime)
        .run();
};

export const getPendingSubmissions = async (
    db: D1Database,
    opts?: { orgId?: string | null; ustadzId?: string | null }
) => {
    const conditions = ["hp.status = 'setor'"];
    const params: (string | number)[] = [];
    const joins = ['JOIN users u ON u.id = hp.user_id'];

    if (opts?.orgId) {
        conditions.push('u.org_id = ?');
        params.push(opts.orgId);
    }
    if (opts?.ustadzId) {
        joins.push('JOIN santri_ustadz su ON su.santri_id = hp.user_id');
        conditions.push('su.ustadz_id = ?');
        params.push(opts.ustadzId);
    }

    const { results } = await db
        .prepare(
            `SELECT hp.id,
                    hp.user_id as userId,
                    hp.surah_number as surahNumber,
                    hp.ayah_number as ayahNumber,
                    hp.tanggal_setor as tanggalSetor,
                    u.email
             FROM hafalan_progress hp
             ${joins.join('\n             ')}
             WHERE ${conditions.join(' AND ')}
             ORDER BY hp.tanggal_setor ASC`
        )
        .bind(...params)
        .all<{
            id: number;
            userId: string;
            surahNumber: number;
            ayahNumber: number;
            tanggalSetor: string;
            email: string;
        }>();

    return (results ?? []) as {
        id: number;
        userId: string;
        surahNumber: number;
        ayahNumber: number;
        tanggalSetor: string;
        email: string;
    }[];
};

export const updateSubmissionStatus = async (
    db: D1Database,
    params: { id: number; status: HafalanStatus }
) => {
    const now = new Date().toISOString();
    await db
        .prepare(
            `UPDATE hafalan_progress
             SET status = ?,
                 tanggal_approve = CASE WHEN ? = 'disetujui' THEN ? ELSE tanggal_approve END
             WHERE id = ?`
        )
        .bind(params.status, params.status, now, params.id)
        .run();
};

export const listUsers = async (db: D1Database) => {
    const { results } = await db
        .prepare('SELECT id, email, role, created_at as createdAt FROM users ORDER BY created_at DESC')
        .all<{ id: string; email: string; role: string; createdAt: string }>();
    return (results ?? []) as { id: string; email: string; role: string; createdAt: string }[];
};

export const createUser = async (
    db: D1Database,
    params: { email: string; password: string; role: string }
) => {
    // PERBAIKAN: Menggunakan Scrypt
    const hashed = await new Scrypt().hash(params.password);
    await db
        .prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)')
        .bind(generateId(15), params.email, hashed, params.role)
        .run();
};

export const updateUserRole = async (db: D1Database, params: { id: string; role: string }) => {
    const { results } =
        (await db.prepare('SELECT gender FROM users WHERE id = ?').bind(params.id).all<{ gender?: string }>()) ?? {};
    const gender = results?.[0]?.gender;
    const normalizedRole =
        params.role === 'ustadz' || params.role === 'ustadzah'
            ? gender === 'wanita'
                ? 'ustadzah'
                : 'ustadz'
            : params.role;

    await db.prepare('UPDATE users SET role = ? WHERE id = ?').bind(normalizedRole, params.id).run();
};

export const resetUserPassword = async (db: D1Database, params: { id: string; password: string }) => {
    // PERBAIKAN: Menggunakan Scrypt
    const hashed = await new Scrypt().hash(params.password);
    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(hashed, params.id).run();
};

export const submitSurahForUser = async (
    db: D1Database,
    params: {
        userId: string;
        surahNumber: number;
        status?: HafalanStatus;
        qualityStatus?: QualityStatus;
        startAyah?: number;
        endAyah?: number;
    }
) => {
    const status: HafalanStatus = params.status ?? 'setor';

    const queries = [
        'SELECT total_ayat as totalAyah FROM surah WHERE number = ?',
        'SELECT totalAyat as totalAyah FROM surah WHERE number = ?',
        'SELECT COALESCE(total_ayah, totalAyat, total_ayat) as totalAyah FROM surah WHERE number = ?'
    ];
    let totalAyah = 0;
    for (const q of queries) {
        try {
            const row = await db.prepare(q).bind(params.surahNumber).first<{ totalAyah: number | null }>();
            if (row && row.totalAyah != null) {
                totalAyah = Number(row.totalAyah);
                break;
            }
        } catch {
            // coba query selanjutnya
        }
    }

    // fallback ke constant jika DB tidak punya data surah
    if (!totalAyah) {
        const surah = SURAH_DATA.find((s) => s.number === params.surahNumber);
        totalAyah = surah?.totalAyah ?? 0;
    }

    if (!totalAyah || totalAyah < 1) {
        throw new Error('Surah tidak ditemukan atau total ayat tidak valid');
    }

    const startAyah = Math.max(1, params.startAyah ?? 1);
    const endAyah = Math.min(totalAyah, params.endAyah ?? totalAyah);
    if (startAyah > endAyah) {
        throw new Error('Rentang ayat tidak valid');
    }

    const nowIso = new Date().toISOString();
    for (let ayah = startAyah; ayah <= endAyah; ayah++) {
        // hapus baris lama
        await db
            .prepare('DELETE FROM hafalan_progress WHERE user_id = ? AND surah_number = ? AND ayah_number = ?')
            .bind(params.userId, params.surahNumber, ayah)
            .run();

        await db
            .prepare(
                `INSERT INTO hafalan_progress (user_id, surah_number, ayah_number, status, tanggal_setor, tanggal_approve, quality_status)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
                params.userId,
                params.surahNumber,
                ayah,
                status,
                nowIso,
                status === 'disetujui' ? nowIso : null,
                params.qualityStatus ?? null
            )
            .run();
    }
};

export const getAllStudentsProgress = async (
    db: D1Database,
    opts?: { orgId?: string | null; ustadzId?: string | null }
) => {
    try {
        const conditions = ["u.role = 'santri'"];
        const params: (string | number)[] = [];
        const joins = ['LEFT JOIN hafalan_progress hp ON hp.user_id = u.id'];
        if (opts?.orgId) {
            conditions.push('u.org_id = ?');
            params.push(opts.orgId);
        }
        if (opts?.ustadzId) {
            joins.push('JOIN santri_ustadz su ON su.santri_id = u.id');
            conditions.push('su.ustadz_id = ?');
            params.push(opts.ustadzId);
        }

        const { results } = await db
            .prepare(
                `SELECT u.id, u.email, u.username,
                    COUNT(CASE WHEN hp.status = 'disetujui' THEN 1 END) as approvedAyah
             FROM users u
             ${joins.join('\n             ')}
             WHERE ${conditions.join(' AND ')}
             GROUP BY u.id, u.email, u.username`
            )
            .bind(...params)
            .all<{ id: string; email: string; username: string | null; approvedAyah: number }>();

        // Total ayat Al-Quran = 6236
        const TOTAL_AYAH = 6236;

        return (results ?? []).map((row) => {
            const approvedCount = Number(row.approvedAyah) || 0;
            return {
                id: row.id,
                email: row.email,
                username: row.username ?? null,
                approvedAyah: approvedCount,
                percentage: (approvedCount / TOTAL_AYAH) * 100
            };
        });
    } catch (error) {
        console.error('Error in getAllStudentsProgress:', error);
        return [];
    }
};

export const getFlaggedHafalan = async (
    db: D1Database,
    opts: { currentUserId: string; role: 'admin' | 'ustadz' | 'santri'; userId?: string; orgId?: string | null }
) => {
    const conditions = ['1=1'];
    const params: (string | number | null)[] = [];

    const targetUser = opts.role !== 'santri' && opts.userId ? opts.userId : opts.currentUserId;
    if (targetUser) {
        conditions.push('hp.user_id = ?');
        params.push(targetUser);
    }
    conditions.push("(hp.quality_status IN ('merah','kuning') OR hp.status = 'setor')");
    if (opts.orgId) {
        conditions.push('u.org_id = ?');
        params.push(opts.orgId);
    }

    const { results } = await db
        .prepare(
            `SELECT hp.id,
                    hp.user_id as userId,
                    u.username,
                    u.email,
                    hp.surah_number as surahNumber,
                    hp.ayah_number as ayahNumber,
                    hp.status,
                    hp.quality_status as qualityStatus,
                    hp.tanggal_setor as tanggalSetor,
                    hp.tanggal_approve as tanggalApprove
               FROM hafalan_progress hp
               JOIN users u ON u.id = hp.user_id
              WHERE ${conditions.join(' AND ')}
              ORDER BY hp.tanggal_setor DESC, hp.id DESC
              LIMIT 200`
        )
        .bind(...params)
        .all<{
            id: number;
            userId: string;
            username: string | null;
            email: string;
            surahNumber: number;
            ayahNumber: number;
            status: HafalanStatus;
            qualityStatus: QualityStatus | null;
            tanggalSetor: string | null;
            tanggalApprove: string | null;
        }>();

    return (results ?? []).map((row) => ({
        ...row,
        qualityStatus: row.qualityStatus ?? null
    }));
};
