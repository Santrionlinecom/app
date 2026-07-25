import assert from 'node:assert/strict';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import test from 'node:test';
import {
	countActiveActivations,
	getActivation,
	getFeaturesForLicense,
	getLicenseByKeyHash,
	getMaxDevicesForLicense,
	getPlanForLicense,
	hashLicenseKey,
	isLicenseExpired,
	normalizeLicenseKeyInput,
	upsertActivation,
	deactivateActivation,
	touchActivation
} from './digital-products.ts';
import {
	reactivateLicense,
	resetLicenseDevices,
	revokeLicense,
	setLicenseExpiry
} from './admin.ts';
import { parseLicenseApiBody } from './request.ts';

type Row = Record<string, unknown>;

class MemoryStatement {
	constructor(
		private readonly db: MemoryD1,
		private readonly sql: string
	) {}

	bind(...params: unknown[]) {
		this.params = params;
		return this;
	}

	private params: unknown[] = [];

	async first<T>() {
		const rows = this.db.query(this.sql, this.params);
		return (rows[0] as T) ?? null;
	}

	async all<T>() {
		return { results: this.db.query(this.sql, this.params) as T[] };
	}

	async run() {
		return this.db.execute(this.sql, this.params);
	}
}

class MemoryD1 {
	products = new Map<string, Row>();
	licenses = new Map<string, Row>();
	activations = new Map<string, Row>();

	prepare(sql: string) {
		return new MemoryStatement(this, sql);
	}

	query(sql: string, params: unknown[]): Row[] {
		const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();

		if (normalized.includes('from licenses l') && normalized.includes('where l.license_key_hash = ?')) {
			const [hash, productSlug] = params as [string, string?];
			for (const license of this.licenses.values()) {
				if (license.license_key_hash !== hash) continue;
				const product = license.product_id
					? this.products.get(String(license.product_id))
					: null;
				if (productSlug && product?.slug !== productSlug) continue;
				return [
					{
						licenseId: license.license_key,
						userId: license.user_id,
						userEmail: license.user_email,
						legacyPlan: license.plan,
						status: license.status,
						deviceLimit: license.device_limit,
						maxDevices: license.max_devices,
						expiresAt: license.expires_at,
						productId: license.product_id,
						licenseFeaturesJson: license.features_json,
						createdAt: license.created_at,
						updatedAt: license.updated_at,
						productSlug: product?.slug ?? null,
						productName: product?.name ?? null,
						productPlan: product?.plan ?? null,
						productStatus: product?.status ?? null,
						defaultMaxDevices: product?.default_max_devices ?? null,
						productFeaturesJson: product?.features_json ?? null
					}
				];
			}
			return [];
		}

		if (normalized.includes('from license_activations') && normalized.includes('device_hash = ?')) {
			const [licenseId, deviceHash] = params as [string, string];
			const row = [...this.activations.values()].find(
				(item) => item.license_id === licenseId && item.device_hash === deviceHash
			);
			if (!row) return [];
			return [
				{
					id: row.id,
					licenseId: row.license_id,
					deviceHash: row.device_hash,
					deviceName: row.device_name,
					status: row.status,
					activatedAt: row.activated_at,
					lastSeenAt: row.last_seen_at,
					deactivatedAt: row.deactivated_at
				}
			];
		}

		if (normalized.includes('count(*) as total') && normalized.includes("status = 'active'")) {
			const [licenseId] = params as [string];
			const total = [...this.activations.values()].filter(
				(item) => item.license_id === licenseId && item.status === 'active'
			).length;
			return [{ total }];
		}

		return [];
	}

