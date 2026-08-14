import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { afterEach } from 'node:test';
import { Miniflare } from 'miniflare';
import { claimPaidDigitalOrderLicense, deriveOrderLicenseKey, refundPaidDigitalOrder } from './paid-entitlement.ts';
import { claimActivationSlot, getLicenseByKeyHash, hashLicenseKey } from './digital-products.ts';

const instances: Miniflare[] = [];
const secret = 'synthetic-test-secret';

const executeSql = async (db: { prepare(sql: string): { run(): Promise<unknown> } }, sql: string) => {
	const withoutComments = sql.replace(/^\s*--.*$/gm, '');
	for (const statement of withoutComments.split(';').map((part) => part.trim()).filter(Boolean)) await db.prepare(statement).run();
};

const createDb = async () => {
	const mf = new Miniflare({ modules: true, script: 'export default {}', d1Databases: ['DB'] });
	instances.push(mf);
	const db = await mf.getD1Database('DB');
	await executeSql(db, `
		CREATE TABLE users (id TEXT PRIMARY KEY);
		CREATE TABLE products (
			id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
			plan TEXT NOT NULL CHECK (plan IN ('free', 'pro')), status TEXT NOT NULL,
			default_max_devices INTEGER NOT NULL, features_json TEXT NOT NULL,
			created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
		);
		CREATE TABLE digital_products (
			id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, summary TEXT,
			description TEXT, price INTEGER NOT NULL, cover_url TEXT, file_url TEXT, status TEXT NOT NULL,
			featured INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
			license_product_id TEXT REFERENCES products(id), license_package TEXT
		);
		CREATE TABLE digital_product_sales (
			id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES digital_products(id), buyer_user_id TEXT REFERENCES users(id),
			amount INTEGER NOT NULL, reference_code TEXT UNIQUE, status TEXT NOT NULL, access_token TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
		);
		CREATE TABLE licenses (
			license_key TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), user_email TEXT,
			plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'studio')), status TEXT NOT NULL,
			device_limit INTEGER NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER, notes TEXT,
			product_id TEXT REFERENCES products(id), license_key_hash TEXT UNIQUE, max_devices INTEGER,
			features_json TEXT, activated_at INTEGER, updated_at INTEGER, source_sale_id TEXT UNIQUE REFERENCES digital_product_sales(id), package_slug TEXT
		);
		CREATE TABLE license_activations (
			id TEXT PRIMARY KEY, license_id TEXT NOT NULL REFERENCES licenses(license_key), device_hash TEXT NOT NULL,
			device_name TEXT, status TEXT NOT NULL, activated_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL,
			deactivated_at INTEGER, metadata_json TEXT, UNIQUE (license_id, device_hash)
		);
		INSERT INTO users VALUES ('user-1'), ('user-2');
		INSERT INTO products VALUES ('prod_santriprint_pro', 'santriprint-pro', 'SantriPrint Pro 1.3.6', 'pro', 'active', 2, '["print_layout"]', 1, 1);
		INSERT INTO digital_products VALUES ('store-promo', 'SantriPrint Promo', 'santriprint-promo', NULL, NULL, 69000, NULL, 'r2://digital-products/santriprint/setup.exe', 'published', 1, 1, 1, 'prod_santriprint_pro', 'promo');
	`);
	return db;
};

const addSale = async (db: Awaited<ReturnType<typeof createDb>>, status = 'paid', id = 'sale-1', reference = 'ORDER-1', owner: string | null = 'user-1') => {
	await db.prepare(`INSERT INTO digital_product_sales (id, product_id, buyer_user_id, amount, reference_code, status, access_token, created_at, updated_at) VALUES (?, 'store-promo', ?, 69000, ?, ?, 'token-1', 1, 1)`).bind(id, owner, reference, status).run();
};

afterEach(async () => { await Promise.all(instances.splice(0).map((mf) => mf.dispose())); });

test('unpaid order cannot claim a license', async () => {
	const db = await createDb(); await addSale(db, 'pending');
	await assert.rejects(() => claimPaidDigitalOrderLicense({ db, referenceCode: 'ORDER-1', accessToken: 'token-1', userId: 'user-1', secret }), /belum lunas/i);
	assert.equal((await db.prepare('SELECT COUNT(*) total FROM licenses').first<{ total: number }>())?.total, 0);
});

