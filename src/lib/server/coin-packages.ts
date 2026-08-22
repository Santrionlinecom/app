import { RUPIAH_PER_COIN } from './coins/kurs';

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

const BASE_RUPIAH_PER_COIN = RUPIAH_PER_COIN;
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
		description: 'Pilihan hemat untuk pemakaian rutin jangka panjang.'
	}),
	createPackage({
		// Dibuat khusus supaya pembeli Tools tidak terjebak kurang coin.
		//
		// Sebelum paket ini ada, Santri Premium (Rp100.000 → 12.000 coin)
		// KURANG 900 coin dari harga SantriPrint Pro (12.900). Pengguna
		// membayar seratus ribu, lalu diberi tahu saldonya masih kurang —
		// dan harus topup lagi hanya untuk menutup kekurangan itu.
		id: 'santri_tools',
		name: 'Santri Tools',
		icon: '🛠️',
		amountRupiah: 120_000,
		coinAmount: 14_500,
		badge: 'PAS UNTUK TOOLS',
		description:
			'Cukup untuk membeli satu Tools seperti SantriPrint Pro dalam sekali isi, dan masih bersisa.'
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

/**
 * Memilih paket topup terkecil yang menutupi kebutuhan coin.
 *
 * Dipakai saat pengguna datang dari halaman produk dengan saldo kurang.
 * Yang dicari adalah paket terkecil yang CUKUP — bukan paket terkecil
 * begitu saja (pengguna akan kurang lagi), dan bukan paket terbesar
 * (pengguna merasa dipaksa membeli jauh lebih banyak).
 *
 * Mengembalikan null bila tidak ada satu pun paket yang mencukupi.
 */
export function pilihPaketMencukupi(
	butuhCoin: number,
	daftar: readonly CoinTopupPackage[] = coinTopupPackages
): CoinTopupPackage | null {
	if (!Number.isSafeInteger(butuhCoin) || butuhCoin <= 0) return null;
	return (
		daftar
			.filter((p) => p.coinAmount >= butuhCoin)
			.sort((a, b) => a.coinAmount - b.coinAmount)[0] ?? null
	);
}

export const getCoinTopupPackages = () => coinTopupPackages.map((pkg) => ({ ...pkg }));

export const getCoinTopupPackageById = (packageId: string | null | undefined) =>
	coinTopupPackages.find((pkg) => pkg.id === packageId) ?? null;
