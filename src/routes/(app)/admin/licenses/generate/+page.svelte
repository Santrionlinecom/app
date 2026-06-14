<script lang="ts">
	type ProductOption = {
		label: string;
		slug: string;
		plan: 'free' | 'pro';
		keyFormat: string;
		defaultMaxDevices: number;
		features: string[];
	};

	type DigitalLicenseItem = {
		licenseId: string;
		productSlug: string;
		productName: string;
		plan: string;
		status: 'active' | 'revoked' | 'expired';
		maxDevices: number | null;
		deviceLimit: number;
		expiresAt: number | null;
		createdAt: number;
		activeDevices: number | null;
	};

	type PageData = {
		productFilter: 'all' | 'cleaner' | 'studio';
		productOptions: ProductOption[];
		licenses: DigitalLicenseItem[];
	};

	type GenerateForm =
		| {
				success?: boolean;
				licenseKey?: string;
				generatedLicenseId?: string;
				productSlug?: string;
				productName?: string;
				plan?: string;
				maxDevices?: number;
				expiresAt?: number | null;
				features?: string[];
				error?: string;
				selectedProductSlug?: string;
		  }
		| undefined;

	export let data: PageData;
	export let form: GenerateForm;

	const formatDate = (value: number | null | undefined) => {
		if (value == null || !Number.isFinite(value)) return '-';
		return new Date(value).toLocaleString('id-ID', {
			year: 'numeric',
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const productFamilyLabel = (value: string) => {
		if (value === 'cleaner') return 'Santri Cleaner';
		if (value === 'studio') return 'Santri Studio';
		return 'Semua Produk';
	};

	const statusDisplay = (item: DigitalLicenseItem) => {
		const expired = item.expiresAt !== null && Date.now() > item.expiresAt;
		if (item.status === 'revoked') return { label: 'revoked', badgeClass: 'badge-error' };
		if (item.status === 'expired' || expired) return { label: 'expired', badgeClass: 'badge-warning' };
		return { label: 'active', badgeClass: 'badge-success' };
	};

	const displayLicenseKey = (item: DigitalLicenseItem) => {
		if (form?.success && form.generatedLicenseId === item.licenseId && form.licenseKey) {
			return form.licenseKey;
		}
		return 'Hash only';
	};

	const copyText = async (value: string) => {
		if (!value || value === 'Hash only') return;
		await navigator.clipboard.writeText(value);
	};

	let selectedProductSlug = form?.productSlug ?? form?.selectedProductSlug ?? data.productOptions[0]?.slug ?? '';

	$: selectedProduct =
		data.productOptions.find((product) => product.slug === selectedProductSlug) ?? data.productOptions[0];
</script>

<svelte:head>
	<title>Generate License Produk Digital</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-5 px-3 py-4 sm:px-4 md:px-6">
	<section class="rounded-2xl border bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-700 p-4 text-white shadow-sm sm:p-6">
		<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-white/70">SantriOnline Product License</p>
				<h1 class="mt-2 text-xl font-bold sm:text-2xl">Generate License Produk Digital</h1>
				<p class="mt-2 max-w-2xl text-sm text-white/85">
					Buat license baru untuk produk desktop SantriOnline seperti Santri Cleaner dan Santri Studio.
				</p>
			</div>
			<div class="flex w-full gap-2 md:w-auto">
				<a class="btn btn-sm w-full border-white/40 bg-white/10 text-white hover:bg-white/20 md:w-auto" href="/admin/licenses">
					Portal Cek License
				</a>
			</div>
		</div>
	</section>

	<section class="grid gap-5 lg:grid-cols-[1fr_1fr]">
		<div class="rounded-2xl border bg-white p-4 shadow-sm">
			<h2 class="text-lg font-semibold text-slate-900">Form Generator</h2>
			<form class="mt-4 space-y-4" method="POST" action="?/generate">
				<label class="form-control">
					<span class="label-text text-xs">Produk</span>
					<select class="select select-bordered w-full" name="productSlug" bind:value={selectedProductSlug}>
						{#each data.productOptions as product}
							<option value={product.slug}>{product.label}</option>
						{/each}
					</select>
				</label>

				<div class="grid gap-3 sm:grid-cols-2">
					<div class="rounded-xl border bg-slate-50 p-3">
						<p class="text-xs text-slate-500">Plan</p>
						<p class="mt-1 font-semibold text-slate-900">{selectedProduct?.plan ?? '-'}</p>
					</div>
					<div class="rounded-xl border bg-slate-50 p-3">
						<p class="text-xs text-slate-500">Format Key</p>
						<p class="mt-1 font-mono text-sm font-semibold text-slate-900">
							{selectedProduct?.keyFormat ?? '-'}
						</p>
					</div>
				</div>

				<label class="form-control">
					<span class="label-text text-xs">Expires At (optional)</span>
					<input class="input input-bordered w-full" type="datetime-local" name="expiresAt" />
				</label>

				<div class="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
					<p class="text-xs font-semibold text-emerald-900">Features</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each selectedProduct?.features ?? [] as feature}
							<span class="badge badge-outline border-emerald-300 text-emerald-800">{feature}</span>
						{/each}
					</div>
				</div>

				<button class="btn btn-success w-full sm:w-auto" type="submit">Generate License</button>
			</form>

			{#if form?.error}
				<p class="mt-3 text-sm text-red-600">{form.error}</p>
			{/if}
		</div>

		<div class="rounded-2xl border bg-white p-4 shadow-sm">
			<h2 class="text-lg font-semibold text-slate-900">Hasil Generate Terakhir</h2>
			{#if form?.success && form.licenseKey}
				<div class="mt-4 space-y-4">
					<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
						<p class="text-xs font-medium uppercase tracking-wide text-emerald-800">License Key</p>
						<div class="mt-2 flex flex-col gap-2 sm:flex-row">
							<textarea
								class="textarea textarea-bordered min-h-[88px] w-full resize-none font-mono text-sm leading-6 sm:min-h-[52px]"
								readonly
							>{form.licenseKey}</textarea>
							<button
								class="btn btn-success btn-outline w-full sm:w-auto"
								type="button"
								on:click={() => copyText(form?.licenseKey ?? '')}
							>
								Copy
							</button>
						</div>
						<p class="mt-2 text-xs text-emerald-800/80">
							Key asli hanya tampil setelah generate. D1 menyimpan hash dan placeholder internal.
						</p>
					</div>

					<div class="grid gap-3 sm:grid-cols-2">
						<div class="rounded-xl border p-3">
							<p class="text-xs text-slate-500">Product</p>
							<p class="mt-1 font-semibold text-slate-900">{form.productName}</p>
						</div>
						<div class="rounded-xl border p-3">
							<p class="text-xs text-slate-500">Plan</p>
							<p class="mt-1 font-semibold text-slate-900">{form.plan}</p>
						</div>
						<div class="rounded-xl border p-3">
							<p class="text-xs text-slate-500">Max Devices</p>
							<p class="mt-1 font-semibold text-slate-900">{form.maxDevices}</p>
						</div>
						<div class="rounded-xl border p-3">
							<p class="text-xs text-slate-500">Expires</p>
							<p class="mt-1 font-semibold text-slate-900">{formatDate(form.expiresAt)}</p>
						</div>
					</div>
				</div>
			{:else}
				<p class="mt-4 text-sm text-slate-500">
					Belum ada license yang digenerate pada sesi ini.
				</p>
			{/if}
		</div>
	</section>

	<section class="rounded-2xl border bg-white p-4 shadow-sm">
		<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">License Terbaru</h2>
				<p class="mt-1 text-xs text-slate-500">
					Filter aktif: {productFamilyLabel(data.productFilter)}. License key lama tidak ditampilkan ulang karena sistem baru menyimpan hash.
				</p>
			</div>
			<form class="flex flex-col gap-2 sm:flex-row sm:items-center" method="GET">
				<label class="form-control">
					<span class="label-text text-xs">Filter Produk</span>
					<select class="select select-bordered select-sm w-full sm:w-48" name="product">
						<option value="all" selected={data.productFilter === 'all'}>Semua Produk</option>
						<option value="cleaner" selected={data.productFilter === 'cleaner'}>Santri Cleaner</option>
						<option value="studio" selected={data.productFilter === 'studio'}>Santri Studio</option>
					</select>
				</label>
				<div class="flex items-end">
					<button class="btn btn-sm btn-outline w-full sm:w-auto" type="submit">Terapkan</button>
				</div>
			</form>
		</div>

		{#if data.licenses.length === 0}
			<p class="mt-4 text-sm text-slate-500">Belum ada license produk digital.</p>
		{:else}
			<div class="mt-4 space-y-3 lg:hidden">
				{#each data.licenses as item}
					{@const status = statusDisplay(item)}
					<div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="text-xs uppercase tracking-[0.18em] text-slate-400">Product</p>
								<p class="mt-1 font-semibold text-slate-900">{item.productName}</p>
							</div>
							<span class="badge {status.badgeClass} badge-outline shrink-0">{status.label}</span>
						</div>
						<div class="mt-4 grid gap-3 sm:grid-cols-2">
							<div class="rounded-lg border bg-white p-3">
								<p class="text-[11px] text-slate-500">License Key</p>
								<p class="mt-1 break-all font-mono text-xs text-slate-900">{displayLicenseKey(item)}</p>
							</div>
							<div class="rounded-lg border bg-white p-3">
								<p class="text-[11px] text-slate-500">Plan</p>
								<p class="mt-1 text-sm font-semibold text-slate-900">{item.plan}</p>
							</div>
							<div class="rounded-lg border bg-white p-3">
								<p class="text-[11px] text-slate-500">Device</p>
								<p class="mt-1 text-sm font-semibold text-slate-900">
									{Number(item.activeDevices ?? 0)} / {Number(item.maxDevices ?? item.deviceLimit ?? 1)}
								</p>
							</div>
							<div class="rounded-lg border bg-white p-3">
								<p class="text-[11px] text-slate-500">Expires</p>
								<p class="mt-1 text-sm font-semibold text-slate-900">{formatDate(item.expiresAt)}</p>
							</div>
							<div class="rounded-lg border bg-white p-3">
								<p class="text-[11px] text-slate-500">Created</p>
								<p class="mt-1 text-sm font-semibold text-slate-900">{formatDate(item.createdAt)}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="mt-4 hidden overflow-x-auto lg:block">
				<table class="table table-zebra min-w-[920px]">
					<thead>
						<tr>
							<th>Product</th>
							<th>License Key</th>
							<th>Plan</th>
							<th>Status</th>
							<th>Device</th>
							<th>Expires</th>
							<th>Created</th>
						</tr>
					</thead>
					<tbody>
						{#each data.licenses as item}
							{@const status = statusDisplay(item)}
							<tr>
								<td>
									<div>
										<p class="font-semibold text-slate-900">{item.productName}</p>
										<p class="text-xs text-slate-500">{item.productSlug}</p>
									</div>
								</td>
								<td>
									<code class="text-xs">{displayLicenseKey(item)}</code>
								</td>
								<td>{item.plan}</td>
								<td>
									<span class="badge {status.badgeClass} badge-outline">{status.label}</span>
								</td>
								<td>{Number(item.activeDevices ?? 0)} / {Number(item.maxDevices ?? item.deviceLimit ?? 1)}</td>
								<td>{formatDate(item.expiresAt)}</td>
								<td>{formatDate(item.createdAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
