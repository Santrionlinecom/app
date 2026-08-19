import { error, redirect } from '@sveltejs/kit';
import { isCommunityOrgType, isEducationalOrgType, isFinanceOrgType, normalizeOrgType } from '$lib/server/utils';
import {
	ALLOWED_ROLES_BY_TYPE,
	hasPermission,
	isRoleAllowedInOrg
} from '$lib/rbac/permissions';
import type { Permission } from '$lib/types/rbac';

export type SystemRole = 'SUPER_ADMIN';
export type OrgType = 'pondok' | 'masjid' | 'musholla' | 'tpq' | 'rumah-tahfidz';
export type OrgRole =
	| 'admin'
	| 'kepala_tpq'
	| 'kepala_tahfidz'
	| 'koordinator'
	| 'wali_kelas'
	| 'pengasuh'
	| 'musyrif'
	| 'ustadz'
	| 'ustadzah'
	| 'santri'
	| 'wali'
	| 'alumni'
	| 'jamaah'
	| 'ketua_takmir'
	| 'takmir'
	| 'tamir'
	| 'imam'
	| 'khotib'
	| 'muadzin'
	| 'operator'
	| 'bendahara';
export type UserRole = OrgRole | SystemRole;

export const ROLE_LABELS: Record<UserRole, string> = {
	SUPER_ADMIN: 'Super Admin',
	admin: 'Admin',
	kepala_tpq: 'Kepala TPQ',
	kepala_tahfidz: 'Kepala Tahfidz',
	koordinator: 'Koordinator',
	wali_kelas: 'Wali Kelas',
	pengasuh: 'Pengasuh',
	musyrif: 'Musyrif',
	ustadz: 'Ustadz',
	ustadzah: 'Ustadzah',
	santri: 'Santri',
	wali: 'Wali Santri',
	alumni: 'Alumni',
	jamaah: 'Jamaah',
	ketua_takmir: 'Ketua Takmir',
	takmir: 'Takmir',
	tamir: 'Takmir',
	imam: 'Imam',
	khotib: 'Khotib',
	muadzin: 'Muadzin',
	operator: 'Operator',
	bendahara: 'Bendahara'
};

export const allowedRolesByType: Record<OrgType, OrgRole[]> = {
	pondok: ALLOWED_ROLES_BY_TYPE.pondok as OrgRole[],
	masjid: [...ALLOWED_ROLES_BY_TYPE.masjid, 'tamir'] as OrgRole[],
	musholla: [...ALLOWED_ROLES_BY_TYPE.musholla, 'tamir'] as OrgRole[],
	tpq: ALLOWED_ROLES_BY_TYPE.tpq as OrgRole[],
	'rumah-tahfidz': ALLOWED_ROLES_BY_TYPE['rumah-tahfidz'] as OrgRole[]
};

export type FeatureKey =
	| 'hafalan'
	| 'setoran'
	| 'ujian'
	| 'raport'
	| 'belajar'
	| 'kas_masjid'
	| 'zakat_infaq'
	| 'jadwal_kegiatan'
	| 'kalender';

const ACADEMIC_FEATURES = new Set<FeatureKey>(['hafalan', 'setoran', 'ujian', 'raport']);
const COMMUNITY_FEATURES = new Set<FeatureKey>([
	'kas_masjid',
	'zakat_infaq',
	'jadwal_kegiatan',
	'kalender'
]);
const FINANCE_FEATURES = new Set<FeatureKey>(['kas_masjid']);

/**
 * Kurikulum pembinaan di Ruang Belajar (aqidah, adab, fikih praktis, sirah,
 * skill, Bahasa Arab) berlaku untuk seluruh member, bukan hanya lembaga
 * pendidikan. Jamaah masjid dan musholla juga perlu jalur aqidah dan adab.
 *
 * Sengaja dipisah dari 'hafalan': setoran hafalan tetap khusus lembaga
 * pendidikan, sedangkan belajar terbuka untuk semua tipe lembaga.
 */
const UNIVERSAL_FEATURES = new Set<FeatureKey>(['belajar']);

const FEATURE_PERMISSIONS: Record<FeatureKey, Permission> = {
	hafalan: 'hafalan.read',
	setoran: 'hafalan.input',
	ujian: 'ujian.read',
	raport: 'raport.read',
	// Membaca kurikulum pembinaan tidak menuntut hak pengurus. Dipakai
	// 'announcement.read' karena itu izin baca paling dasar yang dimiliki
	// seluruh peran anggota, termasuk santri, jamaah, wali, dan alumni.
	belajar: 'announcement.read',
	kas_masjid: 'finance.read',
	zakat_infaq: 'zakat.manage',
	jadwal_kegiatan: 'schedule.read',
	kalender: 'schedule.read'
};

