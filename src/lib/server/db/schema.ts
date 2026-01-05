import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	username: text('username'),
	email: text('email').notNull(),
	passwordHash: text('password_hash'),
	gender: text('gender'),
	whatsapp: text('whatsapp'),
	balance: integer('balance').notNull().default(0),
	role: text('role', {
		enum: ['ustadz', 'admin', 'santri', 'ustadzah', 'jamaah', 'tamir', 'bendahara', 'alumni', 'SUPER_ADMIN']
	})
		.notNull()
		.default('ustadz'),
	workStatus: text('work_status', { enum: ['freelance', 'owner', 'employee'] }),
	expertise: text('expertise'),
	orgId: text('org_id'),
	orgStatus: text('org_status').notNull().default('active'),
	googleId: text('googleId'),
	createdAt: integer('created_at').notNull()
});
