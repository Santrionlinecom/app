import { json, error } from '@sveltejs/kit';
import { Scrypt } from '$lib/server/password';
import { getOrgScope, getOrganizationById, memberRoleByType } from '$lib/server/organizations';
import type { RequestHandler } from './$types';

const allowedRoles = ['santri', 'ustadz', 'ustadzah', 'jamaah', 'tamir', 'bendahara', 'admin'] as const;
const managerRoles = ['admin', 'SUPER_ADMIN', 'ustadz', 'ustadzah', 'tamir', 'bendahara'] as const;

const ensureAuth = (locals: App.Locals) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}
};

const normalizeUstadzRole = (role?: string, gender?: string | null) => {
	if (role === 'ustadz' || role === 'ustadzah') {
		return gender === 'wanita' ? 'ustadzah' : 'ustadz';
	}
	return role;
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	ensureAuth(locals);
	if (!locals.user?.role || !managerRoles.includes(locals.user.role as any)) {
		throw error(403, 'Forbidden');
	}
	const db = locals.db!;
	if (!db) throw error(500, 'Database tidak tersedia');
	const id = params.id;
	if (!id) throw error(400, 'ID tidak valid');

	const body = await request.json().catch(() => ({}));
	const { results: targetRows } =
		(await db
			.prepare('SELECT gender, role, org_id as orgId FROM users WHERE id = ?')
			.bind(id)
			.all<{ gender?: string; role?: string; orgId?: string | null }>()) ?? {};
	const targetGender = targetRows?.[0]?.gender;
	const targetRole = targetRows?.[0]?.role;
	const targetOrgId = targetRows?.[0]?.orgId ?? null;
	const isAdmin = locals.user.role === 'admin' || locals.user.role === 'SUPER_ADMIN';
	const { orgId, isSystemAdmin } = getOrgScope(locals.user);
	let memberRole: string | null = null;
	if (!isAdmin) {
		if (!orgId) throw error(403, 'Organisasi belum ditentukan');
		const org = await getOrganizationById(db, orgId);
		memberRole = org?.type ? memberRoleByType[org.type] : null;
		if (!memberRole) throw error(403, 'Role anggota tidak valid');
	}
	if (!isSystemAdmin && targetOrgId && targetOrgId !== orgId) {
		throw error(403, 'Tidak boleh mengubah user lembaga lain');
	}
	if (!isAdmin) {
		if (!targetOrgId || targetOrgId !== orgId) {
			throw error(403, 'Tidak boleh mengubah user lembaga lain');
		}
		if (targetRole !== memberRole) {
			throw error(403, 'Hanya boleh mengelola anggota lembaga');
		}
	}
	const username = typeof body.username === 'string' ? body.username.trim() : undefined;
	const email = typeof body.email === 'string' ? body.email.trim() : undefined;
	const role =
		typeof body.role === 'string' && allowedRoles.includes(body.role) ? body.role : undefined;
	const orgStatus =
		typeof body.orgStatus === 'string' && ['pending', 'active'].includes(body.orgStatus)
			? body.orgStatus
			: undefined;
	const password = typeof body.password === 'string' ? body.password : undefined;

	if (!username && !email && !role && !password && !orgStatus) {
		throw error(400, 'Tidak ada data yang diubah');
	}
	if (!isAdmin && (username !== undefined || email !== undefined || role !== undefined || password !== undefined)) {
		throw error(403, 'Tidak boleh mengubah data selain status');
	}

	let passwordHash: string | null = null;
	if (password) {
		if (password.length < 6) throw error(400, 'Password minimal 6 karakter');
		passwordHash = await new Scrypt().hash(password);
	}

	try {
		const fields: string[] = [];
		const values: any[] = [];

		if (username !== undefined) {
			fields.push('username = ?');
			values.push(username || null);
		}
		if (email !== undefined) {
			fields.push('email = ?');
			values.push(email);
		}
		if (role !== undefined) {
			const normalizedRole = normalizeUstadzRole(role, targetGender) ?? role;
			fields.push('role = ?');
			values.push(normalizedRole);
		}
		if (passwordHash) {
			fields.push('password_hash = ?');
			values.push(passwordHash);
		}
		if (orgStatus) {
			fields.push('org_status = ?');
			values.push(orgStatus);
		}
		if (orgStatus === 'active' && role === undefined) {
			const normalizedRole = normalizeUstadzRole(targetRole, targetGender);
			if (normalizedRole && normalizedRole !== targetRole) {
				fields.push('role = ?');
				values.push(normalizedRole);
			}
		}

		values.push(id);

		await db
			.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
			.bind(...values)
			.run();
	} catch (err: any) {
		if (err?.code === 'SQLITE_CONSTRAINT') {
			throw error(400, 'Email sudah terdaftar');
		}
		throw error(500, 'Gagal memperbarui santri');
	}

	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	ensureAuth(locals);
	if (!locals.user?.role || !managerRoles.includes(locals.user.role as any)) {
		throw error(403, 'Forbidden');
	}
	const db = locals.db!;
	if (!db) throw error(500, 'Database tidak tersedia');
	const id = params.id;
	if (!id) throw error(400, 'ID tidak valid');

	const isAdmin = locals.user.role === 'admin' || locals.user.role === 'SUPER_ADMIN';
	const { orgId, isSystemAdmin } = getOrgScope(locals.user);
	const target = await db
		.prepare('SELECT org_id as orgId, role FROM users WHERE id = ?')
		.bind(id)
		.first<{ orgId: string | null; role?: string }>();
	if (!isSystemAdmin) {
		if (!orgId || target?.orgId !== orgId) {
			throw error(403, 'Tidak boleh menghapus user lembaga lain');
		}
	}
	if (!isAdmin) {
		const org = orgId ? await getOrganizationById(db, orgId) : null;
		const memberRole = org?.type ? memberRoleByType[org.type] : null;
		if (!memberRole || target?.role !== memberRole) {
			throw error(403, 'Hanya boleh menghapus anggota lembaga');
		}
	}

	await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

	return json({ ok: true });
};
