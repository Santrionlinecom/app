import type { D1Database } from '@cloudflare/workers-types';

export type DigitalCoinCheckoutResult =
	| {
			status: 'purchased' | 'already_purchased';
			orderId: string;
			referenceCode: string;
			accessToken: string;
			balanceAfter: number;
	  }
	| { status: 'insufficient_coin'; balance: number; required: number };

type DigitalCoinCheckoutInput = {
	db: D1Database;
	userId: string;
	productId: string;
	productTitle: string;
	coinAmount: number;
	buyerName: string;
	buyerContact: string;
	purchaseKey: string;
	nowMs?: number;
};

type SaleIdentity = {
	id: string;
	referenceCode: string;
	accessToken: string;
};

const checkoutTokenPattern = /^[A-Za-z0-9:_-]{16,128}$/;

const readBalance = async (db: D1Database, userId: string) => {
	const wallet = await db
		.prepare('SELECT balance FROM coin_wallets WHERE user_id = ?')
		.bind(userId)
		.first<{ balance: number }>();
	return Number(wallet?.balance ?? 0);
};

const readSaleByPurchaseKey = async (
	db: D1Database,
	purchaseKey: string,
	userId: string,
	productId: string
) =>
	db
		.prepare(
			`SELECT id, reference_code AS referenceCode, access_token AS accessToken
			 FROM digital_product_sales
			 WHERE purchase_key = ? AND buyer_user_id = ? AND product_id = ?
			 LIMIT 1`
		)
		.bind(purchaseKey, userId, productId)
		.first<SaleIdentity>();

export async function checkoutDigitalProductWithCoins(
	input: DigitalCoinCheckoutInput
): Promise<DigitalCoinCheckoutResult> {
	const coinAmount = Math.trunc(Number(input.coinAmount));
	if (!Number.isSafeInteger(coinAmount) || coinAmount <= 0) {
		throw new Error('Harga coin tidak valid.');
	}
	if (!checkoutTokenPattern.test(input.purchaseKey)) {
		throw new Error('Kunci checkout tidak valid.');
	}

	await input.db
		.prepare('INSERT OR IGNORE INTO coin_wallets (user_id) VALUES (?)')
		.bind(input.userId)
		.run();

	const existing = await readSaleByPurchaseKey(
		input.db,
		input.purchaseKey,
		input.userId,
		input.productId
	);
	if (existing) {
		return {
			status: 'already_purchased',
			orderId: existing.id,
			referenceCode: existing.referenceCode,
			accessToken: existing.accessToken,
			balanceAfter: await readBalance(input.db, input.userId)
		};
	}

	const orderId = crypto.randomUUID();
	const referenceCode = `SO-COIN-${orderId.replace(/-/g, '').slice(0, 12).toUpperCase()}`;
	const accessToken = `${crypto.randomUUID()}${crypto.randomUUID().replace(/-/g, '')}`;
	const ledgerId = `digital-sale:${orderId}`;
	const nowMs = input.nowMs ?? Date.now();
	const nowIso = new Date(nowMs).toISOString();

	const results = await input.db.batch([
		input.db
			.prepare(
				`INSERT OR IGNORE INTO digital_product_sales (
					id, product_id, buyer_user_id, buyer_name, buyer_contact, amount,
					reference_code, payment_method_id, payment_method_name, status,
					access_token, purchase_key, paid_at, created_at, updated_at
				)
				SELECT ?, ?, ?, ?, ?, ?, ?, NULL, 'Coin SantriOnline', 'paid', ?, ?, ?, ?, ?
				WHERE EXISTS (
					SELECT 1 FROM coin_wallets WHERE user_id = ? AND balance >= ?
				)
				  AND NOT EXISTS (
					SELECT 1 FROM digital_product_sales WHERE purchase_key = ?
				  )`
			)
			.bind(
				orderId,
				input.productId,
				input.userId,
				input.buyerName.trim(),
				input.buyerContact.trim(),
				coinAmount,
				referenceCode,
				accessToken,
				input.purchaseKey,
				nowMs,
				nowMs,
				nowMs,
				input.userId,
				coinAmount,
				input.purchaseKey
			),
		input.db
			.prepare(
				`UPDATE coin_wallets
				 SET balance = balance - ?, updated_at = ?
				 WHERE user_id = ?
				   AND balance >= ?
				   AND EXISTS (SELECT 1 FROM digital_product_sales WHERE id = ?)`
			)
			.bind(coinAmount, nowIso, input.userId, coinAmount, orderId),
		input.db
			.prepare(
				`INSERT INTO coin_transactions (
					id, user_id, type, amount, balance_after, description,
					reference_type, reference_id, created_at
				)
				SELECT ?, ?, 'purchase', ?, balance, ?, 'digital_product', ?, ?
				FROM coin_wallets
				WHERE user_id = ?
				  AND EXISTS (SELECT 1 FROM digital_product_sales WHERE id = ?)`
			)
			.bind(
				ledgerId,
				input.userId,
				-coinAmount,
				`Pembelian ${input.productTitle}`,
				orderId,
				nowIso,
				input.userId,
				orderId
			)
	]);

	if (Number(results[0]?.meta?.changes ?? 0) === 1) {
		return {
			status: 'purchased',
			orderId,
			referenceCode,
			accessToken,
			balanceAfter: await readBalance(input.db, input.userId)
		};
	}

	const replayed = await readSaleByPurchaseKey(
		input.db,
		input.purchaseKey,
		input.userId,
		input.productId
	);
	if (replayed) {
		return {
			status: 'already_purchased',
			orderId: replayed.id,
			referenceCode: replayed.referenceCode,
			accessToken: replayed.accessToken,
			balanceAfter: await readBalance(input.db, input.userId)
		};
	}

	return {
		status: 'insufficient_coin',
		balance: await readBalance(input.db, input.userId),
		required: coinAmount
	};
}
