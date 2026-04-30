export type CoinTopupPackage = {
	id: string;
	name: string;
	amountRupiah: number;
	coinAmount: number;
	bonusCoin: number;
	description: string;
};

const coinTopupPackages: readonly CoinTopupPackage[] = [
	{
		id: 'santri-hemat',
		name: 'Santri Hemat',
		amountRupiah: 10_000,
		coinAmount: 1_000,
		bonusCoin: 0,
		description: 'Cukup untuk mulai membaca bab premium.'
	},
	{
		id: 'ngaji-rutin',
		name: 'Ngaji Rutin',
		amountRupiah: 25_000,
		coinAmount: 2_700,
		bonusCoin: 200,
		description: 'Paket rutin dengan bonus coin ringan.'
	},
	{
		id: 'pembaca-aktif',
		name: 'Pembaca Aktif',
		amountRupiah: 50_000,
		coinAmount: 5_500,
		bonusCoin: 500,
		description: 'Lebih cocok untuk pembaca aktif.'
	},
	{
		id: 'keluarga',
		name: 'Keluarga',
		amountRupiah: 100_000,
		coinAmount: 12_000,
		bonusCoin: 2_000,
		description: 'Nilai terbaik untuk bacaan keluarga.'
	}
];

export const getCoinTopupPackages = () => coinTopupPackages.map((pkg) => ({ ...pkg }));

export const getCoinTopupPackageById = (packageId: string | null | undefined) =>
	coinTopupPackages.find((pkg) => pkg.id === packageId) ?? null;
