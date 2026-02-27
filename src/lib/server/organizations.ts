import type { D1Database } from '@cloudflare/workers-types';
import { generateId } from 'lucia';
import { isCommunityOrgType } from '$lib/server/utils';
import { allowedRolesByType, isSystemAdmin, type OrgRole, type OrgType } from '$lib/server/auth/rbac';

export type { OrgRole, OrgType };
export type OrgStatus = 'pending' | 'active' | 'rejected';
export type OrgStatusFilter = OrgStatus | 'all';

export type PublicOrgMember = {
	id: string;
	username: string | null;
	role: string | null;
	orgStatus: string | null;
	createdAt: number | null;
};

const isMissingTableError = (err: unknown) =>
	`${(err as Error)?.message ?? err}`.toLowerCase().includes('no such table');

const addColumn = async (db: D1Database, name: string, type: string) => {
	try {
		await db.prepare(`ALTER TABLE users ADD COLUMN ${name} ${type}`).run();
	} catch (err: any) {
		if (!`${err?.message ?? ''}`.includes('duplicate column name')) {
			throw err;
		}
	}
};

export const ensureOrgSchema = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS organizations (
				id TEXT PRIMARY KEY,
				type TEXT NOT NULL,
				name TEXT NOT NULL,
				slug TEXT NOT NULL,
				status TEXT NOT NULL DEFAULT 'pending',
				address TEXT,
				city TEXT,
				contact_phone TEXT,
				created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
			)`
		)
		.run();
	await db
		.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_org_type_slug ON organizations(type, slug)')
		.run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_org_type_status ON organizations(type, status)').run();
	await db.prepare('CREATE INDEX IF NOT EXISTS idx_org_slug ON organizations(slug)').run();

	await addColumn(db, 'org_id', 'TEXT');
	await addColumn(db, 'org_status', "TEXT NOT NULL DEFAULT 'active'");
};

export const slugify = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');

export const ensureUniqueSlug = async (db: D1Database, type: OrgType, baseSlug: string) => {
	let slug = baseSlug;
	let suffix = 1;
	while (true) {
		const existing = await db
			.prepare('SELECT id FROM organizations WHERE slug = ? AND type = ?')
			.bind(slug, type)
			.first<{ id: string }>();
		if (!existing) return slug;
		suffix += 1;
		slug = `${baseSlug}-${suffix}`;
	}
};

export const listOrganizations = async (
	db: D1Database,
	opts: { type: OrgType; status?: OrgStatusFilter }
) => {
	const status = opts.status ?? 'active';
	const baseQuery = `SELECT id, type, name, slug, status, address, city, contact_phone as contactPhone, created_at as createdAt,
		(SELECT url FROM org_media WHERE organization_id = organizations.id ORDER BY created_at DESC LIMIT 1) as thumbnailUrl
		FROM organizations`;
	const query =
		status === 'all'
			? `${baseQuery} WHERE type = ? ORDER BY created_at DESC`
			: `${baseQuery} WHERE type = ? AND status = ? ORDER BY created_at DESC`;
	const stmt = status === 'all' ? db.prepare(query).bind(opts.type) : db.prepare(query).bind(opts.type, status);
	const { results } = await stmt.all<{
		id: string;
		type: OrgType;
		name: string;
		slug: string;
		status: OrgStatus;
		address: string | null;
		city: string | null;
		contactPhone: string | null;
		createdAt: number;
		thumbnailUrl: string | null;
	}>();

	return (results ?? []) as {
		id: string;
		type: OrgType;
		name: string;
		slug: string;
		status: OrgStatus;
		address: string | null;
		city: string | null;
		contactPhone: string | null;
		createdAt: number;
		thumbnailUrl: string | null;
	}[];
};

export const getOrganizationBySlug = async (db: D1Database, slug: string, type?: OrgType) => {
	const query = type
		? `SELECT id, type, name, slug, status, address, city, contact_phone as contactPhone, created_at as createdAt
			 FROM organizations
			 WHERE slug = ? AND type = ?`
		: `SELECT id, type, name, slug, status, address, city, contact_phone as contactPhone, created_at as createdAt
			 FROM organizations
			 WHERE slug = ?`;
	const stmt = type ? db.prepare(query).bind(slug, type) : db.prepare(query).bind(slug);
	return stmt.first<{
		id: string;
		type: OrgType;
		name: string;
		slug: string;
		status: OrgStatus;
		address: string | null;
		city: string | null;
		contactPhone: string | null;
		createdAt: number;
	}>();
};

export const getOrganizationById = async (db: D1Database, id: string) => {
	return db
		.prepare(
			`SELECT id, type, name, slug, status, address, city, contact_phone as contactPhone, created_at as createdAt
			 FROM organizations
			 WHERE id = ?`
		)
		.bind(id)
		.first<{
			id: string;
			type: OrgType;
			name: string;
			slug: string;
			status: OrgStatus;
			address: string | null;
			city: string | null;
			contactPhone: string | null;
			createdAt: number;
		}>();
};

export const createOrganization = async (
	db: D1Database,
	params: {
		type: OrgType;
		name: string;
		slug: string;
		address?: string;
		city?: string;
		contactPhone?: string;
		status?: OrgStatus;
	}
) => {
	const id = generateId(15);
	const status = params.status ?? 'pending';
	await db
		.prepare(
			`INSERT INTO organizations (id, type, name, slug, status, address, city, contact_phone, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			id,
			params.type,
			params.name,
			params.slug,
			status,
			params.address || null,
			params.city || null,
			params.contactPhone || null,
			Date.now()
		)
		.run();
	return id;
};

export const getOrgScope = (user: { role?: string; orgId?: string | null }) => {
	const orgId = user?.orgId ?? null;
	return { orgId, isSystemAdmin: isSystemAdmin(user?.role) };
};

export const canManageOrg = (user: { role?: string; orgId?: string | null }) =>
	user?.role === 'admin' && !!user.orgId;

export { allowedRolesByType };

export const memberRoleByType: Record<OrgType, OrgRole> = {
	pondok: 'santri',
	masjid: 'jamaah',
	musholla: 'jamaah',
	tpq: 'santri',
	'rumah-tahfidz': 'santri'
};

export const getDefaultMemberRole = (type?: string | null): OrgRole =>
	isCommunityOrgType(type) ? 'jamaah' : 'santri';

export const getMemberReferralRole = (type: OrgType, url?: URL) => {
	if (!url) return null;
	const refValue = (url.searchParams.get('ref') || '').toLowerCase();
	const roleValue = (url.searchParams.get('role') || '').toLowerCase();
	const defaultRole = getDefaultMemberRole(type);
	const referralFlags = ['anggota', 'member', 'jamaah', 'santri'];
	if (referralFlags.includes(refValue)) {
		return defaultRole;
	}
	if (roleValue && roleValue === defaultRole) {
		return defaultRole;
	}
	return null;
};

export const listPublicOrgMembers = async (db: D1Database, orgId: string) => {
	try {
		const { results } = await db
			.prepare(
				`SELECT id,
					username,
					role,
					org_status as orgStatus,
					created_at as createdAt
				 FROM users
				 WHERE org_id = ?
				   AND (org_status IS NULL OR org_status = 'active')
				   AND role IS NOT NULL
				   AND UPPER(REPLACE(COALESCE(role, ''), '-', '_')) != 'SUPER_ADMIN'
				 ORDER BY created_at ASC`
			)
			.bind(orgId)
			.all<PublicOrgMember>();

		return (results ?? []) as PublicOrgMember[];
	} catch (err) {
		if (isMissingTableError(err)) return [];
		throw err;
	}
};
