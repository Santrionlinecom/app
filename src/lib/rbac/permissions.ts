import type { OrgRole, OrgType, Permission, PermissionPattern, RoleLevel } from '$lib/types/rbac';
import { ROLE_TO_LEVEL, ROLE_LEVELS } from '$lib/types/rbac';

// Base permissions for each role with simplified structure
const BASE_PERMISSIONS: Record<OrgRole, Permission[]> = {
	// ADMIN LEVEL (role_level = 3)
	admin: [
		'org.manage',
		'org.settings.read',
		'org.settings.write',
		'member.invite',
		'member.approve',
		'member.read.all',
		'member.write',
		'member.delete',
		'student.read.all',
		'student.write',
		'student.approve',
		'hafalan.input',
		'hafalan.review',
		'hafalan.read.all',
		'ujian.write',
		'ujian.read.all',
		'raport.write',
		'raport.read.all',
		'finance.read',
		'finance.write',
		'finance.approve',
		'zakat.manage',
		'schedule.read',
		'schedule.write',
		'imam.schedule',
		'social.post',
		'social.comment',
		'social.react',
		'social.moderate',
		'social.delete.any',
		'report.read',
		'report.write',
		'report.review',
		'announcement.read',
		'announcement.write'
	],

	kepala: [
		'org.settings.read',
		'org.settings.write',
		'member.invite',
		'member.approve',
		'member.read.all',
		'member.write',
		'student.read.all',
		'student.write',
		'student.approve',
		'hafalan.input',
		'hafalan.review',
		'hafalan.read.all',
		'ujian.write',
		'ujian.read.all',
		'raport.write',
		'raport.read.all',
		'finance.read',
		'schedule.read',
		'schedule.write',
		'imam.schedule',
		'social.post',
		'social.comment',
		'social.react',
		'social.moderate',
		'social.delete.any',
		'report.read',
		'report.write',
		'announcement.read',
		'announcement.write'
	],

	bendahara: [
		'finance.read',
		'finance.write',
		'finance.approve',
		'finance.approve.monthly',
		'zakat.manage',
		'member.read',
		'report.read',
		'report.write',
		'social.post',
		'social.comment',
		'social.react',
		'social.delete.own',
		'announcement.read'
	],

	// MANAGER LEVEL (role_level = 2)
	pembimbing: [
		'member.read.all',
		'student.read.all',
		'student.write',
		'hafalan.input',
		'hafalan.review',
		'hafalan.read.all',
		'ujian.read.all',
		'raport.read.all',
		'raport.write',
		'schedule.read',
		'schedule.write',
		'social.post',
		'social.comment',
		'social.react',
		'social.delete.own',
		'announcement.read',
		'announcement.write',
		'report.read'
	],

	operator: [
		'org.settings.read',
		'member.read.all',
		'member.invite',
		'student.read.all',
		'schedule.read',
		'social.post',
		'social.comment',
		'social.react',
		'social.delete.own',
		'announcement.read',
		'announcement.write',
		'report.read'
	],

	sekretaris: [
		'member.read.all',
		'schedule.read',
		'schedule.write',
		'announcement.read',
		'announcement.write',
		'report.read',
		'report.write',
		'social.post',
		'social.comment',
		'social.react',
		'social.delete.own'
	],

	humas: [
		'member.read',
		'social.post',
		'social.comment',
		'social.react',
		'social.moderate',
		'social.delete.any',
		'announcement.read',
		'announcement.write',
		'report.read',
		'schedule.read'
	],

	kurikulum: [
		'student.read.all',
		'ujian.write',
		'ujian.read.all',
		'raport.write',
		'raport.read.all',
		'hafalan.read.all',
		'schedule.read',
		'announcement.read',
		'report.read',
		'report.write',
		'social.post',
		'social.comment',
		'social.react',
		'social.delete.own'
	],

	pembina: [
		'student.read.all',
		'student.write',
		'member.read.all',
		'report.read',
		'report.write',
		'schedule.read',
		'announcement.read',
		'social.post',
		'social.comment',
		'social.react',
		'social.delete.own'
	],

	// STAFF LEVEL (role_level = 1)
	pengajar: [
		'member.read',
		'student.read.class',
		'hafalan.input',
		'hafalan.review',
		'hafalan.read.class',
		'ujian.write',
		'ujian.read.class',
		'raport.read.class',
		'schedule.read',
		'social.post',
		'social.comment',
		'social.react',
		'social.delete.own',
		'announcement.read',
		'announcement.write',
		'report.read'
	],

	takmir: [
		'member.read',
		'schedule.read',
		'schedule.write',
		'social.post',
		'social.comment',
		'social.react',
		'social.delete.own',
		'announcement.read',
		'announcement.write',
		'report.read'
	],

	imam: [
		'imam.schedule',
		'schedule.read',
		'social.post',
		'social.comment',
		'social.react',
		'social.delete.own',
		'announcement.read'
	],

	khotib: [
		'schedule.read',
		'social.post',
		'social.comment',
		'social.react',
		'social.delete.own',
		'announcement.read'
	],

	muadzin: [
		'schedule.read',
		'social.post',
		'social.comment',
		'social.react',
		'social.delete.own',
		'announcement.read'
	],

	// MEMBER LEVEL (role_level = 0)
	santri: [
		'hafalan.read.own',
		'ujian.read.own',
		'raport.read.own',
		'schedule.read',
		'social.post',
		'social.comment',
		'social.react',
		'social.delete.own',
		'announcement.read'
	],

	wali: [
		'student.read.own',
		'hafalan.read.own',
		'ujian.read.own',
		'raport.read.own',
		'schedule.read',
		'finance.read',
		'social.post',
		'social.comment',
		'social.react',
		'social.delete.own',
		'announcement.read'
	],

	alumni: [
		'social.post',
		'social.comment',
		'social.react',
		'social.delete.own',
		'announcement.read',
		'schedule.read'
	],

	jamaah: [
		'schedule.read',
		'social.post',
		'social.comment',
		'social.react',
		'social.delete.own',
		'announcement.read'
	]
};

