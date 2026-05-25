import type { D1Database } from '@cloudflare/workers-types';

export const MIDTRANS_SNAP_TRANSACTION_URL = 'https://app.midtrans.com/snap/v1/transactions';
export const MIDTRANS_ORDER_ID_PATTERN = /^[A-Za-z0-9._~-]+$/;
const RANDOM_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MAX_MIDTRANS_ORDER_ID_LENGTH = 49;

const random4 = () => {
	const bytes = new Uint8Array(4);
	crypto.getRandomValues(bytes);
	return [...bytes].map((byte) => RANDOM_CHARS[byte % RANDOM_CHARS.length]).join('');
};

export const createMidtransOrderId = () => {
	const orderId = `SOA-${Date.now()}-${random4()}`;

	if (orderId.length > MAX_MIDTRANS_ORDER_ID_LENGTH || !MIDTRANS_ORDER_ID_PATTERN.test(orderId)) {
		throw new Error('Generated Midtrans order_id is invalid');
	}

	return orderId;
};

export const createMidtransAuthorization = (serverKey: string) => `Basic ${btoa(`${serverKey}:`)}`;

export const ensurePaymentOrdersSchema = async (db: D1Database) => {
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS payment_orders (
				id TEXT PRIMARY KEY,
				provider TEXT NOT NULL DEFAULT 'midtrans',
				purpose TEXT NOT NULL,
				user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
				lembaga_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
				product_slug TEXT NOT NULL,
				package_name TEXT,
				gross_amount INTEGER NOT NULL DEFAULT 0,
				currency TEXT NOT NULL DEFAULT 'IDR',
				status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sukses','gagal','expired','canceled','denied','refunded')),
				provider_status TEXT,
				provider_token TEXT,
				metadata TEXT,
				created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
				updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
			)`
		)
		.run();

	await db
		.prepare('CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id, created_at DESC)')
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(provider, status, created_at DESC)'
		)
		.run();
	await db
		.prepare(
			'CREATE INDEX IF NOT EXISTS idx_payment_orders_lembaga ON payment_orders(lembaga_id, created_at DESC)'
		)
		.run();
};
