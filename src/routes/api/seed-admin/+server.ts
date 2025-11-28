import { json } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { Scrypt } from 'oslo/password';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const db = locals.db;
	const defaultPassword = 'password123';

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
			existing,
			credentials: {
				password: defaultPassword,
				users: demoUsers.map((u) => ({ email: u.email, role: u.role }))
			}
		});
	} catch (error) {
		console.error('Seed Demo Users Error:', error);
		return json({ error: 'Failed to create demo users.' }, { status: 500 });
	}
};
