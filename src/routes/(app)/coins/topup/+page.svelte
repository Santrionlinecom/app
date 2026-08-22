<script lang="ts">
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import BadgeCheck from '@lucide/svelte/icons/badge-check';
	import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Clock3 from '@lucide/svelte/icons/clock-3';
	import Coins from '@lucide/svelte/icons/coins';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import ReceiptText from '@lucide/svelte/icons/receipt-text';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import WalletCards from '@lucide/svelte/icons/wallet-cards';
	import type { PageData } from './$types';

	export let data: PageData;
	export let form: { message?: string } | null;

	let selectedPackageId = data.paketDisarankan ?? data.packages[0]?.id ?? '';
	let userNote = '';
	let isProcessing = false;
	let toast: { kind: 'success' | 'pending' | 'error'; message: string } | null = null;
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	// —— Pilihan cara bayar ——
	// 'midtrans' = otomatis (VA/GoPay/DANA/QRIS lewat Snap)
	// 'manual'   = transfer ke rekening sendiri, diverifikasi admin
	let caraBayar: 'midtrans' | 'manual' = 'midtrans';
	let metodeManualId = data.metodeManual?.[0]?.id ?? '';
	let buktiUrl = '';
	let sedangUnggah = false;
	let mengirimManual = false;
	let nomorTersalin = '';

	$: metodeManual = data.metodeManual ?? [];
	$: metodeTerpilih = metodeManual.find((m) => m.id === metodeManualId) ?? null;
	$: riwayatManual = data.riwayatManual ?? [];

	async function salinNomor(nomor: string) {
		try {
			await navigator.clipboard.writeText(nomor.replace(/\s/g, ''));
			nomorTersalin = nomor;
			setTimeout(() => (nomorTersalin = ''), 2000);
		} catch {
			nomorTersalin = '';
		}
	}

	async function unggahBukti(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		sedangUnggah = true;
		try {
			const body = new FormData();
			body.append('file', file);
			const res = await fetch('/api/upload/topup-proof', { method: 'POST', body });
			const payload = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

			if (!res.ok || !payload.url) {
				showToast('error', payload.error ?? 'Gagal mengunggah bukti transfer.');
				buktiUrl = '';
				return;
			}
			buktiUrl = payload.url;
			showToast('success', 'Bukti transfer terunggah.');
		} catch {
			showToast('error', 'Gagal mengunggah bukti transfer.');
			buktiUrl = '';
		} finally {
			sedangUnggah = false;
		}
	}

	async function kirimManual(event: SubmitEvent) {
		if (!selectedPackage) {
			showToast('error', 'Pilih paket top up terlebih dahulu.');
			return;
		}
		if (!metodeManualId) {
			showToast('error', 'Pilih metode pembayaran.');
			return;
		}
		if (!buktiUrl) {
			showToast('error', 'Unggah bukti transfer terlebih dahulu.');
			return;
		}

		mengirimManual = true;
		try {
			const formData = new FormData(event.currentTarget as HTMLFormElement);
			const res = await fetch('?/manual', { method: 'POST', body: formData });
			const result = deserialize(await res.text());
			const payload = (result as { data?: { message?: string } }).data;

			if (result.type !== 'success') {
				showToast('error', payload?.message ?? 'Permintaan top up gagal dikirim.');
				return;
			}

			showToast('success', payload?.message ?? 'Permintaan terkirim.');
			buktiUrl = '';
			userNote = '';
			await invalidateAll();
		} catch {
			showToast('error', 'Permintaan top up gagal dikirim.');
		} finally {
			mengirimManual = false;
		}
	}

	type SnapCallbacks = {
		onSuccess?: (result: unknown) => void;
		onPending?: (result: unknown) => void;
		onError?: (result: unknown) => void;
	};

	type SnapWindow = Window &
		typeof globalThis & {
			snap?: {
				pay: (token: string, callbacks?: SnapCallbacks) => void;
			};
		};

	type SnapTokenPayload = {
		type?: string;
		snapToken?: string;
		message?: string;
	};

	$: successMessage = $page.url.searchParams.get('success') ?? '';
	$: packages = data.packages ?? [];
	$: selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId) ?? null;
	$: midtransClientKey = data.midtransClientKey ?? '';

	const formatRupiah = (value: number) =>
		new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(value);

	const formatEffectiveRate = (value: number) =>
		new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value);
	const formatSavings = (value: number) =>
		new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(value);

	const showToast = (kind: 'success' | 'pending' | 'error', message: string) => {
		if (toastTimer) {
			clearTimeout(toastTimer);
		}

		toast = { kind, message };
		toastTimer = setTimeout(() => {
			toast = null;
			toastTimer = null;
		}, 4500);
	};

	const getMidtransSnap = () => (window as SnapWindow).snap;

	async function startMidtransTopup(event: SubmitEvent) {
		if (!selectedPackage) {
			showToast('error', 'Pilih paket top up terlebih dahulu.');
			return;
		}

		const snap = getMidtransSnap();
		if (!midtransClientKey || !snap) {
			showToast('error', 'Layanan pembayaran belum siap. Muat ulang halaman lalu coba lagi.');
			return;
		}

		isProcessing = true;
		try {
			const formData = new FormData(event.currentTarget as HTMLFormElement);

			const response = await fetch('?/order', {
				method: 'POST',
				body: formData
			});
			const result = deserialize(await response.text());

			if (result.type === 'failure') {
				const payload = result.data as SnapTokenPayload | undefined;
				throw new Error(payload?.message ?? 'Gagal membuat order top up.');
			}

			if (result.type === 'error') {
				throw new Error(result.error?.message ?? 'Gagal membuat order top up.');
			}

			if (result.type === 'redirect') {
				window.location.href = result.location;
				return;
			}

			const payload = result.data as SnapTokenPayload | undefined;
			if (result.type !== 'success' || payload?.type !== 'snapToken' || !payload.snapToken) {
				throw new Error(payload?.message ?? 'Token pembayaran tidak tersedia.');
			}

			snap.pay(payload.snapToken, {
				onSuccess: () => {
					showToast('success', 'Pembayaran berhasil. Saldo koin akan disinkronkan otomatis.');
					void invalidateAll();
				},
				onPending: () => {
					showToast('pending', 'Pembayaran belum selesai. Silakan lanjutkan proses pembayaran.');
					void invalidateAll();
				},
				onError: () => {
					showToast('error', 'Pembayaran gagal diproses.');
				}
			});
		} catch (err) {
			showToast('error', err instanceof Error ? err.message : 'Gagal memulai pembayaran top up.');
		} finally {
			isProcessing = false;
		}
	}
