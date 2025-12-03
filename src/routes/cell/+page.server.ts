import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { D1Database } from '@cloudflare/workers-types';

type TransactionRow = {
	id: string;
	productType: 'pulsa' | 'data' | 'pln';
	destinationNumber: string;
	amount: number;
	status: 'pending' | 'success' | 'failed';
	createdAt: number;
};

const ensureCellSchema = async (db: D1Database) => {
	const info = await db.prepare(`PRAGMA table_info('users')`).all<{ name: string }>();
	const hasBalance = (info?.results ?? []).some((col) => col.name === 'balance');

	if (!hasBalance) {
		try {
			await db.prepare('ALTER TABLE users ADD COLUMN balance INTEGER NOT NULL DEFAULT 0').run();
		} catch (err: any) {
			const message = `${err?.message ?? ''}`;
			if (!message.includes('duplicate column name')) {
				throw err;
			}
		}
	}

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_type TEXT NOT NULL,
        destination_number TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending','success','failed')),
        created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
      )`
		)
		.run();

	await db.prepare('CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, created_at)').run();
};

const getBalance = async (db: D1Database, userId: string) => {
	const row =
		(await db
			.prepare('SELECT balance FROM users WHERE id = ?')
			.bind(userId)
			.first<{ balance: number | null }>()) ?? null;
	return row?.balance ?? 0;
};

const getRecentTransactions = async (db: D1Database, userId: string, limit = 5) => {
	const { results } =
		(await db
			.prepare(
				`SELECT id, product_type as productType, destination_number as destinationNumber, amount, status, created_at as createdAt
         FROM transactions
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ?`
			)
			.bind(userId, limit)
			.all<TransactionRow>()) ?? {};
	return (results ?? []) as TransactionRow[];
};

const sanitizeDestination = (value: string) => value.replace(/\D/g, '').trim();

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	const db = locals.db;
	if (!db) {
		return {
			balance: 0,
			transactions: [],
			userDisplayName: locals.user.username ?? locals.user.email ?? 'Santri'
		};
	}

	await ensureCellSchema(db);

	return {
		balance: await getBalance(db, locals.user.id),
		transactions: await getRecentTransactions(db, locals.user.id),
		userDisplayName: locals.user.username ?? locals.user.email ?? 'Santri'
	};
};

export const actions: Actions = {
	purchase: async ({ request, locals, fetch }) => {
		if (!locals.user) return fail(401, { message: 'Silakan login dulu.' });
		const db = locals.db;
		if (!db) return fail(500, { message: 'Database tidak tersedia.' });

		await ensureCellSchema(db);

		const form = await request.formData();
		const productType = form.get('productType');
		const destination = form.get('destination');
		const amount = form.get('amount');

		if (typeof productType !== 'string' || typeof destination !== 'string' || typeof amount !== 'string') {
			return fail(400, { message: 'Data tidak lengkap.' });
		}

		const normalizedProduct: TransactionRow['productType'] =
			productType === 'data' ? 'data' : productType === 'pln' ? 'pln' : 'pulsa';

		const sanitizedDestination = sanitizeDestination(destination);
		if (!/^\d{8,16}$/.test(sanitizedDestination)) {
			return fail(400, { message: 'Nomor tujuan harus 8-16 digit angka.' });
		}

		const nominal = Number(amount);
		if (!Number.isFinite(nominal) || nominal <= 0) {
			return fail(400, { message: 'Nominal tidak valid.' });
		}
		const amountValue = Math.round(nominal);

		const balance = await getBalance(db, locals.user.id);
		if (balance < amountValue) {
			return fail(400, { message: 'Saldo tidak mencukupi.' });
		}

		const txId = crypto.randomUUID();
		const now = Date.now();

		await db
			.prepare(
				`INSERT INTO transactions (id, user_id, product_type, destination_number, amount, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(txId, locals.user.id, normalizedProduct, sanitizedDestination, amountValue, 'pending', now)
			.run();

		await db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').bind(amountValue, locals.user.id).run();

		let status: TransactionRow['status'] = 'success';
		try {
			const response = await fetch('https://postman-echo.com/post', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: locals.user.id,
					productType: normalizedProduct,
					destination: sanitizedDestination,
					amount: amountValue,
					transactionId: txId
				})
			});
			if (!response.ok) {
				status = 'failed';
			}
		} catch (err) {
			status = 'failed';
		}

		if (status === 'failed') {
			await db.prepare('UPDATE transactions SET status = ? WHERE id = ?').bind('failed', txId).run();
			await db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').bind(amountValue, locals.user.id).run();
			return fail(502, { message: 'Transaksi gagal diproses, saldo sudah dikembalikan.' });
		}

		await db.prepare('UPDATE transactions SET status = ? WHERE id = ?').bind('success', txId).run();

		return {
			success: true,
			txId,
			status: 'success' as const
		};
	}
};
