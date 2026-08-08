import { getCoinTopupPackageById } from '$lib/server/coin-packages';

// Immutable server-authored snapshots for Midtrans orders created before the package-ID cutover.
// Accepted only by webhook validation, never by the order-creation endpoint.
const HISTORICAL_PACKAGE_SNAPSHOTS: Record<string, { amountRupiah: number; coinAmount: number }> = {
	'paket-hemat': { amountRupiah: 10_000, coinAmount: 1_000 },
	'paket-rutin': { amountRupiah: 25_000, coinAmount: 2_700 },
	'pembaca-aktif': { amountRupiah: 50_000, coinAmount: 5_500 },
	'paket-keluarga': { amountRupiah: 100_000, coinAmount: 12_000 }
};

type StoredCoinTopupPackageInput = {
	packageId: string;
	paymentGrossAmount: number;
	topupAmountRupiah: number;
	topupCoinAmount: number;
};

export type StoredCoinTopupPackageValidation =
	| { ok: true; packageId: string; coinAmount: number }
	| { ok: false; reason: 'unknown_package' | 'package_mismatch' };

export const validateStoredCoinTopupPackage = ({
	packageId,
	paymentGrossAmount,
	topupAmountRupiah,
	topupCoinAmount
}: StoredCoinTopupPackageInput): StoredCoinTopupPackageValidation => {
	const current = getCoinTopupPackageById(packageId);
	const pkg = current ?? HISTORICAL_PACKAGE_SNAPSHOTS[packageId];
	if (!pkg) return { ok: false, reason: 'unknown_package' };
	if (
		pkg.amountRupiah !== paymentGrossAmount ||
		pkg.amountRupiah !== topupAmountRupiah ||
		pkg.coinAmount !== topupCoinAmount
	) {
		return { ok: false, reason: 'package_mismatch' };
	}
	return { ok: true, packageId, coinAmount: pkg.coinAmount };
};