test('paid package mapping creates an activatable deterministic license and replay is idempotent', async () => {
	const db = await createDb(); await addSale(db);
	const first = await claimPaidDigitalOrderLicense({ db, referenceCode: 'ORDER-1', accessToken: 'token-1', userId: 'user-1', secret, now: 1000 });
	const replay = await claimPaidDigitalOrderLicense({ db, referenceCode: 'ORDER-1', accessToken: 'token-1', userId: 'user-1', secret, now: 2000 });
	assert.deepEqual(replay, first);
	assert.equal(first.packageSlug, 'promo');
	assert.equal(first.productSlug, 'santriprint-pro');
	assert.equal(first.licenseKey, await deriveOrderLicenseKey('sale-1', secret));
	const active = await getLicenseByKeyHash(db, await hashLicenseKey(first.licenseKey, secret), 'santriprint-pro');
	assert.equal(active?.licenseId, first.licenseId);
	assert.equal(active?.userId, 'user-1');
	assert.equal(active?.status, 'active');
	assert.equal((await db.prepare('SELECT COUNT(*) total FROM licenses').first<{ total: number }>())?.total, 1);
});

test('access token and account ownership prevent entitlement theft', async () => {
	const db = await createDb(); await addSale(db);
	await assert.rejects(() => claimPaidDigitalOrderLicense({ db, referenceCode: 'ORDER-1', accessToken: 'wrong', userId: 'user-1', secret }), /tidak ditemukan/i);
	await claimPaidDigitalOrderLicense({ db, referenceCode: 'ORDER-1', accessToken: 'token-1', userId: 'user-1', secret });
	await assert.rejects(() => claimPaidDigitalOrderLicense({ db, referenceCode: 'ORDER-1', accessToken: 'token-1', userId: 'user-2', secret }), /dimiliki akun lain/i);
});

test('an unowned paid order is rejected and claim never establishes ownership', async () => {
	const db = await createDb(); await addSale(db, 'paid', 'sale-1', 'ORDER-1', null);
	await assert.rejects(() => claimPaidDigitalOrderLicense({ db, referenceCode: 'ORDER-1', accessToken: 'token-1', userId: 'user-1', secret }), /tidak memiliki pemilik/i);
	assert.deepEqual(await db.prepare(`SELECT buyer_user_id owner FROM digital_product_sales WHERE id = 'sale-1'`).first(), { owner: null });
	assert.equal((await db.prepare('SELECT COUNT(*) total FROM licenses').first<{ total: number }>())?.total, 0);
});

test('refund atomically revokes a sale license, deactivates devices, and replay is idempotent', async () => {
	const db = await createDb(); await addSale(db);
	const claimed = await claimPaidDigitalOrderLicense({ db, referenceCode: 'ORDER-1', accessToken: 'token-1', userId: 'user-1', secret });
	await db.prepare(`INSERT INTO license_activations VALUES ('act-1', ?, 'device-one', 'Laptop', 'active', 1, 1, NULL, NULL)`).bind(claimed.licenseId).run();
	assert.equal(await refundPaidDigitalOrder({ db, saleId: 'sale-1', now: 2000 }), 'refunded');
	assert.equal(await refundPaidDigitalOrder({ db, saleId: 'sale-1', now: 3000 }), 'already_refunded');
	assert.deepEqual(await db.prepare(`SELECT s.status saleStatus, l.status licenseStatus FROM digital_product_sales s JOIN licenses l ON l.source_sale_id = s.id WHERE s.id = 'sale-1'`).first(), { saleStatus: 'refunded', licenseStatus: 'revoked' });
	assert.deepEqual(await db.prepare(`SELECT status, deactivated_at deactivatedAt FROM license_activations WHERE id = 'act-1'`).first(), { status: 'deactivated', deactivatedAt: 2000 });
});

test('claim versus refund concurrency can never leave an active license on a refunded sale', async () => {
	const db = await createDb(); await addSale(db);
	await Promise.allSettled([
		claimPaidDigitalOrderLicense({ db, referenceCode: 'ORDER-1', accessToken: 'token-1', userId: 'user-1', secret }),
		refundPaidDigitalOrder({ db, saleId: 'sale-1', now: 2000 })
	]);
	const row = await db.prepare(`SELECT s.status saleStatus, l.status licenseStatus FROM digital_product_sales s LEFT JOIN licenses l ON l.source_sale_id = s.id WHERE s.id = 'sale-1'`).first<{ saleStatus: string; licenseStatus: string | null }>();
	assert.equal(row?.saleStatus, 'refunded');
	assert.notEqual(row?.licenseStatus, 'active');
});

