import type { D1Database } from '@cloudflare/workers-types';
import type { OrgMembership, OrgType, OrgRole } from '$lib/types/rbac';

export type UserMembership = OrgMembership & {
	org_name: string;
	org_type: OrgType;
};

type MembershipRow = Omit<OrgMembership, 'is_active' | 'org_type' | 'role'> & {
	org_type: OrgType;
	role: OrgRole;
	is_active: number;
	org_name: string;
};

const mapMembership = (row: MembershipRow): UserMembership => ({
	...row,
	is_active: row.is_active === 1
});

export async function getUserMemberships(userId: string, db: D1Database): Promise<UserMembership[]> {
	const { results } = await db
		.prepare(
			`SELECT
				m.id,
				m.user_id,
				m.org_id,
				m.org_type,
				m.role,
				m.is_active,
				m.joined_at,
				o.name as org_name
			 FROM organization_memberships m
			 JOIN organizations o ON o.id = m.org_id
			 WHERE m.user_id = ? AND m.is_active = 1
			 ORDER BY m.joined_at DESC`
		)
		.bind(userId)
		.all<MembershipRow>();

	return (results ?? []).map(mapMembership);
}

export async function getActiveMembership(
	userId: string,
	orgId: string,
	db: D1Database
): Promise<UserMembership | null> {
	const row = await db
		.prepare(
			`SELECT
				m.id,
				m.user_id,
				m.org_id,
				m.org_type,
				m.role,
				m.is_active,
				m.joined_at,
				o.name as org_name
			 FROM organization_memberships m
			 JOIN organizations o ON o.id = m.org_id
			 WHERE m.user_id = ? AND m.org_id = ? AND m.is_active = 1
			 LIMIT 1`
		)
		.bind(userId, orgId)
		.first<MembershipRow>();

	return row ? mapMembership(row) : null;
}
