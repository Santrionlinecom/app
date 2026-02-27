import { error, json } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { Scrypt } from '$lib/server/password';
import { isSuperAdminRole } from '$lib/server/auth/requireSuperAdmin';
import type { RequestHandler } from './$types';

const adminRoles = new Set(['admin', 'SUPER_ADMIN']);
const defaultPassword = 'password123';

const assertSeedAccess = (params: {
	locals: App.Locals;
	secret?: string;
	token?: string | null;
}) => {
	const { locals, secret, token } = params;
	const role = locals.user?.role ?? null;
	if (!locals.user || (!adminRoles.has(role ?? '') && !isSuperAdminRole(role))) {
		throw error(403, 'Forbidden');
	}
	if (secret && token !== secret) {
		throw error(403, 'Invalid seed token');
	}
	if (!locals.db) {
		throw error(500, 'Database tidak tersedia');
	}
	return locals.db;
};

const runSeed = async (db: NonNullable<App.Locals['db']>) => {
	// Define demo users for each role
	const demoUsers = [
		{ email: 'admin@santrionline.com', username: 'Admin', role: 'admin' },
		{ email: 'ustadz@santrionline.com', username: 'Ustadz Ahmad', role: 'ustadz' },
		{ email: 'santri@santrionline.com', username: 'Santri Ali', role: 'santri' }
	];

	try {
		const hashedPassword = await new Scrypt().hash(defaultPassword);
		const created = [];
		const existing = [];

		for (const user of demoUsers) {
			// Check if user already exists
			const existingUser = await db
				.prepare('SELECT id FROM users WHERE email = ?')
				.bind(user.email)
				.first<{ id: string }>();

			if (existingUser?.id) {
				// Reset password + role for existing user so kredensial selalu konsisten
				await db
					.prepare('UPDATE users SET password_hash = ?, role = ? WHERE id = ?')
					.bind(hashedPassword, user.role, existingUser.id)
					.run();
				existing.push(user.email);
				continue;
			}

			// Create new user
			const userId = generateId(15);
			await db
				.prepare(
					'INSERT INTO users (id, username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
				)
				.bind(userId, user.username, user.email, hashedPassword, user.role, Date.now())
				.run();

			created.push({ email: user.email, role: user.role });
		}

		return json({
			message: created.length > 0 ? 'Demo users created successfully.' : 'All demo users already exist.',
			created,
			existing
		});
	} catch (error) {
		console.error('Seed Demo Users Error:', error);
		return json({ error: 'Failed to create demo users.' }, { status: 500 });
	}
};

const handler: RequestHandler = async ({ locals, platform, request, url }) => {
	const secret = platform?.env?.SEED_SECRET as string | undefined;
	const token = request.headers.get('x-seed-secret') ?? url.searchParams.get('token');
	const db = assertSeedAccess({ locals, secret, token });
	return runSeed(db);
};

export const POST: RequestHandler = handler;
export const GET: RequestHandler = async () =>
	json({ error: 'Method not allowed. Gunakan POST /api/seed-admin.' }, { status: 405 });