</script>

<svelte:head>
	<title>Top Up Koin - SantriOnline</title>
	<meta name="description" content="Tambah saldo koin SantriOnline melalui Midtrans." />
	<script src={data.midtransSnapScriptUrl} data-client-key={midtransClientKey}></script>
</svelte:head>

<div class="mx-auto min-h-screen w-full max-w-[1440px] space-y-6 px-4 pb-36 pt-6 sm:px-6 md:pb-12 lg:px-8 lg:pt-10">
	<header class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
		<a href="/coins" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
			<ArrowLeft class="h-4 w-4" />
			Kembali ke Saldo Koin
		</a>

		<div class="mt-5 grid gap-5 border-t border-slate-100 pt-5 sm:mt-6 sm:gap-6 sm:pt-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Top Up Koin</p>
				<h1 class="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
					Tambah Saldo Koin
				</h1>
				<p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
					Pilih nominal, selesaikan pembayaran, lalu saldo akan disinkronkan setelah pembayaran
					terkonfirmasi.
				</p>
			</div>

			<div class="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
				<div class="flex items-start gap-3">
					<ShieldCheck class="h-4 w-4 text-emerald-600" />
					<span class="leading-6">Pembayaran aman dan terverifikasi otomatis</span>
				</div>
				<div class="flex items-start gap-3">
					<Clock3 class="h-4 w-4 text-amber-600" />
					<span class="leading-6">Status dapat dipantau dari riwayat saldo</span>
				</div>
			</div>
		</div>
	</header>

	{#if form?.message}
		<div class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
			<CircleAlert class="mt-0.5 h-5 w-5 shrink-0" />
			<p class="text-sm font-medium">{form.message}</p>
		</div>
	{/if}

	{#if successMessage === 'topup-created'}
		<div class="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-600">
			<CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0" />
			<p class="text-sm font-medium">
				Order Midtrans berhasil dibuat. Coin hanya masuk setelah pembayaran terverifikasi oleh webhook.
			</p>
		</div>
	{/if}

	<form method="POST" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-7" on:submit|preventDefault={(e) => (caraBayar === 'manual' ? kirimManual(e) : startMidtransTopup(e))}>
		<!-- Dikirim ke action manual; nominal TIDAK ikut — server yang menentukan. -->
		<input type="hidden" name="metode_id" value={metodeManualId} />
		<input type="hidden" name="bukti_url" value={buktiUrl} />
		<div class="space-y-6">
			<fieldset class="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
				<div class="flex items-start justify-between gap-4">
					<div>
						<legend class="text-lg font-semibold text-slate-950">Pilih Paket</legend>
						<p class="mt-1 text-sm text-slate-500">
							Semakin besar top-up, semakin murah harga per coin. Rasio dasar 1 coin = Rp10.
						</p>
					</div>
					<WalletCards class="mt-1 h-5 w-5 shrink-0 text-slate-400" />
				</div>

				<!--
					Datang dari halaman produk dengan saldo kurang. Sebutkan
					kekurangannya secara terbuka dan tandai paket yang sudah
					dipilihkan, supaya tidak ada yang topup lalu ternyata masih
					kurang untuk kedua kalinya.
				-->
				{#if data.coinDibutuhkan}
					<div
						class="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
					>
						<Coins class="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
						<div class="text-sm text-amber-900">
							<p class="font-semibold">
								Anda kurang {data.coinDibutuhkan.toLocaleString('id-ID')} coin
							</p>
							<p class="mt-1 leading-6">
								{#if data.paketDisarankan}
									Kami sudah memilihkan paket yang mencukupi dalam sekali isi. Setelah top-up
									berhasil, saldo langsung terpotong otomatis saat membeli — tidak perlu isi
									ulang lagi.
								{:else}
									Belum ada paket tunggal yang mencukupi. Silakan pilih paket terbesar,
									lalu ulangi sekali lagi.
								{/if}
							</p>
						</div>
					</div>
				{/if}

				<div class="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
					{#each packages as pkg}
						<label
							class={`group cursor-pointer rounded-xl border-2 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md ${
								selectedPackageId === pkg.id
									? 'border-emerald-500 ring-2 ring-emerald-100'
									: 'border-slate-200 hover:bg-slate-50/60'
							}`}
						>
							<input
								type="radio"
								name="package_id"
								value={pkg.id}
								bind:group={selectedPackageId}
								required
								class="sr-only"
							/>

							<div class="flex items-start justify-between gap-3">
								<div>
									<div class="flex flex-wrap items-center gap-2">
										<p class="text-base font-semibold text-slate-950">{pkg.icon} {pkg.name}</p>
										{#if pkg.badge}
											<span class="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold tracking-wide text-amber-800">{pkg.badge}</span>
										{/if}
									</div>
									<p class="mt-1 min-h-10 text-sm leading-5 text-slate-500">{pkg.description}</p>
								</div>
								<span
									class={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
										selectedPackageId === pkg.id
											? 'border-emerald-600 bg-emerald-600 text-white'
											: 'border-slate-300 bg-white text-transparent'
									}`}
									aria-hidden="true"
								>
									<CheckCircle2 class="h-3.5 w-3.5" />
								</span>
							</div>

							<div class="mt-5 flex items-end justify-between gap-3">
								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Transfer</p>
									<p class="mt-1 text-xl font-bold text-slate-950">{formatRupiah(pkg.amountRupiah)}</p>
								</div>
								<div class="text-right">
									<p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Diterima</p>
									<p class="mt-1 text-lg font-bold text-emerald-600">
										{pkg.coinAmount.toLocaleString('id-ID')} koin
									</p>
								</div>
							</div>

							<div class="mt-4 grid gap-2 border-t border-slate-100 pt-3 text-xs">
								{#if pkg.bonusCoin > 0}
									<div class="flex justify-between gap-3"><span class="font-medium text-slate-500">Bonus</span><span class="font-semibold text-emerald-600">+{pkg.bonusCoin.toLocaleString('id-ID')} coin</span></div>
								{/if}
								<div class="flex justify-between gap-3"><span class="font-medium text-slate-500">Harga / Coin</span><span class="font-semibold text-slate-800">± Rp{formatEffectiveRate(pkg.effectiveRupiahPerCoin)}</span></div>
								{#if pkg.savingsPercent > 0.01}
									<div class="flex justify-between gap-3"><span class="font-medium text-slate-500">Hemat</span><span class="font-semibold text-amber-700">±{formatSavings(pkg.savingsPercent)}%</span></div>
								{/if}
								<p class="mt-1 rounded-lg bg-slate-50 px-3 py-2 leading-5 text-slate-600">{pkg.toolPurchaseHint}</p>
							</div>
						</label>
					{/each}
				</div>
			</fieldset>

			<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
				<div class="flex items-start justify-between gap-4">
					<div>
						<h2 class="text-lg font-semibold text-slate-950">Cara Pembayaran</h2>
						<p class="mt-1 text-sm text-slate-500">Pilih yang paling nyaman untuk Anda.</p>
					</div>
					<CreditCard class="mt-1 h-5 w-5 shrink-0 text-slate-400" />
				</div>

				<div class="mt-4 grid gap-3 sm:grid-cols-2">
					<label class={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${caraBayar === 'midtrans' ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'}`}>
						<input type="radio" name="cara_bayar" value="midtrans" bind:group={caraBayar} class="mt-1 h-4 w-4 accent-emerald-600" />
						<span>
							<span class="block font-semibold text-slate-900">Otomatis</span>
							<span class="mt-0.5 block text-xs leading-5 text-slate-500">
								Virtual Account, GoPay, DANA, QRIS. Coin masuk seketika.
							</span>
						</span>
					</label>

					<label class={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${caraBayar === 'manual' ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'} ${metodeManual.length === 0 ? 'pointer-events-none opacity-50' : ''}`}>
						<input type="radio" name="cara_bayar" value="manual" bind:group={caraBayar} disabled={metodeManual.length === 0} class="mt-1 h-4 w-4 accent-emerald-600" />
						<span>
							<span class="block font-semibold text-slate-900">Transfer Manual</span>
							<span class="mt-0.5 block text-xs leading-5 text-slate-500">
								Transfer bank / QRIS lalu unggah bukti. {data.janjiVerifikasi}.
							</span>
						</span>
					</label>
				</div>
			</section>

			{#if caraBayar === 'midtrans'}
				<section class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:p-6">
					<div class="flex items-start justify-between gap-4">
						<div>
							<h2 class="text-lg font-semibold text-emerald-950">Pembayaran Aman</h2>
							<p class="mt-2 text-sm leading-6 text-emerald-900/75">
								Saldo koin akan masuk otomatis setelah pembayaran berhasil diverifikasi.
							</p>
						</div>
						<CreditCard class="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
					</div>
				</section>
			{:else}
				<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
					<div class="flex items-start justify-between gap-4">
						<div>
							<h2 class="text-lg font-semibold text-slate-950">Rekening Tujuan</h2>
							<p class="mt-1 text-sm text-slate-500">
								Transfer sesuai nominal, lalu unggah buktinya di bawah.
							</p>
						</div>
						<WalletCards class="mt-1 h-5 w-5 shrink-0 text-slate-400" />
					</div>

					<div class="mt-4 space-y-3">
						{#each metodeManual as metode (metode.id)}
							<label class={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${metodeManualId === metode.id ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'}`}>
								<input type="radio" name="metode_pilih" value={metode.id} bind:group={metodeManualId} class="mt-1 h-4 w-4 accent-emerald-600" />
								<span class="min-w-0 flex-1">
									<span class="block font-semibold text-slate-900">{metode.nama}</span>
									{#if metode.nomorRekening}
										<span class="mt-1 block font-mono text-lg font-bold tracking-wide text-slate-900">
											{metode.nomorRekening}
										</span>
									{/if}
									{#if metode.atasNama}
										<span class="block text-xs text-slate-500">a.n. {metode.atasNama}</span>
									{/if}
									{#if metode.instruksi}
										<span class="mt-1 block text-xs leading-5 text-slate-500">{metode.instruksi}</span>
									{/if}
								</span>
							</label>
						{/each}
					</div>

					{#if metodeTerpilih?.nomorRekening}
						<button
							type="button"
							on:click={() => salinNomor(metodeTerpilih.nomorRekening ?? '')}
							class="mt-3 min-h-[44px] rounded-xl border border-emerald-300 px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
						>
							{nomorTersalin === metodeTerpilih.nomorRekening ? 'Nomor tersalin ✓' : 'Salin nomor rekening'}
						</button>
					{/if}

					{#if metodeTerpilih?.gambarUrl}
						<img src={metodeTerpilih.gambarUrl} alt={`Kode QR ${metodeTerpilih.nama}`} class="mt-4 w-full max-w-xs rounded-xl border border-slate-200" loading="lazy" />
					{/if}

					<div class="mt-5 border-t border-slate-200 pt-5">
						<label for="bukti_file" class="block text-sm font-bold text-slate-900">
							Bukti transfer <span class="font-normal text-slate-500">(wajib)</span>
						</label>
						<input
							id="bukti_file"
							type="file"
							accept="image/*"
							on:change={unggahBukti}
							disabled={sedangUnggah}
							class="mt-2 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-800 file:px-4 file:py-2 file:font-semibold file:text-white"
						/>
						{#if sedangUnggah}
							<p class="mt-2 text-xs font-semibold text-slate-500">Mengunggah…</p>
						{:else if buktiUrl}
							<p class="mt-2 text-xs font-semibold text-emerald-700">Bukti terunggah ✓</p>
						{/if}
					</div>

					<p class="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
						{data.janjiVerifikasi}. Coin masuk setelah pembayaran diverifikasi — bukan seketika.
					</p>
				</section>
			{/if}

			<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
				<div class="flex items-start justify-between gap-4">
					<div>
						<h2 class="text-lg font-semibold text-slate-950">Catatan Pembayaran</h2>
						<p class="mt-1 text-sm text-slate-500">
							Catatan opsional untuk membantu identifikasi order Anda.
						</p>
					</div>
					<ReceiptText class="mt-1 h-5 w-5 shrink-0 text-slate-400" />
				</div>

				<label for="user_note" class="sr-only">Catatan pembayaran</label>
				<textarea
					id="user_note"
					name="user_note"
					bind:value={userNote}
					rows="4"
					maxlength="500"
					class="mt-4 block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
					placeholder="Opsional: nomor referensi transfer, nama rekening pengirim, atau info lain."
				></textarea>
				<p class="mt-2 text-xs text-slate-500">{userNote.length}/500 karakter</p>
			</section>
		</div>

		<aside class="space-y-4 lg:sticky lg:top-24 lg:self-start">
			<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
				<div class="flex items-center justify-between gap-3">
					<h2 class="text-lg font-semibold text-slate-950">Ringkasan</h2>
					<CreditCard class="h-5 w-5 text-slate-400" />
				</div>

				{#if selectedPackage}
					<div class="mt-5 space-y-4">
						<div class="flex items-center justify-between gap-4">
							<span class="text-sm text-slate-500">Paket</span>
							<span class="text-right text-sm font-semibold text-slate-950">{selectedPackage.name}</span>
						</div>
						<div class="flex items-center justify-between gap-4">
							<span class="text-sm text-slate-500">Nominal Transfer</span>
							<span class="text-right text-sm font-semibold text-slate-950">
								{formatRupiah(selectedPackage.amountRupiah)}
							</span>
						</div>
						<div class="flex items-center justify-between gap-4">
							<span class="text-sm text-slate-500">Bonus</span>
							<span class="text-right text-sm font-semibold text-emerald-600">
								{selectedPackage.bonusCoin > 0
									? `+${selectedPackage.bonusCoin.toLocaleString('id-ID')} koin`
									: 'Tidak ada'}
							</span>
						</div>
						<div class="border-t border-slate-100 pt-4">
							<p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
								Total Koin Diterima
							</p>
							<p class="mt-2 text-3xl font-bold text-slate-950">
								{selectedPackage.coinAmount.toLocaleString('id-ID')}
								<span class="text-base font-semibold text-slate-500">koin</span>
							</p>
						</div>
					</div>
				{:else}
					<p class="mt-4 text-sm text-slate-500">Pilih paket untuk melihat ringkasan.</p>
				{/if}
			</section>

			<section class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:p-6">
				<div class="flex items-start gap-3">
					<BadgeCheck class="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
					<div>
						<h2 class="text-sm font-semibold text-emerald-950">Alur Verifikasi</h2>
						<ol class="mt-3 space-y-2 text-sm leading-6 text-emerald-600">
							<li>1. Pilih paket koin yang dibutuhkan.</li>
							<li>2. Selesaikan proses pada jendela pembayaran.</li>
							<li>3. Saldo masuk setelah pembayaran terverifikasi.</li>
						</ol>
					</div>
				</div>
			</section>

			<div class="flex flex-col gap-3">
				{#if caraBayar === 'midtrans'}
					<button
						type="submit"
						class="btn btn-primary btn-lg w-full gap-2"
						disabled={isProcessing || !selectedPackage}
					>
						{#if isProcessing}
							<LoaderCircle class="h-4 w-4 animate-spin" />
							Menyiapkan pembayaran
						{:else}
							<CreditCard class="h-4 w-4" />
							Lanjutkan Pembayaran
						{/if}
					</button>
				{:else}
					<button
						type="submit"
						class="btn btn-primary btn-lg w-full gap-2"
						disabled={mengirimManual || sedangUnggah || !selectedPackage || !buktiUrl}
					>
						{#if mengirimManual}
							<LoaderCircle class="h-4 w-4 animate-spin" />
							Mengirim permintaan
						{:else}
							<ReceiptText class="h-4 w-4" />
							Kirim Bukti Transfer
						{/if}
					</button>
					{#if !buktiUrl}
						<p class="text-center text-xs text-slate-500">
							Unggah bukti transfer dulu untuk mengaktifkan tombol.
						</p>
					{/if}
				{/if}
				<a href="/coins" class="btn btn-outline btn-lg w-full gap-2">
					<ArrowLeft class="h-4 w-4" />
					Batal
				</a>
			</div>

			{#if riwayatManual.length > 0}
				<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
					<h2 class="text-sm font-bold text-slate-900">Permintaan Transfer Manual</h2>
					<ul class="mt-3 space-y-2">
						{#each riwayatManual as r (r.id)}
							<li class="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2 last:border-0">
								<span class="text-sm text-slate-700">
									{formatRupiah(r.amountRupiah)}
									<span class="text-xs text-slate-400">· {r.coinAmount} coin</span>
								</span>
								<span class={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
									r.status === 'approved'
										? 'bg-emerald-100 text-emerald-800'
										: r.status === 'rejected'
											? 'bg-slate-100 text-slate-600'
											: 'bg-amber-100 text-amber-800'
								}`}>
									{r.status === 'approved' ? 'Disetujui' : r.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
								</span>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</aside>
	</form>
</div>

{#if toast}
	<div
		class={`fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-xl border px-4 py-3 text-sm font-bold shadow-soft md:bottom-5 ${
			toast.kind === 'success'
				? 'border-emerald-200 bg-emerald-50 text-emerald-600'
				: toast.kind === 'pending'
					? 'border-amber-200 bg-amber-50 text-amber-800'
					: 'border-red-200 bg-red-50 text-red-800'
		}`}
	>
		{toast.message}
	</div>
{/if}
