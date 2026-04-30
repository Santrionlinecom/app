<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	export let data: PageData;
	export let form: { message?: string } | null;

	let selectedPackageId = data.packages[0]?.id ?? '';
	let userNote = '';
	let proofUrl = '';
	let isProofUploading = false;
	let proofUploadError = '';

	$: successMessage = $page.url.searchParams.get('success') ?? '';
	$: packages = data.packages ?? [];
	$: selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId) ?? null;

	const formatRupiah = (value: number) =>
		new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(value);

	async function uploadProof(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		proofUploadError = '';

		if (!file) return;
		if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
			proofUploadError = 'Format bukti transfer harus JPG, PNG, atau WebP.';
			input.value = '';
			return;
		}
		if (file.size > 2 * 1024 * 1024) {
			proofUploadError = 'Ukuran bukti transfer maksimal 2MB.';
			input.value = '';
			return;
		}

		isProofUploading = true;
		try {
			const uploadForm = new FormData();
			uploadForm.append('file', file);

			const response = await fetch('/api/upload/topup-proof', {
				method: 'POST',
				body: uploadForm
			});
			const result = await response.json().catch(() => ({}));

			if (!response.ok || typeof result.url !== 'string') {
				throw new Error(result.error || 'Gagal upload bukti transfer.');
			}

			proofUrl = result.url;
		} catch (err) {
			proofUploadError = err instanceof Error ? err.message : 'Gagal upload bukti transfer.';
		} finally {
			isProofUploading = false;
			input.value = '';
		}
	}
</script>

<svelte:head>
	<title>Topup Koin - SantriOnline</title>
	<meta name="description" content="Request topup koin SantriOnline." />
</svelte:head>