test('concurrent claims and duplicate source_sale_id cannot issue two licenses', async () => {
	const db = await createDb(); await addSale(db);
	const results = await Promise.allSettled(['user-1', 'user-2'].map((userId) => claimPaidDigitalOrderLicense({ db, referenceCode: 'ORDER-1', accessToken: 'token-1', userId, secret })));
	assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
	assert.equal((await db.prepare('SELECT COUNT(*) total FROM licenses WHERE source_sale_id = ?').bind('sale-1').first<{ total: number }>())?.total, 1);
	await assert.rejects(() => db.prepare(`INSERT INTO licenses (license_key, user_id, plan, status, device_limit, created_at, source_sale_id) VALUES ('duplicate', 'user-1', 'pro', 'active', 1, 1, 'sale-1')`).run());
});

test('migration applies to the current pre-0059 schema and maps all three packages safely', async () => {
	const db = await createDb();
	// Recreate the pre-migration shape by using a separate database initialized from the committed schema subset.
	await executeSql(db, 'DROP TABLE licenses; DROP TABLE digital_product_sales; DROP TABLE digital_products;');
	await executeSql(db, `
		CREATE TABLE digital_products (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, summary TEXT, description TEXT, price INTEGER NOT NULL DEFAULT 0, cover_url TEXT, file_url TEXT, status TEXT NOT NULL, featured INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
		CREATE TABLE digital_product_sales (id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES digital_products(id), buyer_user_id TEXT REFERENCES users(id), amount INTEGER NOT NULL, reference_code TEXT UNIQUE, status TEXT NOT NULL, access_token TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
		CREATE TABLE digital_payment_methods (id TEXT PRIMARY KEY, is_active INTEGER NOT NULL);
		CREATE TABLE digital_product_payment_methods (product_id TEXT NOT NULL REFERENCES digital_products(id), payment_method_id TEXT NOT NULL REFERENCES digital_payment_methods(id), created_at INTEGER NOT NULL, PRIMARY KEY (product_id, payment_method_id));
		CREATE TABLE licenses (license_key TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), user_email TEXT, plan TEXT NOT NULL, status TEXT NOT NULL, device_limit INTEGER NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER, notes TEXT, product_id TEXT REFERENCES products(id), license_key_hash TEXT, max_devices INTEGER, features_json TEXT, activated_at INTEGER, updated_at INTEGER);
	`);
	const migration = await readFile(new URL('../../../../../../migrations/0059_santriprint_1_3_6_packages.sql', import.meta.url), 'utf8');
	await executeSql(db, migration);
	const rows = await db.prepare(`SELECT slug, license_package packageSlug, license_product_id productId FROM digital_products WHERE slug LIKE 'santriprint-%' ORDER BY slug`).all<{ slug: string; packageSlug: string; productId: string }>();
	assert.deepEqual(rows.results, [
		{ slug: 'santriprint-bantuan', packageSlug: 'bantuan', productId: 'prod_santriprint_pro' },
		{ slug: 'santriprint-pro', packageSlug: 'pro', productId: 'prod_santriprint_pro' },
		{ slug: 'santriprint-promo', packageSlug: 'promo', productId: 'prod_santriprint_pro' }
	]);
	const bantuan = await db.prepare(`SELECT summary, description FROM digital_products WHERE slug = 'santriprint-bantuan'`).first<{ summary: string; description: string }>();
	assert.match(`${bantuan?.summary} ${bantuan?.description}`, /instalasi|onboarding/i);
	assert.doesNotMatch(`${bantuan?.summary} ${bantuan?.description}`, /pengembangan|donasi/i);
});



test('atomic D1 activation slot allows at most two simultaneous new devices', async () => {
	const db = await createDb();
	await db.prepare(`INSERT INTO licenses (license_key, plan, status, device_limit, created_at, updated_at) VALUES ('license-race', 'pro', 'active', 2, 1, 1)`).run();
	const attempts = await Promise.all(['device-a', 'device-b', 'device-c'].map((deviceHash) => claimActivationSlot(db, { licenseId: 'license-race', deviceHash, maxDevices: 2, now: 1000 })));
	assert.equal(attempts.filter(Boolean).length, 2);
	assert.deepEqual(await db.prepare("SELECT COUNT(*) total FROM license_activations WHERE license_id = 'license-race' AND status = 'active'").first(), { total: 2 });
});
