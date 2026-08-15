import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const routePath = new URL('../../../../routes/digital-store/[slug]/+page.server.ts', import.meta.url);
const pagePath = new URL('../../../../routes/digital-store/[slug]/+page.svelte', import.meta.url);
const commercePath = new URL('./commerce.ts', import.meta.url);
const orderRoutePath = new URL('../../../../routes/digital-store/order/[reference]/+page.server.ts', import.meta.url);
const orderPagePath = new URL('../../../../routes/digital-store/order/[reference]/+page.svelte', import.meta.url);
const downloadRoutePath = new URL('../../../../routes/digital-store/order/[reference]/download/+server.ts', import.meta.url);
const walletPath = new URL('../buku/wallet.ts', import.meta.url);
const schemaPath = new URL('../../../../../schema.sql', import.meta.url);

test('digital store route uses canonical atomic coin checkout and requires an idempotency key', async () => {
	const [route, page, commerce] = await Promise.all([
		readFile(routePath, 'utf8'),
		readFile(pagePath, 'utf8'),
		readFile(commercePath, 'utf8')
	]);

	assert.match(route, /checkoutDigitalProductWithCoins/);
	assert.doesNotMatch(route, /deductCoins/);
	assert.doesNotMatch(route, /INSERT INTO digital_sales/);
	assert.match(route, /formData\.get\('purchaseKey'\)/);
	assert.match(page, /name="purchaseKey"/);
	assert.match(commerce, /buyer_user_id TEXT/);
	assert.match(commerce, /purchase_key TEXT UNIQUE/);
});

test('digital tool without an installer is rejected before wallet checkout', async () => {
	const route = await readFile(routePath, 'utf8');
	const artifactGuard = route.indexOf('product.fileAvailable');
	const checkoutCall = route.indexOf('checkoutDigitalProductWithCoins({');
	assert.ok(artifactGuard > 0, 'route must validate the product artifact');
	assert.ok(artifactGuard < checkoutCall, 'artifact validation must happen before wallet debit');
});

test('paid or non-manual orders are rejected before any proof upload side effect', async () => {
	const [route, page] = await Promise.all([
		readFile(orderRoutePath, 'utf8'),
		readFile(orderPagePath, 'utf8')
	]);
	const guardIndex = route.indexOf("order.paymentMethodType !== 'manual' || order.status !== 'pending'");
	const uploadIndex = route.indexOf('await uploadDigitalPaymentProof');
	assert.ok(guardIndex > 0, 'server route must contain an immutable manual-pending guard');
	assert.ok(guardIndex < uploadIndex, 'guard must execute before R2 upload');
	assert.match(page, /paymentMethodType === 'manual'.*status === 'pending'/s);
});

test('fresh and runtime wallet schemas both allow canonical purchase ledger entries', async () => {
	const [wallet, schema] = await Promise.all([
		readFile(walletPath, 'utf8'),
		readFile(schemaPath, 'utf8')
	]);
	assert.match(wallet, /COIN_TRANSACTION_TYPES[^;]*'purchase'/s);
	assert.match(wallet, /CHECK \(type IN \([^)]*'purchase'/s);
	assert.match(schema, /CREATE TABLE IF NOT EXISTS coin_transactions[\s\S]*?CHECK \(type IN \([^)]*'purchase'/);
});



test('order bearer token stays in an HttpOnly cookie and sensitive responses suppress referrers', async () => {
	const [checkout, orderRoute, orderPage, downloadRoute] = await Promise.all([readFile(routePath, 'utf8'), readFile(orderRoutePath, 'utf8'), readFile(orderPagePath, 'utf8'), readFile(downloadRoutePath, 'utf8')]);
	assert.match(checkout, /cookies\.set\('digital_order_access'/);
	assert.doesNotMatch(checkout, /\?token=/);
	assert.match(orderRoute, /cookies\.get\('digital_order_access'\)/);
	assert.match(downloadRoute, /cookies\.get\('digital_order_access'\)/);
	assert.doesNotMatch(orderRoute, /searchParams\.get\('token'\)|formData\.get\('token'\)|\?token=/);
	assert.doesNotMatch(downloadRoute, /searchParams\.get\('token'\)/);
	assert.doesNotMatch(orderPage, /data\.token|name="token"|\?token=/);
	assert.match(orderRoute, /Referrer-Policy[^\n]*no-referrer/i);
	assert.match(downloadRoute, /referrer-policy[^\n]*no-referrer/i);
});

test('Bantuan order page exposes its support fulfillment status', async () => {
	const [commerce, orderPage] = await Promise.all([readFile(commercePath, 'utf8'), readFile(orderPagePath, 'utf8')]);
	assert.match(commerce, /supportStatus/);
	assert.match(orderPage, /supportStatus/);
});

test('successful Coin checkout queues buyer email after fulfillment without affecting redirect', async () => {
	const route = await readFile(routePath, 'utf8');
	const checkoutIndex = route.indexOf('await checkoutDigitalProductWithCoins({');
	const emailIndex = route.indexOf('queueDigitalPurchaseEmail({');
	const redirectIndex = route.indexOf('throw redirect(303');
	assert.ok(checkoutIndex > 0);
	assert.ok(emailIndex > checkoutIndex, 'email must be downstream of authoritative paid checkout and fulfillment');
	assert.ok(redirectIndex > emailIndex, 'provider work must not control the successful redirect');
	assert.match(route, /userId: locals\.user\.id/);
	assert.match(route, /platform\?\.context\?\.waitUntil/);
	assert.match(route, /licensePackage: product\.licensePackage/);
	assert.doesNotMatch(route.slice(emailIndex, redirectIndex), /buyerContact/);
});