<div class="space-y-6 pb-10">
	<section class="rounded-[1.75rem] border border-amber-100 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.15),_transparent_40%),linear-gradient(135deg,_#0f172a_0%,_#1f2937_45%,_#78350f_100%)] px-5 py-8 text-white shadow-xl md:px-8">
		<p class="text-xs font-semibold uppercase tracking-[0.35em] text-amber-100/75">Topup Koin</p>
		<h1 class="mt-3 text-2xl font-bold text-white md:text-3xl">Pilih Paket Koin</h1>
		<p class="mt-2 max-w-xl text-sm leading-7 text-white/70">
			Silakan transfer sesuai nominal paket yang dipilih. Coin akan masuk setelah admin
			memverifikasi bukti transfer Anda.
		</p>
	</section>

	{#if form?.message}
		<div class="rounded-2xl border border-red-200 bg-red-50 p-4">
			<p class="text-sm font-medium text-red-600">{form.message}</p>
		</div>
	{/if}

	{#if successMessage === 'topup-created'}
		<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
			<p class="text-sm font-medium text-emerald-600">
				Request topup berhasil dibuat. Admin akan memverifikasi bukti transfer Anda.
			</p>
		</div>
	{/if}

	<form method="POST" use:enhance class="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
		<div class="space-y-7">
			<fieldset>
				<legend class="text-sm font-semibold text-slate-900">Pilih Paket Topup</legend>
				<p class="mt-1 text-sm text-slate-500">
					Rasio dasar 1 coin = Rp 10. Paket lebih besar mendapatkan bonus coin.
				</p>

				<div class="mt-4 grid gap-4 sm:grid-cols-2">
					{#each packages as pkg}
						<label
							class={`cursor-pointer rounded-[1.5rem] border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
								selectedPackageId === pkg.id
									? 'border-amber-400 bg-amber-50 shadow-sm ring-2 ring-amber-200'
									: 'border-slate-200 bg-white hover:border-amber-200'
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
									<p class="text-lg font-bold text-slate-900">{pkg.name}</p>
									<p class="mt-1 text-sm text-slate-500">{pkg.description}</p>
								</div>
								<span
									class={`mt-1 h-5 w-5 rounded-full border ${
										selectedPackageId === pkg.id
											? 'border-amber-500 bg-amber-400 shadow-[inset_0_0_0_4px_white]'
											: 'border-slate-300 bg-white'
									}`}
									aria-hidden="true"
								></span>
							</div>

							<div class="mt-5 grid gap-3 rounded-2xl border border-slate-100 bg-white/75 p-4">
								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Nominal</p>
									<p class="mt-1 text-xl font-bold text-slate-900">{formatRupiah(pkg.amountRupiah)}</p>
								</div>
								<div class="flex flex-wrap items-end justify-between gap-2">
									<div>
										<p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Coin</p>
										<p class="mt-1 text-2xl font-bold text-amber-600">
											{pkg.coinAmount.toLocaleString('id-ID')} coin
										</p>
									</div>
									{#if pkg.bonusCoin > 0}
										<span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
											Bonus +{pkg.bonusCoin.toLocaleString('id-ID')} coin
										</span>
									{:else}
										<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
											Rasio standar
										</span>
									{/if}
								</div>
							</div>
						</label>
					{/each}
				</div>
			</fieldset>

			{#if selectedPackage}
				<section class="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
					<p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">Ringkasan Paket</p>
					<div class="mt-3 grid gap-3 sm:grid-cols-3">
						<div>
							<p class="text-xs text-amber-700/75">Paket</p>
							<p class="font-bold text-slate-900">{selectedPackage.name}</p>
						</div>
						<div>
							<p class="text-xs text-amber-700/75">Transfer</p>
							<p class="font-bold text-slate-900">{formatRupiah(selectedPackage.amountRupiah)}</p>
						</div>
						<div>
							<p class="text-xs text-amber-700/75">Coin diterima</p>
							<p class="font-bold text-slate-900">
								{selectedPackage.coinAmount.toLocaleString('id-ID')} coin
							</p>
						</div>
					</div>
				</section>
			{/if}

			<div class="space-y-4">
				<div>
					<label for="proof_upload" class="block text-sm font-medium text-slate-700">
						Upload Bukti Transfer
					</label>
					<input
						id="proof_upload"
						type="file"
						accept="image/jpeg,image/png,image/webp"
						disabled={isProofUploading}
						class="file-input file-input-bordered mt-2 w-full"
						on:change={uploadProof}
					/>
					<input type="hidden" name="proof_url" value={proofUrl} />
					<p class="mt-1 text-xs text-slate-500">
						Upload bukti transfer dalam format JPG, PNG, atau WebP maksimal 2MB.
					</p>
					{#if isProofUploading}
						<p class="mt-2 text-xs font-semibold text-amber-700">Mengupload bukti transfer...</p>
					{/if}
					{#if proofUploadError}
						<p class="mt-2 text-xs font-semibold text-red-600">{proofUploadError}</p>
					{/if}
					{#if proofUrl}
						<div class="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
							<p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
								Bukti terupload
							</p>
							<a
								href={proofUrl}
								target="_blank"
								rel="noreferrer"
								class="mt-2 inline-flex break-all text-sm font-medium text-emerald-700 hover:text-emerald-800"
							>
								Lihat file bukti
							</a>
							<img
								src={proofUrl}
								alt="Preview bukti transfer"
								class="mt-3 max-h-72 w-full rounded-xl border border-emerald-100 bg-white object-contain"
							/>
						</div>
					{/if}
				</div>

				<div>
					<label for="user_note" class="block text-sm font-medium text-slate-700">
						Catatan Pembayaran
					</label>
					<textarea
						id="user_note"
						name="user_note"
						bind:value={userNote}
						rows="4"
						maxlength="500"
						class="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
						placeholder="Opsional: nomor referensi transfer, nama rekening pengirim, atau info lain."
					></textarea>
					<p class="mt-1 text-xs text-slate-500">
						Opsional, maksimal 500 karakter.
					</p>
				</div>
			</div>

			<div class="rounded-2xl border border-amber-200 bg-amber-50 p-4">
				<p class="text-sm font-medium text-amber-800">Instruksi Transfer:</p>
				<ol class="mt-2 list-inside list-decimal text-sm leading-7 text-amber-700">
					<li>Pilih paket topup yang tersedia.</li>
					<li>Transfer sesuai nominal paket yang dipilih.</li>
					<li>Upload bukti transfer agar admin bisa memverifikasi.</li>
					<li>Coin akan masuk setelah admin menyetujui request Anda.</li>
				</ol>
			</div>

			<div class="flex flex-col gap-3 sm:flex-row">
				<a href="/coins" class="btn btn-outline btn-lg">Batal</a>
				<button
					type="submit"
					class="btn btn-primary btn-lg flex-1"
					disabled={isProofUploading || !selectedPackage}
				>
					{isProofUploading ? 'Menunggu Upload...' : 'Ajukan Topup'}
				</button>
			</div>
		</div>
	</form>
</div>
