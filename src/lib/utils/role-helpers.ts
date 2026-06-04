import type { OrgRole } from '$lib/types/rbac';
import { LEGACY_ROLE_MAP } from '$lib/types/rbac';
import { getRoleDisplayName, getRoleDescription } from '$lib/rbac/permissions';

/**
 * Normalize legacy role names to new simplified roles
 * @param role - The role to normalize (can be legacy or new)
 * @returns The normalized role name
 */
export function normalizeRole(role: string): OrgRole {
	// Check if it's a legacy role that needs mapping
	if (role in LEGACY_ROLE_MAP) {
		return LEGACY_ROLE_MAP[role as keyof typeof LEGACY_ROLE_MAP];
	}
	
	// Return as-is if already normalized
	return role as OrgRole;
}

/**
 * Check if a role matches (handles both legacy and new role names)
 * @param userRole - The user's current role
 * @param checkRole - The role to check against (can be legacy or new)
 * @returns True if roles match
 */
export function isRole(userRole: string, checkRole: string): boolean {
	const normalizedUserRole = normalizeRole(userRole);
	const normalizedCheckRole = normalizeRole(checkRole);
	return normalizedUserRole === normalizedCheckRole;
}

/**
 * Check if user role is one of the specified roles (handles legacy names)
 * @param userRole - The user's current role
 * @param roles - Array of roles to check against
 * @returns True if user role matches any of the specified roles
 */
export function isOneOfRoles(userRole: string, roles: string[]): boolean {
	const normalizedUserRole = normalizeRole(userRole);
	return roles.some(role => normalizeRole(role) === normalizedUserRole);
}

/**
 * Get display name for a role (handles legacy names)
 * @param role - The role (can be legacy or new)
 * @returns Display name for the role
 */
export function getDisplayName(role: string): string {
	const normalizedRole = normalizeRole(role);
	return getRoleDisplayName(normalizedRole);
}

/**
 * Get description for a role (handles legacy names)
 * @param role - The role (can be legacy or new)
 * @returns Description for the role
 */
export function getDescription(role: string): string {
	const normalizedRole = normalizeRole(role);
	return getRoleDescription(normalizedRole);
}

/**
 * Check if a role is a teaching role (pengajar, ustadz, ustadzah)
 * @param role - The role to check
 * @returns True if it's a teaching role
 */
export function isTeachingRole(role: string): boolean {
	return isOneOfRoles(role, ['pengajar', 'ustadz', 'ustadzah']);
}

/**
 * Check if a role is a leadership role (kepala, admin, etc.)
 * @param role - The role to check
 * @returns True if it's a leadership role
 */
export function isLeadershipRole(role: string): boolean {
	return isOneOfRoles(role, ['admin', 'kepala', 'kepala_tpq', 'kepala_tahfidz', 'pengasuh', 'ketua_takmir']);
}

/**
 * Check if a role is a mentoring role (pembimbing, musyrif, etc.)
 * @param role - The role to check
 * @returns True if it's a mentoring role
 */
export function isAdminRole(role: string): boolean {
  return role === "admin" || role === "SUPER_ADMIN" || role === "super_admin";
}

export function isMentoringRole(role: string): boolean {
	return isOneOfRoles(role, ['pembimbing', 'musyrif', 'koordinator', 'wali_kelas']);
}

/**
 * Check if a role is a student role
 * @param role - The role to check
 * @returns True if it's a student role
 */
export function isStudentRole(role: string): boolean {
	return isRole(role, 'santri');
}

/**
 * Check if a role is a parent/guardian role
 * @param role - The role to check
 * @returns True if it's a parent/guardian role
 */
export function isParentRole(role: string): boolean {
	return isRole(role, 'wali');
}

/**
 * Get all legacy role names that map to a new role
 * @param newRole - The new role name
 * @returns Array of legacy role names
 */
export function getLegacyRoleNames(newRole: OrgRole): string[] {
	const legacyNames: string[] = [];
	
	for (const [legacy, mapped] of Object.entries(LEGACY_ROLE_MAP)) {
		if (mapped === newRole) {
			legacyNames.push(legacy);
		}
	}
	
	return legacyNames;
}

/**
 * Format role for display with proper capitalization
 * @param role - The role to format
 * @returns Formatted role name
 */
export function formatRoleForDisplay(role: string): string {
	const displayName = getDisplayName(role);
	return displayName;
}

/**
 * Get role badge color class for UI
 * @param role - The role
 * @returns Tailwind color class
 */
export function getRoleBadgeColor(role: string): string {
	const normalizedRole = normalizeRole(role);
	
	const colorMap: Record<string, string> = {
		admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
		kepala: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
		pengajar: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
		pembimbing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
		operator: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
		bendahara: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
		sekretaris: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
		humas: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
		kurikulum: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
		pembina: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
		santri: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
		wali: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
		alumni: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
		jamaah: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300',
		takmir: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300',
		imam: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300',
		khotib: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
		muadzin: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
	};
	
	return colorMap[normalizedRole] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
}

/**
 * Check if role can manage other roles (for role assignment UI)
 * @param userRole - The user's role
 * @param targetRole - The role to be assigned
 * @returns True if user can manage the target role
 */
export function canManageRole(userRole: string, targetRole: string): boolean {
	// Admin can manage all roles
	if (isRole(userRole, 'admin')) {
		return true;
	}
	
	// Kepala can manage most roles except admin
	if (isLeadershipRole(userRole) && !isRole(targetRole, 'admin')) {
		return true;
	}
	
	return false;
}
