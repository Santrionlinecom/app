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

export const assertTpqAcademicTables = async (db: D1Database) => {
	try {
		await db.prepare('SELECT id FROM tpq_halaqoh LIMIT 1').first();
		await db.prepare('SELECT id FROM tpq_setoran LIMIT 1').first();
	} catch (err) {
		if (isMissingTableError(err)) {
			throw error(
				500,
				'Tabel TPQ akademik belum tersedia. Jalankan migration 0016_tpq_academic_workflow.sql terlebih dahulu.'
			);
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
