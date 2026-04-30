<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	export let form: { message?: string } | null;

	let amountRupiah = '';
	let coinAmount = '';
	let userNote = '';

	// Get success from URL
	$: successMessage = $page.url.searchParams.get('success') ?? '';

	const formatRupiah = (value: number) =>
		new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

	// Paket topup yang akan datang (TODO)
	const suggestedPackages = [
		{ rupiah: 10000, coin: 1000, label: 'Paket Kecil' },
		{ rupiah: 25000, coin: 2700, label: 'Paket Medium' },
		{ rupiah: 50000, coin: 5500, label: 'Paket Besar' },
		{ rupiah: 100000, coin: 11500, label: 'Paket Extra' }
	];

	function selectPackage(pkg: { rupiah: number; coin: number }) {
		amountRupiah = pkg.rupiah.toString();
		coinAmount = pkg.coin.toString();
	}
</script>

<svelte:head>
	<title>Topup Koin - SantriOnline</title>
	<meta name="description" content="Request topup koin SantriOnline." />
</svelte:head>

<div class="space-y-6 pb-10">
	<!-- Header -->
	<section class="rounded-[1.75rem] border border-amber-100 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.15),_transparent_40%),linear-gradient(135deg,_#0f172a_0%,_#1f2937_45%,_#78350f_100%)] px-5 py-8 text-white shadow-xl md:px-8">
		<p class="text-xs font-semibold uppercase tracking-[0.35em] text-amber-100/75">Topup Koin</p>
		<h1 class="mt-3 text-2xl font-bold text-white md:text-3xl">Tukar Rupiah dengan Koin</h1>
		<p class="mt-2 max-w-xl text-sm text-white/65">
			Silakan lakukan pembayaran sesuai arahan admin SantriOnline, lalu isi catatan/bukti pembayaran. 
			Koin akan masuk setelah admin memverifikasi.
		</p>
	</section>

	<!-- Error Message -->
	{#if form?.message}
		<div class="rounded-2xl border border-red-200 bg-red-50 p-4">
			<p class="text-sm font-medium text-red-600">{form.message}</p>
		</div>
	{/if}

	<!-- Success Message -->
	{#if successMessage === 'topup-created'}
		<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
			<p class="text-sm font-medium text-emerald-600">Request topup berhasil dibuat! Silakan hubungi admin untuk info pembayaran.</p>
		</div>
	{/if}

	<!-- Form -->
	<form method="POST" use:enhance class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
		<div class="space-y-6">
			<!-- Suggested Packages (TODO) -->
			<div>
				<label class="block text-sm font-medium text-slate-700">
					Paket Topup (coming soon)
				</label>
				<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
					{#each suggestedPackages as pkg}
						<button
							type="button"
							disabled
							class="cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center opacity-60"
							on:click={() => selectPackage(pkg)}
						>
							<p class="text-lg font-semibold text-slate-900">{pkg.coin.toLocaleString('id-ID')}</p>
							<p class="text-xs text-slate-500">{formatRupiah(pkg.rupiah)}</p>
							<p class="mt-1 text-[10px] uppercase tracking-wider text-slate-400">{pkg.label}</p>
						</button>
					{/each}
				</div>
			</div>

			<hr class="border-slate-100" />

			<!-- Manual Input -->
			<div class="space-y-4">
				<div>
					<label for="amount_rupiah" class="block text-sm font-medium text-slate-700">
						Jumlah Rupiah <span class="text-red-500">*</span>
					</label>
					<input
						type="number"
						id="amount_rupiah"
						name="amount_rupiah"
						bind:value={amountRupiah}
						min="1"
						step="1"
						required
						class="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
						placeholder="Contoh: 50000"
					/>
					<p class="mt-1 text-xs text-slate-500">Masukkan jumlah uang yang ditransfer.</p>
				</div>

				<div>
					<label for="coin_amount" class="block text-sm font-medium text-slate-700">
						Jumlah Koin yang Ingin Diterima <span class="text-red-500">*</span>
					</label>
					<input
						type="number"
						id="coin_amount"
						name="coin_amount"
						bind:value={coinAmount}
						min="100"
						step="1"
						required
						class="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
						placeholder="Contoh: 5000"
					/>
					<p class="mt-1 text-xs text-slate-500">Minimal 100 koin.</p>
				</div>

				<div>
					<label for="user_note" class="block text-sm font-medium text-slate-700">
						Catatan / Bukti Transfer
					</label>
					<textarea
						id="user_note"
						name="user_note"
						bind:value={userNote}
						rows="4"
						class="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
						placeholder="Contoh: Transfer ke BCA 1234567890 a.n. SantriOnline, bukti terlampir di chat admin"
					></textarea>
					<p class="mt-1 text-xs text-slate-500">
						Isi dengan nomor referensi transfer, catatan, atau informasi lain untuk verifikasi.
					</p>
				</div>
			</div>

			<!-- Info Box -->
			<div class="rounded-2xl border border-amber-200 bg-amber-50 p-4">
				<p class="text-sm font-medium text-amber-800">Cara Topup:</p>
				<ol class="mt-2 list-inside list-decimal text-sm text-amber-700">
					<li>Isi jumlah Rupiah dan koin yang diinginkan.</li>
					<li>Klik tombol "Buat Request" di bawah.</li>
					<li>Hubungi admin SantriOnline untuk informasi pembayaran.</li>
					<li>Admin akan memverifikasi dan menambahkan koin ke saldo Anda.</li>
				</ol>
			</div>

			<div class="flex flex-col gap-3 sm:flex-row">
				<a href="/coins" class="btn btn-outline btn-lg">Batal</a>
				<button type="submit" class="btn btn-primary btn-lg flex-1">
					Buat Request
				</button>
			</div>
		</div>
	</form>
</div>