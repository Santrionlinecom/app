<script lang="ts">
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	const formatCurrency = (value: number | null | undefined) =>
		new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(value ?? 0);

	const formatDateTime = (value: number | null | undefined) =>
		value
			? new Date(value).toLocaleString('id-ID', {
					day: '2-digit',
					month: 'short',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})
			: '-';

	const plainText = (value: string | null | undefined) =>
		(value ?? '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

	const statusTone = (status: string) => {
		switch (status) {
			case 'paid':
				return 'border-emerald-200 bg-emerald-50 text-emerald-700';
			case 'failed':
				return 'border-rose-200 bg-rose-50 text-rose-700';
			case 'refunded':
				return 'border-indigo-200 bg-indigo-50 text-indigo-700';
			default:
				return 'border-amber-200 bg-amber-50 text-amber-700';
		}
	};
</script>

<svelte:head>
	<title>Order {data.order.referenceCode} - Digital Store</title>
	<meta
		name="description"
		content={`Pantau pembayaran manual untuk ${data.order.productTitle || 'produk digital'} di Santri Online.`}
	/>
</svelte:head>

<div class="space-y-8">
	<section class="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_45%,_#064e3b_100%)] px-6 py-8 text-white shadow-xl md:px-8 md:py-10">
		<div class="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
			<div>
				<p class="text-xs uppercase tracking-[0.35em] text-emerald-200/70">Tracking Order</p>
				<h1 class="mt-3 text-3xl font-bold md:text-5xl">{data.order.referenceCode}</h1>
				<p class="mt-4 max-w-2xl text-sm leading-7 text-white/75 md:text-base">
					Simpan halaman ini untuk memantau status pembayaran manual, mengunggah bukti, dan mengakses file setelah verifikasi.
				</p>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Status</p>
					<p class="mt-2 text-lg font-semibold text-white capitalize">{data.order.status}</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Nominal</p>
					<p class="mt-2 text-lg font-semibold text-white">{formatCurrency(data.order.amount)}</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Dibuat</p>
					<p class="mt-2 text-lg font-semibold text-white">{formatDateTime(data.order.createdAt)}</p>
				</div>
				<div class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
					<p class="text-[11px] uppercase tracking-[0.24em] text-white/55">Produk</p>
					<p class="mt-2 text-lg font-semibold text-white">{data.order.productTitle || 'Produk digital'}</p>
				</div>
			</div>
		</div>
	</section>

	<div class={`rounded-[1.5rem] border px-5 py-4 text-sm shadow-sm ${statusTone(data.order.status)}`}>
		{#if data.order.status === 'paid'}
			Pembayaran sudah diverifikasi. File digital siap diakses.
		{:else if data.order.status === 'failed'}
			Pembayaran perlu diperbaiki. Periksa catatan admin lalu unggah ulang bukti jika diperlukan.
		{:else if data.order.status === 'refunded'}
			Order ini ditandai sebagai refunded.
		{:else}
			Order masih menunggu verifikasi admin. Pastikan bukti bayar sudah diunggah dengan jelas.
		{/if}
	</div>

	<section class="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
		<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Detail Pembayaran</p>
					<h2 class="mt-2 text-2xl font-semibold text-slate-900">{data.order.paymentMethodName || 'Metode manual'}</h2>
				</div>
				<span class={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${statusTone(data.order.status)}`}>
					{data.order.status}
				</span>
			</div>

			<div class="mt-6 grid gap-4 md:grid-cols-2">
				<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
					<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Atas Nama</p>
					<p class="mt-2 text-base font-semibold text-slate-900">{data.order.paymentAccountName || '-'}</p>
				</div>
				<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
					<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Nomor Tujuan</p>
					<p class="mt-2 text-base font-semibold text-slate-900">{data.order.paymentAccountNumber || '-'}</p>
				</div>
			</div>

			{#if data.order.paymentAssetUrl}
				<div class="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
					<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Aset Pembayaran</p>
					<img
						src={data.order.paymentAssetUrl}
						alt={`Aset ${data.order.paymentMethodName}`}
						class="mt-4 w-full rounded-xl border border-slate-200 bg-white object-contain"
					/>
				</div>
			{/if}

			<div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
				<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Instruksi</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">
					{data.order.paymentInstructions || 'Kirim sesuai nominal lalu upload bukti bayar pada halaman ini.'}
				</p>
			</div>

			{#if data.order.adminNotes}
				<div class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
					<p class="text-xs uppercase tracking-[0.24em] text-amber-700">Catatan Admin</p>
					<p class="mt-2 text-sm leading-7 text-amber-900">{data.order.adminNotes}</p>
				</div>
			{/if}

			<div class="mt-6 flex flex-wrap gap-3">
				{#if data.order.status === 'paid'}
					<a href={`/digital-store/order/${data.order.referenceCode}/download?token=${encodeURIComponent(data.token)}`} class="btn btn-primary">
						Download File Digital
					</a>
				{/if}
				<a href={`/digital-store/${data.order.productSlug || ''}`} class="btn btn-outline">Kembali ke Produk</a>
			</div>
		</article>

		<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Bukti Bayar</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">Upload atau perbarui bukti</h2>
			<p class="mt-3 text-sm leading-7 text-slate-600">
				Admin akan memeriksa bukti yang Anda kirim. Untuk mempercepat verifikasi, pastikan nominal dan tujuan pembayaran terlihat jelas.
			</p>

			{#if form?.error}
				<div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
					{form.error}
				</div>
			{/if}
			{#if data.proofUpdated || (form && 'success' in form && form.success)}
				<div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
					Bukti bayar berhasil diunggah. Status order tetap menunggu verifikasi admin.
				</div>
			{/if}

			<div class="mt-6 space-y-4">
				<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
					<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Pembeli</p>
					<p class="mt-2 text-base font-semibold text-slate-900">{data.order.buyerName || '-'}</p>
					<p class="mt-1 text-sm text-slate-600">{data.order.buyerContact || '-'}</p>
				</div>

				{#if data.order.proofUrl}
					<div class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Bukti Terkirim</p>
						{#if data.order.proofUrl.endsWith('.pdf')}
							<a href={data.order.proofUrl} target="_blank" rel="noreferrer" class="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
								Buka Bukti PDF
							</a>
						{:else}
							<img
								src={data.order.proofUrl}
								alt={`Bukti bayar ${data.order.referenceCode}`}
								class="mt-4 w-full rounded-xl border border-slate-200 bg-white object-contain"
							/>
						{/if}
						<p class="mt-3 text-xs text-slate-500">Diunggah {formatDateTime(data.order.proofUploadedAt)}</p>
					</div>
				{/if}

				{#if data.order.status !== 'paid'}
					<form
						method="POST"
						action={`?/uploadProof&token=${encodeURIComponent(data.token)}`}
						enctype="multipart/form-data"
						class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
					>
						<input type="hidden" name="token" value={data.token} />
						<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Upload Bukti Baru</p>
						<input
							name="proofFile"
							type="file"
							accept="image/jpeg,image/png,image/webp,application/pdf"
							class="file-input file-input-bordered mt-4 w-full"
						/>
						<p class="mt-2 text-xs text-slate-500">Gunakan JPG, PNG, WEBP, atau PDF. Maksimal 8MB.</p>
						<button type="submit" class="btn btn-primary mt-4">Upload Bukti Bayar</button>
					</form>
				{/if}

				<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
					<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Ringkasan Produk</p>
					<p class="mt-2 text-base font-semibold text-slate-900">{data.order.productTitle || 'Produk digital'}</p>
					<p class="mt-2 text-sm leading-7 text-slate-600">
						{plainText(data.order.productSummary || data.order.productDescription) || 'Produk digital dari Santri Online.'}
					</p>
				</div>
			</div>
		</article>
	</section>
</div>