// Allowed roles by organization type
export const ALLOWED_ROLES_BY_TYPE: Record<OrgType, OrgRole[]> = {
	tpq: [
		'admin',
		'kepala',
		'pembimbing',
		'pengajar',
		'operator',
		'bendahara',
		'sekretaris',
		'humas',
		'kurikulum',
		'pembina',
		'santri',
		'wali'
	],
	pondok: [
		'admin',
		'kepala',
		'pembimbing',
		'pengajar',
		'operator',
		'bendahara',
		'sekretaris',
		'humas',
		'kurikulum',
		'pembina',
		'santri',
		'wali',
		'alumni'
	],
	'rumah-tahfidz': [
		'admin',
		'kepala',
		'pembimbing',
		'pengajar',
		'operator',
		'bendahara',
		'sekretaris',
		'humas',
		'kurikulum',
		'pembina',
		'santri',
		'wali',
		'alumni'
	],
	masjid: [
		'admin',
		'kepala',
		'takmir',
		'bendahara',
		'imam',
		'khotib',
		'muadzin',
		'pengajar',
		'operator',
		'sekretaris',
		'humas',
		'jamaah'
	],
	musholla: [
		'admin',
		'kepala',
		'takmir',
		'bendahara',
		'imam',
		'khotib',
		'muadzin',
		'pengajar',
		'operator',
		'sekretaris',
		'humas',
		'jamaah'
	]
};

/**
 * Get all permissions for a role
 */
export const getPermissions = (role: OrgRole): Permission[] => BASE_PERMISSIONS[role] ?? [];

/**
 * Check if a role has a specific permission
 * Supports wildcard patterns like 'hafalan.*'
 */
