<script lang="ts">
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import BadgeCheck from '@lucide/svelte/icons/badge-check';
	import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Clock3 from '@lucide/svelte/icons/clock-3';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import ReceiptText from '@lucide/svelte/icons/receipt-text';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import WalletCards from '@lucide/svelte/icons/wallet-cards';
	import type { PageData } from './$types';

	export let data: PageData;
	export let form: { message?: string } | null;

	let selectedPackageId = data.packages[0]?.id ?? '';
	let userNote = '';
	let isProcessing = false;
	let toast: { kind: 'success' | 'pending' | 'error'; message: string } | null = null;
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

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
			showToast('error', 'Midtrans Snap belum siap. Muat ulang halaman lalu coba lagi.');
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
					showToast('success', 'Pembayaran sukses. Saldo coin akan disinkronkan otomatis.');
					void invalidateAll();
				},
				onPending: () => {
					showToast('pending', 'Pembayaran masih pending. Selesaikan pembayaran di Midtrans.');
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
	<script src="https://app.midtrans.com/snap/snap.js" data-client-key={midtransClientKey}></script>
</svelte:head>

<div class="space-y-6 pb-24 md:pb-10">
	<header class="border-b border-slate-200 pb-6">
		<a href="/coins" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
			<ArrowLeft class="h-4 w-4" />
			Kembali ke Saldo Koin
		</a>

		<div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Top Up Koin</p>
				<h1 class="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
					Tambah Saldo Koin
				</h1>
				<p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
					Pilih nominal, bayar via Midtrans, lalu saldo akan disinkronkan setelah pembayaran
					terkonfirmasi.
				</p>
			</div>

			<div class="grid gap-2 text-sm text-slate-600">
				<div class="flex items-center gap-2">
					<ShieldCheck class="h-4 w-4 text-emerald-600" />
					<span>Pembayaran aman via Midtrans Snap</span>
				</div>
				<div class="flex items-center gap-2">
					<Clock3 class="h-4 w-4 text-amber-600" />
					<span>Status dapat dipantau dari riwayat saldo</span>
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
				Permintaan top up berhasil dikirim. Admin akan memverifikasi bukti transfer Anda.
			</p>
		</div>
	{/if}

	<form method="POST" class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6" on:submit|preventDefault={startMidtransTopup}>
		<div class="space-y-6">
			<fieldset class="space-y-4">
				<div class="flex items-start justify-between gap-4">
					<div>
						<legend class="text-lg font-semibold text-slate-950">Pilih Paket</legend>
						<p class="mt-1 text-sm text-slate-500">
							Rasio dasar 1 koin = Rp 10. Beberapa paket memiliki bonus koin.
						</p>
					</div>
					<WalletCards class="mt-1 h-5 w-5 shrink-0 text-slate-400" />
				</div>

				<div class="grid gap-3 sm:grid-cols-2">
					{#each packages as pkg}
						<label
							class={`group cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md ${
								selectedPackageId === pkg.id
									? 'border-emerald-500 ring-2 ring-emerald-100'
									: 'border-slate-200'
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
									<p class="text-base font-semibold text-slate-950">{pkg.name}</p>
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

							<div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
								<span class="font-medium text-slate-500">Bonus</span>
								{#if pkg.bonusCoin > 0}
									<span class="font-semibold text-emerald-600">
										+{pkg.bonusCoin.toLocaleString('id-ID')} koin
									</span>
								{:else}
									<span class="font-medium text-slate-400">Standar</span>
								{/if}
							</div>
						</label>
					{/each}
				</div>
			</fieldset>

			<section class="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
				<div class="flex items-start justify-between gap-4">
					<div>
						<h2 class="text-lg font-semibold text-emerald-950">Pembayaran Midtrans</h2>
						<p class="mt-1 text-sm text-slate-500">
							Order dibuat dengan ID pendek dan saldo akan masuk setelah notifikasi pembayaran
							diterima.
						</p>
					</div>
					<CreditCard class="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
				</div>
			</section>

			<section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
				<div class="flex items-start justify-between gap-4">
					<div>
						<h2 class="text-lg font-semibold text-slate-950">Catatan Pembayaran</h2>
						<p class="mt-1 text-sm text-slate-500">
							Tambahkan nomor referensi atau nama rekening pengirim bila diperlukan.
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
			<section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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

			<section class="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
				<div class="flex items-start gap-3">
					<BadgeCheck class="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
					<div>
						<h2 class="text-sm font-semibold text-emerald-950">Alur Verifikasi</h2>
						<ol class="mt-3 space-y-2 text-sm leading-6 text-emerald-600">
							<li>1. Transfer sesuai nominal paket.</li>
							<li>2. Unggah bukti transfer dari formulir ini.</li>
							<li>3. Admin memeriksa pembayaran dan menambahkan saldo.</li>
						</ol>
					</div>
				</div>
			</section>

			<div class="flex flex-col gap-3">
				<button
					type="submit"
					class="btn btn-primary btn-lg w-full gap-2"
					disabled={isProcessing || !selectedPackage}
				>
					{#if isProcessing}
						<LoaderCircle class="h-4 w-4 animate-spin" />
						Menyiapkan Snap
					{:else}
						<CreditCard class="h-4 w-4" />
						Bayar via Midtrans
					{/if}
				</button>
				<a href="/coins" class="btn btn-outline btn-lg w-full gap-2">
					<ArrowLeft class="h-4 w-4" />
					Batal
				</a>
			</div>
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