const normalizeSystemRole = (role?: string | null) =>
	role?.trim().replace(/[-\s]+/g, '_').toUpperCase();

export const isSystemAdmin = (role?: string | null): role is SystemRole =>
	['SUPER_ADMIN', 'SUPERADMIN'].includes(normalizeSystemRole(role) ?? '');

export const normalizeRole = (role?: string | null): UserRole | null => {
	if (!role) return null;
	if (isSystemAdmin(role)) return 'SUPER_ADMIN';
	const normalized = role.toLowerCase().trim();
	if (normalized === 'admin_lembaga') return 'admin';
	if (normalized === 'ta_mir') return 'takmir';
	const allowed: OrgRole[] = [
		'admin',
		'kepala_tpq',
		'kepala_tahfidz',
		'koordinator',
		'wali_kelas',
		'pengasuh',
		'musyrif',
		'ustadz',
		'ustadzah',
		'santri',
		'wali',
		'alumni',
		'jamaah',
		'ketua_takmir',
		'takmir',
		'tamir',
		'imam',
		'khotib',
		'muadzin',
		'operator',
		'bendahara'
	];
	return allowed.includes(normalized as OrgRole) ? (normalized as OrgRole) : null;
};

export const assertLoggedIn = (event: { locals: App.Locals }) => {
	if (!event.locals.user) {
		throw redirect(302, '/auth');
	}
	return event.locals.user;
};

export const assertOrgMember = (user: { orgId?: string | null }) => {
	const orgId = user.orgId ?? null;
	if (!orgId) {
		throw error(403, 'Akun belum terhubung ke lembaga.');
	}
	return orgId;
};

export const assertOrgRoleAllowed = (orgType: OrgType, role?: string | null) => {
	if (isSystemAdmin(role)) return;
	const normalized = normalizeRole(role);
	const normalizedOrgType = normalizeOrgType(orgType);
	if (!normalized || normalized === 'SUPER_ADMIN') {
		throw error(403, 'Role tidak valid untuk lembaga ini.');
	}
	if (!normalizedOrgType || !(normalizedOrgType in allowedRolesByType)) {
		throw error(403, 'Role tidak diizinkan untuk lembaga ini.');
	}
	if (normalized === 'tamir' && (normalizedOrgType === 'masjid' || normalizedOrgType === 'musholla')) {
		return;
	}
	if (!isRoleAllowedInOrg(normalized as any, normalizedOrgType as any) && !allowedRolesByType[normalizedOrgType as OrgType]?.includes(normalized)) {
		throw error(403, 'Role tidak diizinkan untuk lembaga ini.');
	}
};

export const canAccessFeature = (
	orgType: OrgType | null | undefined,
	role: string | null | undefined,
	feature: FeatureKey
) => {
	if (isSystemAdmin(role)) return true;
	if (!orgType) return false;
	const normalized = normalizeRole(role);
	if (!normalized || normalized === 'SUPER_ADMIN') return false;
	const permission = FEATURE_PERMISSIONS[feature];
	// Fitur universal berlaku di semua tipe lembaga, jadi diperiksa lebih dulu
	// sebelum penyaringan per kategori lembaga.
	if (UNIVERSAL_FEATURES.has(feature)) {
		return hasPermission(normalized as any, permission);
	}
	if (isEducationalOrgType(orgType) && ACADEMIC_FEATURES.has(feature)) {
		return hasPermission(normalized as any, permission);
	}
	if (isCommunityOrgType(orgType) && COMMUNITY_FEATURES.has(feature)) {
		return hasPermission(normalized as any, permission);
	}
	if (isFinanceOrgType(orgType) && FINANCE_FEATURES.has(feature)) {
		return hasPermission(normalized as any, permission);
	}
	return false;
};

export const assertFeature = (
	orgType: OrgType | null | undefined,
	role: string | null | undefined,
	feature: FeatureKey
) => {
	if (!canAccessFeature(orgType, role, feature)) {
		throw error(403, 'Fitur tidak tersedia untuk lembaga ini.');
	}
};

export const canAccessPermission = (role: string | null | undefined, permission: Permission) => {
	if (isSystemAdmin(role)) return true;
	const normalized = normalizeRole(role);
	return Boolean(normalized && normalized !== 'SUPER_ADMIN' && hasPermission(normalized as any, permission));
};
