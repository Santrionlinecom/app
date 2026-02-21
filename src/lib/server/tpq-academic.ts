import { error } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import { assertFeature, assertLoggedIn, assertOrgMember } from '$lib/server/auth/rbac';
import { getOrganizationById } from '$lib/server/organizations';
import { submitSurahForUser } from '$lib/server/progress';

export const TPQ_SETORAN_TYPES = ['hafalan', 'murojaah'] as const;
export const TPQ_SETORAN_QUALITIES = ['lancar', 'cukup', 'belum'] as const;
export const TPQ_SETORAN_STATUSES = ['submitted', 'approved', 'rejected'] as const;

const INPUT_ROLES = new Set(['admin', 'ustadz', 'ustadzah']);
const REVIEW_ROLES = new Set(['admin', 'koordinator']);
const HISTORY_ROLES = new Set(['admin', 'koordinator', 'ustadz', 'ustadzah', 'santri', 'alumni']);

const QUALITY_TO_HAFALAN = {
	lancar: 'hijau',
	cukup: 'kuning',
	belum: 'merah'
} as const;

export const MAX_SETORAN_NOTES_LENGTH = 1000;
export const MAX_HALAQOH_NAME_LENGTH = 80;
export const MAX_FILTER_RANGE_DAYS = 366;

export type TpqSetoranType = (typeof TPQ_SETORAN_TYPES)[number];
export type TpqSetoranQuality = (typeof TPQ_SETORAN_QUALITIES)[number];
export type TpqSetoranStatus = (typeof TPQ_SETORAN_STATUSES)[number];

export const normalizeAppRole = (role?: string | null) => (role ?? '').trim().toLowerCase();

export const canInputSetoran = (role?: string | null) => INPUT_ROLES.has(normalizeAppRole(role));
export const canReviewSetoran = (role?: string | null) => REVIEW_ROLES.has(normalizeAppRole(role));
export const canViewSetoranHistory = (role?: string | null) => HISTORY_ROLES.has(normalizeAppRole(role));

export const isValidIsoDate = (value: string) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;

export const isSafeScopedId = (value: string) => SAFE_ID_REGEX.test(value.trim());

export const assertSafeScopedId = (value: string, label: string) => {
	if (!isSafeScopedId(value)) {
		throw error(400, `${label} tidak valid.`);
	}
	return value.trim();
};

export const sanitizePlainText = (value: string, maxLength: number) =>
	value
		.replace(/[\u0000-\u001F\u007F]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, maxLength);

export const sanitizeOptionalNotes = (value: string, maxLength = MAX_SETORAN_NOTES_LENGTH) => {
	const cleaned = value
		.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
		.replace(/\r\n/g, '\n')
		.trim()
		.slice(0, maxLength);
	return cleaned || null;
};

export const validateDateRangeDays = (from: string, to: string, maxDays = MAX_FILTER_RANGE_DAYS) => {
	if (!from || !to || !isValidIsoDate(from) || !isValidIsoDate(to)) return;
	const fromTs = Date.parse(`${from}T00:00:00Z`);
	const toTs = Date.parse(`${to}T00:00:00Z`);
	if (Number.isNaN(fromTs) || Number.isNaN(toTs)) return;
	const days = Math.floor((toTs - fromTs) / 86400000);
	if (days > maxDays) {
		throw error(400, `Rentang tanggal terlalu panjang. Maksimal ${maxDays} hari.`);
	}
};

export const todayIsoDate = () => new Date().toISOString().slice(0, 10);

export const requireTpqAcademicContext = async (locals: App.Locals) => {
	const user = assertLoggedIn({ locals });
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	const institutionId = assertOrgMember(user);
	const org = await getOrganizationById(locals.db, institutionId);
	if (!org) {
		throw error(404, 'Lembaga tidak ditemukan');
	}
	if (org.type !== 'tpq') {
		throw error(403, 'Workflow akademik ini hanya untuk TPQ.');
	}
	if (org.status !== 'active') {
		throw error(403, 'Lembaga TPQ belum aktif.');
	}
	if ((user.orgStatus ?? 'active') !== 'active') {
		throw error(403, 'Akun lembaga belum aktif.');
	}

	assertFeature(org.type, user.role, 'setoran');

	return {
		db: locals.db,
		user,
		org,
		institutionId,
		role: normalizeAppRole(user.role)
	};
};

