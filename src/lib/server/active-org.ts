import { error } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import type { OrgRole, OrgType } from '$lib/types/rbac';

/**
 * Lembaga aktif untuk satu permintaan.
 *
 * Sebelumnya lembaga seseorang disimpan di kolom tunggal `users.org_id`,
 * sehingga satu akun hanya bisa memegang satu lembaga. Padahal satu takmir
 * kampung lazim mengurus TPQ, musholla, dan masjid sekaligus.
 *
 * Sumber kebenaran sekarang adalah tabel `organization_memberships`, dan
 * `users.org_id` hanya dipakai sebagai pilihan bawaan untuk akun lama.
 */

export type MembershipLike = {
	org_id: string;
	org_type: OrgType;
	role: OrgRole;
	is_active: boolean;
	org_name?: string;
};

export type ResolveActiveOrgInput = {
	memberships: MembershipLike[];
	/** Lembaga yang sedang dipilih pengguna (dari cookie/sesi). */
	requestedOrgId?: string | null;
	/** `users.org_id` lama, dipakai bila pengguna belum memilih. */
	fallbackOrgId?: string | null;
};

const normalize = (value?: string | null) => value?.trim() || null;

/**
 * Menentukan lembaga aktif dari daftar keanggotaan.
 *
 * Aturan keamanan: permintaan ke lembaga yang tidak dimiliki pengguna
 * mengembalikan `null` — TIDAK dialihkan diam-diam ke lembaga lain, agar
 * kesalahan pemilihan tidak berubah menjadi kebocoran data antar lembaga.
 */
export const resolveActiveOrg = (input: ResolveActiveOrgInput): MembershipLike | null => {
	const active = input.memberships.filter((m) => m.is_active);
	if (active.length === 0) return null;

	const requested = normalize(input.requestedOrgId);
	if (requested) {
		// Permintaan eksplisit wajib cocok dengan keanggotaan yang sah.
		return active.find((m) => m.org_id === requested) ?? null;
	}

	const fallback = normalize(input.fallbackOrgId);
	if (fallback) {
		const match = active.find((m) => m.org_id === fallback);
		if (match) return match;
		// org_id lama sudah tidak sah (keanggotaan dicabut): abaikan.
	}

	return active[0];
};

/** Sama seperti resolveActiveOrg, tetapi melempar 403 bila tidak ada. */
export const assertActiveOrg = (input: ResolveActiveOrgInput): MembershipLike => {
	const active = resolveActiveOrg(input);
	if (!active) {
		throw error(403, 'Akun belum terhubung ke lembaga.');
	}
	return active;
};

/** Nama cookie penyimpan pilihan lembaga aktif. */
export const ACTIVE_ORG_COOKIE = 'so_lembaga_aktif';

type MembershipRow = {
	org_id: string;
	org_type: OrgType;
	role: OrgRole;
	is_active: number;
	org_name: string;
};

/** Membaca seluruh keanggotaan aktif milik satu pengguna. */
export const loadMemberships = async (
	db: D1Database,
	userId: string
): Promise<MembershipLike[]> => {
	const { results } = await db
		.prepare(
			`SELECT m.org_id, m.org_type, m.role, m.is_active, o.name AS org_name
			 FROM organization_memberships m
			 JOIN organizations o ON o.id = m.org_id
			 WHERE m.user_id = ?
			   AND m.is_active = 1
			   AND COALESCE(o.is_aktif, 1) = 1
			 ORDER BY m.joined_at ASC`
		)
		.bind(userId)
		.all<MembershipRow>();

	return (results ?? []).map((row: MembershipRow) => ({
		org_id: row.org_id,
		org_type: row.org_type,
		role: row.role,
		is_active: row.is_active === 1,
		org_name: row.org_name
	}));
};

/**
 * Mencatat seseorang sebagai anggota (umumnya admin) sebuah lembaga.
 *
 * Aman dipanggil berulang. Constraint tabel adalah UNIQUE(user_id, org_id, role),
 * jadi pengulangan dengan peran sama akan mengaktifkan kembali baris yang ada;
 * peran berbeda di lembaga yang sama dinonaktifkan lebih dulu agar satu orang
 * tidak memegang dua peran aktif sekaligus di satu lembaga.
 */
export const grantMembership = async (
	db: D1Database,
	params: {
		id: string;
		userId: string;
		orgId: string;
		orgType: OrgType;
		role: OrgRole;
		invitedBy?: string | null;
	}
) => {
	const now = Date.now();

	await db
		.prepare(
			`UPDATE organization_memberships
			 SET is_active = 0
			 WHERE user_id = ? AND org_id = ? AND role <> ?`
		)
		.bind(params.userId, params.orgId, params.role)
		.run();

	await db
		.prepare(
			`INSERT INTO organization_memberships
				(id, user_id, org_id, org_type, role, is_active, invited_by, joined_at, created_at)
			 VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
			 ON CONFLICT(user_id, org_id, role) DO UPDATE SET
				org_type = excluded.org_type,
				is_active = 1`
		)
		.bind(
			params.id,
			params.userId,
			params.orgId,
			params.orgType,
			params.role,
			params.invitedBy ?? null,
			now,
			now
		)
		.run();
};
