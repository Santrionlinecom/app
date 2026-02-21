import { error, redirect } from '@sveltejs/kit';
import { isCommunityOrgType, isEducationalOrgType, normalizeOrgType } from '$lib/server/utils';

export type SystemRole = 'SUPER_ADMIN' | 'super_admin';
export type OrgType = 'pondok' | 'masjid' | 'musholla' | 'tpq' | 'rumah-tahfidz';
export type OrgRole =
	| 'admin'
	| 'koordinator'
	| 'ustadz'
	| 'ustadzah'
	| 'santri'
	| 'alumni'
	| 'jamaah'
	| 'tamir'
	| 'bendahara';
export type UserRole = OrgRole | SystemRole;

export const ROLE_LABELS: Record<UserRole, string> = {
	SUPER_ADMIN: 'Super Admin',
	super_admin: 'Super Admin',
	admin: 'Admin',
	koordinator: 'Koordinator',
	ustadz: 'Ustadz',
	ustadzah: 'Ustadzah',
	santri: 'Santri',
	alumni: 'Alumni',
	jamaah: 'Jamaah',
	tamir: 'Takmir',
	bendahara: 'Bendahara'
};

export const allowedRolesByType: Record<OrgType, OrgRole[]> = {
	pondok: ['admin', 'ustadz', 'ustadzah', 'santri', 'alumni'],
	masjid: ['admin', 'jamaah', 'tamir', 'bendahara', 'ustadz', 'ustadzah'],
	musholla: ['admin', 'jamaah', 'tamir', 'bendahara', 'ustadz', 'ustadzah'],
	tpq: ['admin', 'ustadz', 'ustadzah', 'santri', 'alumni'],
	'rumah-tahfidz': ['admin', 'ustadz', 'ustadzah', 'santri', 'alumni']
};

export type FeatureKey =
	| 'hafalan'
	| 'setoran'
	| 'ujian'
	| 'raport'
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

export const isSystemAdmin = (role?: string | null): role is SystemRole =>
	role === 'SUPER_ADMIN' || role === 'super_admin';

export const normalizeRole = (role?: string | null): UserRole | null => {
	if (!role) return null;
	if (role === 'SUPER_ADMIN') return 'SUPER_ADMIN';
	if (role === 'super_admin') return 'super_admin';
	const normalized = role.toLowerCase().trim();
	if (normalized === 'super_admin' || normalized === 'super-admin') return 'super_admin';
	if (normalized === 'admin_lembaga') return 'admin';
	const allowed: OrgRole[] = [
		'admin',
		'koordinator',
		'ustadz',
		'ustadzah',
		'santri',
		'alumni',
		'jamaah',
		'tamir',
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
	if (!normalized || normalized === 'SUPER_ADMIN' || normalized === 'super_admin') {
		throw error(403, 'Role tidak valid untuk lembaga ini.');
	}
	if (!normalizedOrgType || !(normalizedOrgType in allowedRolesByType)) {
		throw error(403, 'Role tidak diizinkan untuk lembaga ini.');
	}
	if (normalizedOrgType === 'tpq' && normalized === 'koordinator') {
		return;
	}
	if (!allowedRolesByType[normalizedOrgType as OrgType]?.includes(normalized)) {
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
	if (isEducationalOrgType(orgType)) {
		return ACADEMIC_FEATURES.has(feature);
	}
	if (isCommunityOrgType(orgType)) {
		return COMMUNITY_FEATURES.has(feature);
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
