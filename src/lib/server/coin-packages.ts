export type CoinTopupPackage = {
	id: string;
	name: string;
	icon: string;
	amountRupiah: number;
	baseCoin: number;
	coinAmount: number;
	bonusCoin: number;
	effectiveRupiahPerCoin: number;
	savingsPercent: number;
	badge: string | null;
	description: string;
	toolPurchaseHint: string;
};

const BASE_RUPIAH_PER_COIN = 10;
const TOOL_PRICE_COIN = 9_900;

const createPackage = (input: {
	id: string;
	name: string;
	icon: string;
	amountRupiah: number;
	coinAmount: number;
	badge?: string;
	description: string;
}): CoinTopupPackage => {
	const baseCoin = input.amountRupiah / BASE_RUPIAH_PER_COIN;
	const bonusCoin = input.coinAmount - baseCoin;
	const effectiveRupiahPerCoin = input.amountRupiah / input.coinAmount;
	const savingsPercent = (1 - effectiveRupiahPerCoin / BASE_RUPIAH_PER_COIN) * 100;
	const tools = Math.floor(input.coinAmount / TOOL_PRICE_COIN);
	const remainder = input.coinAmount - tools * TOOL_PRICE_COIN;

	return Object.freeze({
		...input,
		baseCoin,
		bonusCoin,
		effectiveRupiahPerCoin,
		savingsPercent,
		badge: input.badge ?? null,
		toolPurchaseHint:
			tools === 0
				? 'Belum cukup untuk membeli 1 Tools seharga 9.900 coin.'
				: `Bisa membeli ${tools} Tools @9.900 coin, sisa ${remainder.toLocaleString('id-ID')} coin.`
	});
};

const coinTopupPackages: readonly CoinTopupPackage[] = Object.freeze([
	createPackage({
		id: 'santri_starter',
		name: 'Santri Starter',
		icon: '🌱',
		amountRupiah: 10_000,
		coinAmount: 1_000,
		description: 'Paket awal untuk mencoba konten dan layanan SantriOnline.'
	}),
	createPackage({
		id: 'santri_plus',
		name: 'Santri Plus',
		icon: '📚',
		amountRupiah: 25_000,
		coinAmount: 2_700,
		description: 'Lebih hemat untuk penggunaan rutin.'
	}),
	createPackage({
		id: 'santri_pro',
		name: 'Santri Pro',
		icon: '⭐',
		amountRupiah: 50_000,
		coinAmount: 5_500,
		description: 'Pilihan seimbang untuk santri aktif.'
	}),
	createPackage({
		id: 'santri_premium',
		name: 'Santri Premium',
		icon: '💎',
		amountRupiah: 100_000,
		coinAmount: 12_000,
		description: 'Cukup untuk membeli satu Tools dan masih memiliki sisa coin.'
	}),
	createPackage({
		id: 'santri_ultimate',
		name: 'Santri Ultimate',
		icon: '👑',
		amountRupiah: 250_000,
		coinAmount: 35_714,
		badge: 'PALING HEMAT',
		description: 'Nilai terbaik untuk membeli beberapa Tools dan kebutuhan jangka panjang.'
	})
]);

export const getCoinTopupPackages = () => coinTopupPackages.map((pkg) => ({ ...pkg }));

export const getCoinTopupPackageById = (packageId: string | null | undefined) =>
	coinTopupPackages.find((pkg) => pkg.id === packageId) ?? null;