export const hasPermission = (role: OrgRole, permission: Permission | PermissionPattern): boolean => {
	const rolePermissions = getPermissions(role);

	// Direct match
	if (rolePermissions.includes(permission as Permission)) {
		return true;
	}

	// Wildcard match (e.g., 'hafalan.*' matches 'hafalan.read', 'hafalan.write', etc.)
	if (permission.endsWith('.*')) {
		const prefix = permission.slice(0, -2);
		return rolePermissions.some((p) => p.startsWith(prefix + '.'));
	}

	return false;
};

/**
 * Check if a role is allowed in an organization type
 */
export const isRoleAllowedInOrg = (role: OrgRole, orgType: OrgType): boolean =>
	ALLOWED_ROLES_BY_TYPE[orgType]?.includes(role) ?? false;

/**
 * Get role level for hierarchy checks
 */
export const getRoleLevel = (role: OrgRole): RoleLevel => ROLE_TO_LEVEL[role] ?? ROLE_LEVELS.MEMBER;

/**
 * Check if a role has higher or equal level than another
 */
export const hasHigherOrEqualLevel = (role: OrgRole, compareRole: OrgRole): boolean =>
	getRoleLevel(role) >= getRoleLevel(compareRole);

/**
 * Get all permissions including secondary roles
 */
export const getAllPermissions = (
	primaryRole: OrgRole,
	secondaryRoles?: OrgRole[]
): Permission[] => {
	const permissions = new Set(getPermissions(primaryRole));

	if (secondaryRoles && secondaryRoles.length > 0) {
		secondaryRoles.forEach((role) => {
			getPermissions(role).forEach((p) => permissions.add(p));
		});
	}

	return Array.from(permissions);
};

/**
 * Check if user has permission considering primary and secondary roles
 */
export const hasAnyPermission = (
	primaryRole: OrgRole,
	permission: Permission | PermissionPattern,
	secondaryRoles?: OrgRole[]
): boolean => {
	// Check primary role
	if (hasPermission(primaryRole, permission)) {
		return true;
	}

	// Check secondary roles
	if (secondaryRoles && secondaryRoles.length > 0) {
		return secondaryRoles.some((role) => hasPermission(role, permission));
	}

	return false;
};

/**
 * Get display name for a role
 */
export const getRoleDisplayName = (role: OrgRole): string => {
	const displayNames: Record<OrgRole, string> = {
		admin: 'Administrator',
		kepala: 'Kepala/Pimpinan',
		pengajar: 'Pengajar',
		pembimbing: 'Pembimbing',
		operator: 'Operator',
		bendahara: 'Bendahara',
		sekretaris: 'Sekretaris',
		humas: 'Humas',
		kurikulum: 'Kurikulum',
		pembina: 'Pembina',
		santri: 'Santri',
		wali: 'Wali Santri',
		alumni: 'Alumni',
		jamaah: 'Jamaah',
		takmir: 'Takmir',
		imam: 'Imam',
		khotib: 'Khotib',
		muadzin: 'Muadzin'
	};

	return displayNames[role] ?? role;
};

/**
 * Get role description
 */
export const getRoleDescription = (role: OrgRole): string => {
	const descriptions: Record<OrgRole, string> = {
		admin: 'Administrator organisasi dengan akses penuh',
		kepala: 'Kepala organisasi (Kepala TPQ, Pengasuh, Ketua Takmir)',
		pengajar: 'Ustadz/Ustadzah pengajar',
		pembimbing: 'Pembimbing/Musyrif/Koordinator/Wali Kelas',
		operator: 'Operator data dan administrasi',
		bendahara: 'Pengelola keuangan',
		sekretaris: 'Administrasi dan dokumentasi',
		humas: 'Public relations dan media sosial',
		kurikulum: 'Pengembangan program pembelajaran',
		pembina: 'Pembinaan karakter dan kedisiplinan',
		santri: 'Siswa/Santri',
		wali: 'Orang tua/Wali santri',
		alumni: 'Alumni',
		jamaah: 'Jamaah masjid/musholla',
		takmir: 'Anggota takmir masjid/musholla',
		imam: 'Imam sholat',
		khotib: 'Khotib Jumat',
		muadzin: 'Muadzin'
	};

	return descriptions[role] ?? '';
};