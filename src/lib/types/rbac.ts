export const PLATFORM_ROLES = ['SUPER_ADMIN', 'support', 'auditor'] as const;

export const ORG_ROLES_TPQ = [
	'admin',
	'kepala_tpq',
	'koordinator',
	'wali_kelas',
	'ustadz',
	'ustadzah',
	'santri',
	'wali',
	'operator',
	'bendahara'
] as const;

export const ORG_ROLES_PONDOK = [
	'admin',
	'pengasuh',
	'musyrif',
	'ustadz',
	'ustadzah',
	'santri',
	'wali',
	'alumni',
	'operator',
	'bendahara'
] as const;

export const ORG_ROLES_RUMAH_TAHFIDZ = [
	'admin',
	'kepala_tahfidz',
	'musyrif',
	'ustadz',
	'ustadzah',
	'santri',
	'wali',
	'operator',
	'bendahara'
] as const;

export const ORG_ROLES_MASJID = [
	'admin',
	'ketua_takmir',
	'takmir',
	'bendahara',
	'imam',
	'khotib',
	'muadzin',
	'ustadz',
	'ustadzah',
	'jamaah',
	'operator'
] as const;

export const ORG_ROLES_MUSHOLLA = ORG_ROLES_MASJID;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];
export type OrgRoleTPQ = (typeof ORG_ROLES_TPQ)[number];
export type OrgRolePondok = (typeof ORG_ROLES_PONDOK)[number];
export type OrgRoleRumahTahfidz = (typeof ORG_ROLES_RUMAH_TAHFIDZ)[number];
export type OrgRoleMasjid = (typeof ORG_ROLES_MASJID)[number];
export type OrgRoleMusholla = (typeof ORG_ROLES_MUSHOLLA)[number];

export type OrgRole =
	| OrgRoleTPQ
	| OrgRolePondok
	| OrgRoleRumahTahfidz
	| OrgRoleMasjid
	| OrgRoleMusholla;

export type AnyRole = PlatformRole | OrgRole;
export type OrgType = 'tpq' | 'pondok' | 'rumah-tahfidz' | 'masjid' | 'musholla';

export const PERMISSIONS = [
	'platform.admin',
	'platform.support',
	'platform.audit',
	'org.manage',
	'org.settings.read',
	'org.settings.write',
	'member.invite',
	'member.approve',
	'member.read',
	'member.write',
	'member.delete',
	'student.read',
	'student.write',
	'student.approve',
	'hafalan.input',
	'hafalan.review',
	'hafalan.read',
	'ujian.write',
	'ujian.read',
	'raport.write',
	'raport.read',
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
	'social.delete.own',
	'social.delete.any',
	'report.read',
	'report.write',
	'report.review',
	'announcement.read',
	'announcement.write'
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export interface OrgMembership {
	id: string;
	user_id: string;
	org_id: string;
	org_type: OrgType;
	role: OrgRole;
	is_active: boolean;
	joined_at: number;
}
