import assert from 'node:assert/strict';
import test from 'node:test';
import { getCoinTopupPackageById, getCoinTopupPackages } from './coin-packages.ts';

const expected = [
	['santri_starter', 'Santri Starter', 10_000, 1_000, 0],
	['santri_plus', 'Santri Plus', 25_000, 2_700, 200],
	['santri_pro', 'Santri Pro', 50_000, 5_500, 500],
	['santri_premium', 'Santri Premium', 100_000, 12_000, 2_000],
	['santri_ultimate', 'Santri Ultimate', 250_000, 35_714, 10_714]
] as const;

test('server exposes exactly the five authoritative Santri topup packages', () => {
	const packages = getCoinTopupPackages();
	assert.equal(packages.length, 5);
	assert.deepEqual(
		packages.map((pkg) => [pkg.id, pkg.name, pkg.amountRupiah, pkg.coinAmount, pkg.bonusCoin]),
		expected
	);
});

test('effective price and savings are derived from the server package values', () => {
	const packages = getCoinTopupPackages();
	const ultimate = packages.find((pkg) => pkg.id === 'santri_ultimate');
	assert.ok(ultimate);
	assert.equal(ultimate.baseCoin, 25_000);
	assert.ok(Math.abs(ultimate.effectiveRupiahPerCoin - 7) < 0.001);
	assert.ok(Math.abs(ultimate.savingsPercent - 30) < 0.01);
	assert.equal(ultimate.badge, 'PALING HEMAT');
});

test('legacy and manipulated package identifiers are rejected', () => {
	for (const id of ['paket-hemat', 'paket-rutin', 'pembaca-aktif', 'paket-keluarga', 'paket-sultan']) {
		assert.equal(getCoinTopupPackageById(id), null);
	}
	assert.equal(getCoinTopupPackageById('santri_ultimate')?.coinAmount, 35_714);
});
