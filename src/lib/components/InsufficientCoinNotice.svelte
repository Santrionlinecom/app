<script lang="ts">
	import { AlertCircle, Coins } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	export let currentBalance: number = 0;
	export let requiredAmount: number = 0;
	export let shortfall: number = 0;
	export let productName: string = 'produk ini';

	const formatCoin = (amount: number) => {
		return new Intl.NumberFormat('id-ID').format(amount);
	};
</script>

<div class="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950">
	<div class="flex items-start gap-4">
		<div class="flex-shrink-0">
			<AlertCircle class="h-6 w-6 text-amber-600 dark:text-amber-400" />
		</div>
		<div class="flex-1 space-y-3">
			<div>
				<h3 class="font-semibold text-amber-900 dark:text-amber-100">
					Saldo Coin Tidak Cukup
				</h3>
				<p class="mt-1 text-sm text-amber-800 dark:text-amber-200">
					Anda memerlukan lebih banyak coin untuk membeli {productName}.
				</p>
			</div>

			<div class="space-y-2 rounded-md bg-white p-4 dark:bg-gray-900">
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-600 dark:text-gray-400">Saldo Anda saat ini:</span>
					<span class="font-semibold text-gray-900 dark:text-gray-100">
						<Coins class="inline h-4 w-4" />
						{formatCoin(currentBalance)} Coin
					</span>
				</div>
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-600 dark:text-gray-400">Harga produk:</span>
					<span class="font-semibold text-gray-900 dark:text-gray-100">
						<Coins class="inline h-4 w-4" />
						{formatCoin(requiredAmount)} Coin
					</span>
				</div>
				<div class="border-t pt-2">
					<div class="flex items-center justify-between text-sm font-bold">
						<span class="text-amber-700 dark:text-amber-300">Kekurangan:</span>
						<span class="text-amber-700 dark:text-amber-300">
							<Coins class="inline h-4 w-4" />
							{formatCoin(shortfall)} Coin
						</span>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-2 sm:flex-row">
				<Button href="/coins/topup" class="flex-1">
					<Coins class="mr-2 h-4 w-4" />
					Isi Saldo Coin
				</Button>
				<Button href="/coins" variant="outline" class="flex-1">
					Lihat Riwayat Transaksi
				</Button>
			</div>

			<p class="text-xs text-amber-700 dark:text-amber-300">
				💡 <strong>Tips:</strong> Top up coin Anda sekarang untuk dapat langsung membeli produk tanpa menunggu.
			</p>
		</div>
	</div>
</div>
