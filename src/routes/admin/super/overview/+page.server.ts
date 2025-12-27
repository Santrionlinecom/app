import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { generateId } from 'lucia';
import { Scrypt } from '$lib/server/password';
import { getOrganizationById } from '$lib/server/organizations';
import { logActivity } from '$lib/server/activity-logs';

const memberRoles = ['santri', 'jamaah'];

const countTable = async (db: App.Locals['db'], table: string) => {
	try {
		const row = await db!.prepare(`SELECT COUNT(*) as total FROM ${table}`).first<{ total: number | null }>();
		return Number(row?.total ?? 0);
	} catch {
		return 0;
	}
};

const safeLogQuery = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
	try {
		return await fn();
	} catch {
		return fallback;
	}
};

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'SUPER_ADMIN') {
		throw error(403, 'Tidak memiliki akses');
	}
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}

	const db = locals.db!;

	const totalInstitutions = await countTable(db, 'organizations');
	const totalUsers = await countTable(db, 'users');
	const totalTransactions =
		(await countTable(db, 'transactions')) +
		(await countTable(db, 'transaksi_zakat')) +
		(await countTable(db, 'data_qurban')) +
		(await countTable(db, 'kas_masjid'));

	const { results: orgRows } = await db
		.prepare(
			`SELECT o.id, o.name, o.type, o.slug, o.status, o.created_at as createdAt,
				SUM(CASE WHEN u.role IN (${memberRoles.map(() => '?').join(',')}) THEN 1 ELSE 0 END) as totalMembers,
				SUM(CASE WHEN u.role = 'admin' THEN 1 ELSE 0 END) as adminCount
			 FROM organizations o
			 LEFT JOIN users u ON u.org_id = o.id
			 GROUP BY o.id
			 ORDER BY o.created_at DESC
			 LIMIT 50`
		)
		.bind(...memberRoles)
		.all<{
			id: string;
			name: string;
			type: string;
			slug: string;
			status: string;
			createdAt: number;
			totalMembers: number | null;
			adminCount: number | null;
		}>();

	const searchQuery = (url.searchParams.get('q') ?? '').trim();
	let searchResults: Array<{
		id: string;
		username: string | null;
		email: string;
		role: string;
		orgId: string | null;
		orgName: string | null;
		orgType: string | null;
		orgSlug: string | null;
	}> = [];
	if (searchQuery.length >= 2) {
		const likeValue = `%${searchQuery}%`;
		const { results } = await db
			.prepare(
				`SELECT u.id, u.username, u.email, u.role, u.org_id as orgId,
					o.name as orgName, o.type as orgType, o.slug as orgSlug
				 FROM users u
				 LEFT JOIN organizations o ON o.id = u.org_id
				 WHERE u.email LIKE ? OR u.username LIKE ?
				 ORDER BY u.created_at DESC
				 LIMIT 50`
			)
			.bind(likeValue, likeValue)
			.all<{
				id: string;
				username: string | null;
				email: string;
				role: string;
				orgId: string | null;
				orgName: string | null;
				orgType: string | null;
				orgSlug: string | null;
			}>();
		searchResults = results ?? [];
	}

	const { results: candidateUsers } = await db
		.prepare(
			`SELECT id, username, email, role, org_id as orgId, created_at as createdAt
			 FROM users
			 WHERE role NOT IN ('admin', 'SUPER_ADMIN')
			 ORDER BY created_at DESC
			 LIMIT 200`
		)
		.all<{
			id: string;
			username: string | null;
			email: string;
			role: string;
			orgId: string | null;
			createdAt: number;
		}>();

	const startOfDay = new Date();
	startOfDay.setHours(0, 0, 0, 0);

	const loginsToday = await safeLogQuery(async () => {
		const row = await db
			.prepare(
				`SELECT COUNT(DISTINCT user_id) as total
				 FROM system_logs
				 WHERE action = 'LOGIN' AND created_at >= ?`
			)
			.bind(startOfDay.getTime())
			.first<{ total: number | null }>();
		return Number(row?.total ?? 0);
	}, 0);

	const registrationsToday = await safeLogQuery(async () => {
		const row = await db
			.prepare(
				`SELECT COUNT(1) as total
				 FROM system_logs
				 WHERE action = 'REGISTER' AND created_at >= ?`
			)
			.bind(startOfDay.getTime())
			.first<{ total: number | null }>();
		return Number(row?.total ?? 0);
	}, 0);

	const trafficSources = await safeLogQuery(async () => {
		const { results } = await db
			.prepare(
				`SELECT action, COUNT(1) as total, MAX(created_at) as lastSeen
				 FROM system_logs
				 WHERE action LIKE 'CLICK_%'
				 GROUP BY action
				 ORDER BY total DESC
				 LIMIT 5`
			)
			.all<{ action: string; total: number | null; lastSeen: number | null }>();
		return (results ?? []).map((row) => ({
			action: row.action,
			total: Number(row.total ?? 0),
			lastSeen: row.lastSeen ?? null
		}));
	}, [] as Array<{ action: string; total: number; lastSeen: number | null }>);

	const recentActivities = await safeLogQuery(async () => {
		const { results } = await db
			.prepare(
				`SELECT sl.id, sl.user_id as userId, sl.user_email as userEmail, sl.action, sl.metadata,
					sl.ip_address as ipAddress, sl.created_at as createdAt,
					u.username, u.email
				 FROM system_logs sl
				 LEFT JOIN users u ON u.id = sl.user_id
				 ORDER BY sl.created_at DESC
				 LIMIT 10`
			)
			.all<{
				id: string;
				userId: string | null;
				userEmail: string | null;
				action: string;
				metadata: string | null;
				ipAddress: string | null;
				createdAt: number;
				username: string | null;
				email: string | null;
			}>();
		return results ?? [];
	}, [] as Array<{
		id: string;
		userId: string | null;
		userEmail: string | null;
		action: string;
		metadata: string | null;
		ipAddress: string | null;
		createdAt: number;
		username: string | null;
		email: string | null;
	}>);

	return {
		stats: {
			totalInstitutions,
			totalUsers,
			totalTransactions
		},
		liveStats: {
			loginsToday,
			registrationsToday,
			trafficSources,
			recentActivities
		},
		institutions: orgRows ?? [],
		availableUsers: candidateUsers ?? [],
		searchQuery,
		searchResults
	};
};