	execute(sql: string, params: unknown[]) {
		const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();
		let changes = 0;

		if (normalized.startsWith('insert into license_activations')) {
			const [id, licenseId, deviceHash, deviceName, activatedAt, lastSeenAt, metadataJson] =
				params as [string, string, string, string | null, number, number, string | null];
			const existingKey = [...this.activations.entries()].find(
				([, row]) => row.license_id === licenseId && row.device_hash === deviceHash
			)?.[0];
			if (existingKey) {
				const current = this.activations.get(existingKey)!;
				this.activations.set(existingKey, {
					...current,
					device_name: deviceName ?? current.device_name,
					status: 'active',
					last_seen_at: lastSeenAt,
					deactivated_at: null,
					metadata_json: metadataJson ?? current.metadata_json
				});
			} else {
				this.activations.set(id, {
					id,
					license_id: licenseId,
					device_hash: deviceHash,
					device_name: deviceName,
					status: 'active',
					activated_at: activatedAt,
					last_seen_at: lastSeenAt,
					deactivated_at: null,
					metadata_json: metadataJson
				});
			}
			changes = 1;
		} else if (normalized.startsWith('update license_activations') && normalized.includes("status = 'deactivated'")) {
			if (normalized.includes('device_hash = ?')) {
				const [deactivatedAt, lastSeenAt, licenseId, deviceHash] = params as [
					number,
					number,
					string,
					string
				];
				for (const [key, row] of this.activations) {
					if (row.license_id === licenseId && row.device_hash === deviceHash && row.status === 'active') {
						this.activations.set(key, {
							...row,
							status: 'deactivated',
							deactivated_at: deactivatedAt,
							last_seen_at: lastSeenAt
						});
						changes += 1;
					}
				}
			} else {
				const [deactivatedAt, lastSeenAt, licenseId] = params as [number, number, string];
				for (const [key, row] of this.activations) {
					if (row.license_id === licenseId && row.status === 'active') {
						this.activations.set(key, {
							...row,
							status: 'deactivated',
							deactivated_at: deactivatedAt,
							last_seen_at: lastSeenAt
						});
						changes += 1;
					}
				}
			}
		} else if (normalized.startsWith('update license_activations') && normalized.includes('last_seen_at = ?')) {
			const [lastSeenAt, deviceName, licenseId, deviceHash] = params as [
				number,
				string | null,
				string,
				string
			];
			for (const [key, row] of this.activations) {
				if (row.license_id === licenseId && row.device_hash === deviceHash && row.status === 'active') {
					this.activations.set(key, {
						...row,
						last_seen_at: lastSeenAt,
						device_name: deviceName ?? row.device_name
					});
					changes += 1;
				}
			}
		} else if (normalized.startsWith('update licenses')) {
			const licenseId = String(params[params.length - 1]);
			const current = this.licenses.get(licenseId);
			if (current) {
				if (normalized.includes("set status = 'revoked'")) {
					current.status = 'revoked';
					current.updated_at = params[0];
				} else if (normalized.includes("set status = 'active'") && !normalized.includes('expires_at')) {
					current.status = 'active';
					current.updated_at = params[0];
				} else if (normalized.includes("set status = 'expired'")) {
					current.status = 'expired';
					current.updated_at = params[0];
				} else if (normalized.includes('expires_at = ?')) {
					const expiresAt = params[0] as number | null;
					const now = params[1] as number;
					current.expires_at = expiresAt;
					current.updated_at = now;
					if (current.status !== 'revoked' && expiresAt && expiresAt > 0 && expiresAt < now) {
						current.status = 'expired';
					} else if (current.status !== 'revoked') {
						current.status = 'active';
					}
				} else if (normalized.includes('updated_at = ?')) {
					current.updated_at = params[0];
				}
				this.licenses.set(licenseId, current);
				changes = 1;
			}
		}

		return { meta: { changes } };
	}
}

const hmacHex = (key: string, secret: string) =>
	createHmac('sha256', secret).update(normalizeLicenseKeyInput(key)).digest('hex');

const sha256Hex = (key: string) => createHash('sha256').update(normalizeLicenseKeyInput(key)).digest('hex');

test('hashLicenseKey prefers HMAC when secret provided', async () => {
	const key = 'SP-PRO-AAAA-BBBB-CCCC';
	const secret = 'unit-test-secret';
	assert.equal(await hashLicenseKey(key, secret), hmacHex(key, secret));
	assert.equal(await hashLicenseKey(key, null), sha256Hex(key));
});

