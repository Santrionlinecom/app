// Platform-level roles (global access)
export const PLATFORM_ROLES = ['SUPER_ADMIN', 'support', 'auditor'] as const;

// Simplified organization roles (universal across all org types)
export const ORG_ROLES = [
	'admin',
	'kepala',
	'pengajar',
	'pembimbing',
	'operator',
	'bendahara',
	'sekretaris',
	'humas',
	'kurikulum',
	'pembina',
	'santri',
	'wali',
	'alumni',
	'jamaah',
	'takmir',
	'imam',
	'khotib',
	'muadzin'
] as const;

// Role levels for hierarchy
export const ROLE_LEVELS = {
	MEMBER: 0,
	STAFF: 1,
	MANAGER: 2,
	ADMIN: 3
} as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];
export type OrgRole = (typeof ORG_ROLES)[number];
export type AnyRole = PlatformRole | OrgRole;
export type OrgType = 'tpq' | 'pondok' | 'rumah-tahfidz' | 'masjid' | 'musholla';
export type RoleLevel = (typeof ROLE_LEVELS)[keyof typeof ROLE_LEVELS];

// Permission categories with wildcard support
export const PERMISSIONS = [
	// Platform permissions
	'platform.admin',
	'platform.support',
	'platform.audit',

	// Organization management
	'org.manage',
	'org.settings.read',
	'org.settings.write',

	// Member management with scope
	'member.invite',
	'member.approve',
	'member.read',
	'member.read.own',
	'member.read.class',
	'member.read.all',
	'member.write',
	'member.delete',

	// Student management with scope
	'student.read',
	'student.read.own',
	'student.read.class',
	'student.read.all',
	'student.write',
	'student.approve',

	// Hafalan/Memorization
	'hafalan.input',
	'hafalan.review',
	'hafalan.read',
	'hafalan.read.own',
	'hafalan.read.class',
	'hafalan.read.all',

	// Exam/Assessment
	'ujian.write',
	'ujian.read',
	'ujian.read.own',
	'ujian.read.class',
	'ujian.read.all',

	// Report card
	'raport.write',
	'raport.read',
	'raport.read.own',
	'raport.read.class',
	'raport.read.all',

	// Finance
	'finance.read',
	'finance.write',
	'finance.approve',
	'finance.approve.monthly',
	'zakat.manage',

	// Schedule
	'schedule.read',
	'schedule.write',
	'schedule.write.future',
	'imam.schedule',

	// Social/Community
	'social.post',
	'social.comment',
	'social.react',
	'social.moderate',
	'social.delete.own',
	'social.delete.any',

	// Reports
	'report.read',
	'report.write',
	'report.review',

	// Announcements
	'announcement.read',
	'announcement.write'
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// Wildcard permission patterns
export type PermissionPattern = Permission | `${string}.*`;

export interface OrgMembership {
	id: string;
	user_id: string;
	org_id: string;
	org_type: OrgType;
	role: OrgRole;
	role_level: RoleLevel;
	secondary_roles?: string; // JSON array of additional roles
	is_active: boolean;
	role_expires_at?: number;
	joined_at: number;
}

export interface RoleDelegation {
	id: string;
	from_user_id: string;
	to_user_id: string;
	org_id: string;
	delegated_permissions: string; // JSON array
	valid_from: number;
	valid_until: number;
	is_active: boolean;
	created_at: number;
}

export interface RoleDisplayName {
	role: OrgRole;
	display_name: string;
	description?: string;
	org_types: string; // JSON array
	created_at: number;
}

export interface PermissionUsageLog {
	id: string;
	user_id: string;
	org_id?: string;
	permission: Permission;
	action: string;
	resource_type?: string;
	resource_id?: string;
	ip_address?: string;
	user_agent?: string;
	created_at: number;
}

// Role to level mapping
export const ROLE_TO_LEVEL: Record<OrgRole, RoleLevel> = {
	admin: ROLE_LEVELS.ADMIN,
	kepala: ROLE_LEVELS.ADMIN,
	bendahara: ROLE_LEVELS.ADMIN,
	pembimbing: ROLE_LEVELS.MANAGER,
	operator: ROLE_LEVELS.MANAGER,
	sekretaris: ROLE_LEVELS.MANAGER,
	humas: ROLE_LEVELS.MANAGER,
	kurikulum: ROLE_LEVELS.MANAGER,
	pembina: ROLE_LEVELS.MANAGER,
	pengajar: ROLE_LEVELS.STAFF,
	takmir: ROLE_LEVELS.STAFF,
	imam: ROLE_LEVELS.STAFF,
	khotib: ROLE_LEVELS.STAFF,
	muadzin: ROLE_LEVELS.STAFF,
	santri: ROLE_LEVELS.MEMBER,
	wali: ROLE_LEVELS.MEMBER,
	alumni: ROLE_LEVELS.MEMBER,
	jamaah: ROLE_LEVELS.MEMBER
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

// Legacy role mapping for backward compatibility
export const LEGACY_ROLE_MAP: Record<string, OrgRole> = {
	kepala_tpq: 'kepala',
	kepala_tahfidz: 'kepala',
	pengasuh: 'kepala',
	ketua_takmir: 'kepala',
	koordinator: 'pembimbing',
	wali_kelas: 'pembimbing',
	musyrif: 'pembimbing',
	ustadz: 'pengajar',
	ustadzah: 'pengajar'
};