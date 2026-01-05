import { json, error } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { Scrypt } from '$lib/server/password';
import { getDefaultMemberRole, getOrgScope, getOrganizationById, memberRoleByType } from '$lib/server/organizations';
import type { OrgType } from '$lib/server/organizations';
import type { RequestHandler } from './$types';
import { logActivity } from '$lib/server/activity-logs';

const allowedRoles = ['santri', 'ustadz', 'ustadzah', 'jamaah', 'tamir', 'bendahara', 'admin'] as const;
const managerRoles = ['admin', 'SUPER_ADMIN', 'ustadz', 'ustadzah', 'tamir', 'bendahara'] as const;

const ensureAuth = (locals: App.Locals) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
};

const normalizePagination = (page = 1, limit = 10) => {
	const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
	const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
	const cappedLimit = Math.min(safeLimit, 100);
	const offset = (safePage - 1) * cappedLimit;
	return { page: safePage, limit: cappedLimit, offset };
};

export const GET: RequestHandler = async ({ locals, url }) => {
	ensureAuth(locals);
	if (!locals.user?.role || !managerRoles.includes(locals.user.role as any)) {
		throw error(403, 'Forbidden');
	}
	const db = locals.db!;
	if (!db) throw error(500, 'Database tidak tersedia');
	const page = Number(url.searchParams.get('page') ?? '1');
	const limit = Number(url.searchParams.get('limit') ?? '10');
	const pagination = normalizePagination(page, limit);
	const isAdmin = locals.user.role === 'admin' || locals.user.role === 'SUPER_ADMIN';
	const { orgId, isSystemAdmin } = getOrgScope(locals.user);
	let orgType: OrgType | null = null;
	let memberRole: string | null = null;
	if (orgId) {
		const org = await getOrganizationById(db, orgId);
		orgType = org?.type ?? null;
		memberRole = orgType ? memberRoleByType[orgType] : null;
	}
	const baseQuery =
		'SELECT id, username, email, role, org_id as orgId, org_status as orgStatus, created_at as createdAt FROM users';
	const conditions: string[] = [];
	const params: (string | number)[] = [];

	if (isAdmin) {
		if (!isSystemAdmin) {
			if (!orgId) throw error(400, 'Organisasi belum ditentukan');
			conditions.push('org_id = ?');
			params.push(orgId);
		}
	} else {
		if (!orgId || !memberRole) {
			throw error(403, 'Organisasi belum ditentukan');
		}
		conditions.push('org_id = ?');
		params.push(orgId);
		conditions.push('role = ?');
		params.push(memberRole);
	}

	const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
	const listSql = `${baseQuery} ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
	const listParams = [...params, pagination.limit, pagination.offset];
	const { results } = await db.prepare(listSql).bind(...listParams).all<{
		id: string;
		username: string | null;
		email: string;
		role: string;
		orgId: string | null;
		orgStatus: string | null;
		createdAt: number;
	}>();

	const countRow = await db
		.prepare(`SELECT COUNT(1) as totalCount FROM users ${whereSql}`)
		.bind(...params)
		.first<{ totalCount: number }>();

	const statsRow = await db
		.prepare(
			`SELECT
				COUNT(1) as total,
				SUM(CASE WHEN role = 'santri' THEN 1 ELSE 0 END) as santri,
				SUM(CASE WHEN role = 'jamaah' THEN 1 ELSE 0 END) as jamaah,
				SUM(CASE WHEN role IN ('ustadz', 'ustadzah') THEN 1 ELSE 0 END) as ustadz,
				SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin,
				SUM(CASE WHEN COALESCE(org_status, 'active') = 'pending' THEN 1 ELSE 0 END) as pending
			 FROM users ${whereSql}`
		)
		.bind(...params)
		.first<{
			total: number | null;
			santri: number | null;
			jamaah: number | null;
			ustadz: number | null;
			admin: number | null;
			pending: number | null;
		}>();

	return json({
		santri: results ?? [],
		scope: { isAdmin, memberRole, orgType },
		pagination: {
			page: pagination.page,
			limit: pagination.limit,
			totalCount: Number(countRow?.totalCount ?? 0)
		},
		stats: {
			total: Number(statsRow?.total ?? 0),
			santri: Number(statsRow?.santri ?? 0),
			jamaah: Number(statsRow?.jamaah ?? 0),
			ustadz: Number(statsRow?.ustadz ?? 0),
			admin: Number(statsRow?.admin ?? 0),
			pending: Number(statsRow?.pending ?? 0)
		}
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	ensureAuth(locals);
	if (!locals.user?.role || !managerRoles.includes(locals.user.role as any)) {
		throw error(403, 'Forbidden');
	}
	const db = locals.db!;
	if (!db) throw error(500, 'Database tidak tersedia');
	const body = await request.json().catch(() => ({}));
	const isAdmin = locals.user.role === 'admin' || locals.user.role === 'SUPER_ADMIN';

	const username = typeof body.username === 'string' ? body.username.trim() : '';
	const email = typeof body.email === 'string' ? body.email.trim() : '';
	const password = typeof body.password === 'string' ? body.password : '';
	const requestedRole =
		typeof body.role === 'string' && allowedRoles.includes(body.role) ? body.role : null;
	const genderRaw = typeof body.gender === 'string' ? body.gender.trim() : '';
	const gender = genderRaw === 'pria' || genderRaw === 'wanita' ? genderRaw : null;
	const { orgId, isSystemAdmin } = getOrgScope(locals.user);
	let orgType: OrgType | null = null;
	let memberRole: string | null = null;
	if (orgId) {
		const org = await getOrganizationById(db, orgId);
		orgType = org?.type ?? null;
		memberRole = orgType ? memberRoleByType[orgType] : null;
	}
	const targetOrgId = isAdmin
		? isSystemAdmin
			? typeof body.orgId === 'string'
				? body.orgId
				: null
			: orgId
		: orgId;
	let targetOrgType: OrgType | null = orgType;
	if (targetOrgId && (targetOrgId !== orgId || !orgType)) {
		const targetOrg = await getOrganizationById(db, targetOrgId);
		targetOrgType = targetOrg?.type ?? null;
	}
	const defaultRole = getDefaultMemberRole(targetOrgType);
	const role = isAdmin ? requestedRole ?? defaultRole : memberRole;

	if (!targetOrgId) {
		throw error(400, 'Organisasi belum ditentukan');
	}
	if (!isAdmin && !role) {
		throw error(403, 'Role tidak valid');
	}

	if (!email || !password) {
		throw error(400, 'Email dan password wajib diisi');
	}
	if (password.length < 6) {
		throw error(400, 'Password minimal 6 karakter');
	}

	const userId = generateId(15);
	const hashedPassword = await new Scrypt().hash(password);
	const normalizedRole =
		role === 'ustadz' || role === 'ustadzah'
			? gender === 'wanita'
				? 'ustadzah'
				: 'ustadz'
			: role;

	if (!normalizedRole) {
		throw error(400, 'Role tidak valid');
	}

	try {
		await db
			.prepare(
				`INSERT INTO users (id, username, email, password_hash, role, gender, org_id, org_status, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				userId,
				username || null,
				email,
				hashedPassword,
				normalizedRole,
				gender,
				targetOrgId,
				'active',
				Date.now()
			)
			.run();
		await logActivity(db, {
			userId,
			action: 'REGISTER',
			metadata: {
				orgId: targetOrgId,
				role: normalizedRole,
				createdBy: locals.user?.id ?? null,
				source: 'api/santri'
			}
		});
	} catch (err: any) {
		if (err?.code === 'SQLITE_CONSTRAINT') {
			throw error(400, 'Email sudah terdaftar');
		}
		throw error(500, 'Gagal membuat santri');
	}

	return json(
		{ id: userId, username, email, role: normalizedRole },
		{
			status: 201
		}
	);
};
