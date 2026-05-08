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
		id: 'paket-hemat',
		name: 'Paket Hemat',
		amountRupiah: 10_000,
		coinAmount: 1_000,
		bonusCoin: 0,
		description: 'Cocok untuk mulai membuka konten premium.'
	},
	{
		id: 'paket-rutin',
		name: 'Paket Rutin',
		amountRupiah: 25_000,
		coinAmount: 2_700,
		bonusCoin: 200,
		description: 'Pilihan seimbang untuk penggunaan rutin.'
	},
	{
		id: 'pembaca-aktif',
		name: 'Pembaca Aktif',
		amountRupiah: 50_000,
		coinAmount: 5_500,
		bonusCoin: 500,
		description: 'Untuk pembaca yang sering membuka bab premium.'
	},
	{
		id: 'paket-keluarga',
		name: 'Paket Keluarga',
		amountRupiah: 100_000,
		coinAmount: 12_000,
		bonusCoin: 2_000,
		description: 'Nilai terbaik untuk kebutuhan keluarga atau tim kecil.'
	}
];

export const getCoinTopupPackages = () => coinTopupPackages.map((pkg) => ({ ...pkg }));

export const getCoinTopupPackageById = (packageId: string | null | undefined) =>
	coinTopupPackages.find((pkg) => pkg.id === packageId) ?? null;