const isMissingTableError = (err: unknown) =>
	`${(err as Error)?.message ?? err}`.toLowerCase().includes('no such table');

const ensureTpqAcademicSchema = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS tpq_halaqoh (
				id TEXT PRIMARY KEY,
				institution_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
				name TEXT NOT NULL,
				ustadz_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				schedule_json TEXT NOT NULL DEFAULT '{}',
				created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
			)`
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_tpq_halaqoh_institution_created ON tpq_halaqoh(institution_id, created_at DESC)'
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_tpq_halaqoh_institution_ustadz ON tpq_halaqoh(institution_id, ustadz_user_id)'
		)
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS tpq_setoran (
				id TEXT PRIMARY KEY,
				institution_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
				santri_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				ustadz_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				halaqoh_id TEXT REFERENCES tpq_halaqoh(id) ON DELETE SET NULL,
				date TEXT NOT NULL,
				type TEXT NOT NULL CHECK (type IN ('hafalan', 'murojaah')),
				surah TEXT NOT NULL,
				ayat_from INTEGER NOT NULL CHECK (ayat_from > 0),
				ayat_to INTEGER NOT NULL CHECK (ayat_to > 0),
				quality TEXT NOT NULL CHECK (quality IN ('lancar', 'cukup', 'belum')),
				notes TEXT,
				status TEXT NOT NULL CHECK (status IN ('submitted', 'approved', 'rejected')),
				reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
				reviewed_at INTEGER,
				created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
				CHECK (ayat_from <= ayat_to)
			)`
		)
		.run();
	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_tpq_setoran_institution_date ON tpq_setoran(institution_id, date)')
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_tpq_setoran_institution_santri_date ON tpq_setoran(institution_id, santri_user_id, date)'
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_tpq_setoran_institution_ustadz_date ON tpq_setoran(institution_id, ustadz_user_id, date)'
		)
		.run();
};

export const assertTpqAcademicTables = async (db: D1Database) => {
	try {
		await db.prepare('SELECT id FROM tpq_halaqoh LIMIT 1').first();
		await db.prepare('SELECT id FROM tpq_setoran LIMIT 1').first();
	} catch (err) {
		if (isMissingTableError(err)) {
			await ensureTpqAcademicSchema(db);
			return;
		}
		throw err;
	}
};

export const syncApprovedHafalanFromSetoran = async (
	db: D1Database,
	setoran: {
		id: string;
		santriUserId: string;
		type: string;
		surah: string;
		ayatFrom: number;
		ayatTo: number;
		quality: string;
	}
) => {
	if (setoran.type !== 'hafalan') return;

	const surahNumber = Number.parseInt((setoran.surah ?? '').trim(), 10);
	if (!Number.isFinite(surahNumber) || surahNumber < 1 || surahNumber > 114) {
		throw new Error(`Surah tidak valid untuk sinkronisasi hafalan (setoran ${setoran.id})`);
	}
	if (!Number.isInteger(setoran.ayatFrom) || !Number.isInteger(setoran.ayatTo) || setoran.ayatFrom < 1) {
		throw new Error(`Rentang ayat tidak valid (setoran ${setoran.id})`);
	}
	if (setoran.ayatFrom > setoran.ayatTo) {
		throw new Error(`ayat_from > ayat_to (setoran ${setoran.id})`);
	}

	const quality = (setoran.quality ?? '').trim().toLowerCase() as TpqSetoranQuality;
	const qualityStatus = QUALITY_TO_HAFALAN[quality];
	if (!qualityStatus) {
		throw new Error(`Kualitas tidak valid untuk sinkronisasi hafalan (setoran ${setoran.id})`);
	}

	await submitSurahForUser(db, {
		userId: setoran.santriUserId,
		surahNumber,
		status: 'disetujui',
		qualityStatus,
		startAyah: setoran.ayatFrom,
		endAyah: setoran.ayatTo
	});
};