const requireSuperAdmin = (locals: App.Locals) => {
	if (!locals.user || locals.user.role !== 'SUPER_ADMIN') {
		throw error(403, 'Tidak memiliki akses');
	}
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}
	return locals.db;
};

const ensureOrgHasNoAdmin = async (db: App.Locals['db'], orgId: string) => {
	const row = await db!
		.prepare("SELECT COUNT(1) as total FROM users WHERE org_id = ? AND role = 'admin'")
		.bind(orgId)
		.first<{ total: number | null }>();
	if (Number(row?.total ?? 0) > 0) {
		throw error(400, 'Lembaga sudah memiliki admin.');
	}
};

export const actions: Actions = {
	assignExistingAdmin: async ({ request, locals }) => {
		const db = requireSuperAdmin(locals);
		const form = await request.formData();
		const orgId = form.get('orgId');
		const userId = form.get('userId');

		if (typeof orgId !== 'string' || !orgId) {
			return fail(400, { error: 'Lembaga wajib dipilih.' });
		}
		if (typeof userId !== 'string' || !userId) {
			return fail(400, { error: 'User wajib dipilih.' });
		}

		const org = await getOrganizationById(db, orgId);
		if (!org) {
			return fail(404, { error: 'Lembaga tidak ditemukan.' });
		}

		await ensureOrgHasNoAdmin(db, orgId);

		const user = await db!
			.prepare('SELECT id, role, org_id as orgId FROM users WHERE id = ?')
			.bind(userId)
			.first<{ id: string; role: string; orgId: string | null }>();
		if (!user) {
			return fail(404, { error: 'User tidak ditemukan.' });
		}
		if (user.role === 'admin' || user.role === 'SUPER_ADMIN') {
			return fail(400, { error: 'User sudah admin/super admin.' });
		}

		await db!
			.prepare("UPDATE users SET role = 'admin', org_id = ?, org_status = 'active' WHERE id = ?")
			.bind(orgId, userId)
			.run();

		return { success: true };
	},
	createAdmin: async ({ request, locals }) => {
		const db = requireSuperAdmin(locals);
		const form = await request.formData();
		const orgId = form.get('orgId');
		const name = form.get('name');
		const email = form.get('email');
		const password = form.get('password');

		if (typeof orgId !== 'string' || !orgId) {
			return fail(400, { error: 'Lembaga wajib dipilih.' });
		}
		if (typeof name !== 'string' || !name.trim()) {
			return fail(400, { error: 'Nama admin wajib diisi.' });
		}
		if (typeof email !== 'string' || !email.trim()) {
			return fail(400, { error: 'Email admin wajib diisi.' });
		}
		if (typeof password !== 'string' || password.length < 6) {
			return fail(400, { error: 'Password minimal 6 karakter.' });
		}

		const org = await getOrganizationById(db, orgId);
		if (!org) {
			return fail(404, { error: 'Lembaga tidak ditemukan.' });
		}

		await ensureOrgHasNoAdmin(db, orgId);

		const existing = await db!
			.prepare('SELECT id FROM users WHERE email = ?')
			.bind(email.trim())
			.first<{ id: string }>();
		if (existing) {
			return fail(400, { error: 'Email sudah terdaftar.' });
		}

		const hashed = await new Scrypt().hash(password);
		const userId = generateId(15);
		await db!
			.prepare(
				`INSERT INTO users (id, username, email, password_hash, role, org_id, org_status, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(userId, name.trim(), email.trim(), hashed, 'admin', orgId, 'active', Date.now())
			.run();

		await logActivity(db!, {
			userId,
			action: 'REGISTER',
			metadata: { orgId, role: 'admin', createdBy: locals.user?.id ?? null, source: 'super-admin/create-admin' }
		});

		return { success: true };
	}
};