test('parseLicenseApiBody accepts camelCase and snake_case', async () => {
	const request = new Request('https://example.test', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			license_key: 'ABC',
			device_hash: 'device12345',
			product_slug: 'santriprint-pro',
			device_name: 'Dell',
			app_version: '1.0.0'
		})
	});
	const parsed = await parseLicenseApiBody(request);
	assert.equal(parsed.licenseKey, 'ABC');
	assert.equal(parsed.deviceHash, 'device12345');
	assert.equal(parsed.productSlug, 'santriprint-pro');
	assert.equal(parsed.deviceName, 'Dell');
	assert.equal(parsed.appVersion, '1.0.0');
});

test('license lifecycle: activate → verify → device limit → deactivate → revoke → expired → reset', async () => {
	const memory = new MemoryD1();
	const db = memory as unknown as import('@cloudflare/workers-types').D1Database;
	const now = Date.now();
	const secret = 'unit-test-secret';
	const productId = 'prod_santriprint_pro';
	const licenseId = `lic_${randomUUID()}`;
	const licenseKey = 'SP-PRO-TEST-KEY1-KEY2';
	const hash = await hashLicenseKey(licenseKey, secret);

	memory.products.set(productId, {
		id: productId,
		slug: 'santriprint-pro',
		name: 'SantriPrint Pro',
		plan: 'pro',
		status: 'active',
		default_max_devices: 1,
		features_json: '["print_layout","export_pdf"]'
	});

	memory.licenses.set(licenseId, {
		license_key: licenseId,
		user_id: null,
		user_email: 'buyer@example.com',
		plan: 'pro',
		status: 'active',
		device_limit: 1,
		max_devices: 1,
		expires_at: null,
		product_id: productId,
		license_key_hash: hash,
		features_json: null,
		created_at: now,
		updated_at: now,
		activated_at: null,
		notes: null
	});

	// Key plaintext must not be the primary stored identity for new keys.
	assert.notEqual(licenseId, licenseKey);
	assert.equal(memory.licenses.get(licenseId)?.license_key_hash, hash);

	const license = await getLicenseByKeyHash(db, hash, 'santriprint-pro');
	assert.ok(license);
	assert.equal(getPlanForLicense(license!), 'pro');
	assert.deepEqual(getFeaturesForLicense(license!), ['print_layout', 'export_pdf']);
	assert.equal(getMaxDevicesForLicense(license!), 1);
	assert.equal(isLicenseExpired(license!), false);

	await upsertActivation(db, {
		licenseId,
		deviceHash: 'device-one-hash',
		deviceName: 'Laptop A',
		now
	});
	assert.equal(await countActiveActivations(db, licenseId), 1);

	const activation = await getActivation(db, licenseId, 'device-one-hash');
	assert.equal(activation?.status, 'active');
	await touchActivation(db, { licenseId, deviceHash: 'device-one-hash', now: now + 1000 });

	// device limit
	const active = await countActiveActivations(db, licenseId);
	assert.equal(active >= getMaxDevicesForLicense(license!), true);

	await deactivateActivation(db, { licenseId, deviceHash: 'device-one-hash', now: now + 2000 });
	assert.equal(await countActiveActivations(db, licenseId), 0);

	// reactivate device slot after deactivate
	await upsertActivation(db, {
		licenseId,
		deviceHash: 'device-two-hash',
		deviceName: 'Laptop B',
		now: now + 3000
	});
	assert.equal(await countActiveActivations(db, licenseId), 1);

	assert.equal(await revokeLicense(db, licenseId, now + 4000), 1);
	assert.equal(memory.licenses.get(licenseId)?.status, 'revoked');

	// reset devices still clears activations
	assert.equal(await resetLicenseDevices(db, licenseId, now + 5000), 1);
	assert.equal(await countActiveActivations(db, licenseId), 0);

	// set expiry in the past marks expired when reactivated path checks
	memory.licenses.get(licenseId)!.status = 'active';
	assert.equal(await setLicenseExpiry(db, { licenseId, expiresAt: now - 1000, now: now + 6000 }), 1);
	assert.equal(memory.licenses.get(licenseId)?.status, 'expired');
	assert.equal(isLicenseExpired({ expiresAt: now - 1000 }, now + 6000), true);

	// reactivate blocked when expired
	assert.equal(await reactivateLicense(db, licenseId, now + 7000), 0);
});
