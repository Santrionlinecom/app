import { error, json } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { Scrypt } from '$lib/server/password';
import { requireMaintenanceAccess } from '$lib/server/admin-maintenance';
import { getRequestIp, logActivity } from '$lib/server/logger';
import type { RequestHandler } from './$types';

const defaultPassword = 'password123';

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
	const db = locals.db ?? platform?.env.DB;
	if (!db) throw error(500, 'Layanan data tidak tersedia');

	const { user } = requireMaintenanceAccess({
		locals: { ...locals, db },
		secret,
		token,
		secretName: 'SEED_SECRET'
	});

	const response = await runSeed(db);
	logActivity(db, 'ADMIN_SEED_DEMO_USERS', {
		userId: user.id,
		userEmail: user.email,
		ipAddress: getRequestIp(request),
		metadata: { emails: ['admin@santrionline.com', 'ustadz@santrionline.com', 'santri@santrionline.com'] },
		waitUntil: platform?.context?.waitUntil
	});
	return response;
};

export const POST: RequestHandler = handler;
export const GET: RequestHandler = async () =>
	json({ error: 'Method not allowed. Gunakan POST /api/seed-admin.' }, { status: 405 });
