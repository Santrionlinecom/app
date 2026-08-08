import assert from 'node:assert/strict';
import test from 'node:test';
import { validateStoredCoinTopupPackage } from './coin-topup-validation.ts';

test('stored topup must match the authoritative server package', () => {
	assert.deepEqual(
		validateStoredCoinTopupPackage({
			packageId: 'santri_ultimate',
			paymentGrossAmount: 250_000,
			topupAmountRupiah: 250_000,
			topupCoinAmount: 35_714
		}),
		{ ok: true, packageId: 'santri_ultimate', coinAmount: 35_714 }
	);
});

test('historical server-authored package snapshots remain settleable during cutover', () => {
	assert.deepEqual(
		validateStoredCoinTopupPackage({
			packageId: 'paket-hemat',
			paymentGrossAmount: 10_000,
			topupAmountRupiah: 10_000,
			topupCoinAmount: 1_000
		}),
		{ ok: true, packageId: 'paket-hemat', coinAmount: 1_000 }
	);
	assert.deepEqual(
		validateStoredCoinTopupPackage({
			packageId: 'legacy-package',
			paymentGrossAmount: 10_000,
			topupAmountRupiah: 10_000,
			topupCoinAmount: 1_000
		}),
		{ ok: false, reason: 'unknown_package' }
	);
});

test('tampered amount or coin values fail closed', () => {
	assert.deepEqual(
		validateStoredCoinTopupPackage({
			packageId: 'santri_starter',
			paymentGrossAmount: 10_000,
			topupAmountRupiah: 10_000,
			topupCoinAmount: 35_714
		}),
		{ ok: false, reason: 'package_mismatch' }
	);
});
