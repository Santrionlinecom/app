<script lang="ts">
	type Product = {
		id: string;
		slug: string;
		name: string;
		plan: 'free' | 'pro';
		defaultMaxDevices: number;
		features: string[];
	};

	type LicenseItem = {
		licenseId: string;
		userId: string | null;
		userEmail: string | null;
		status: 'active' | 'revoked' | 'expired';
		plan: string;
		maxDevices: number | null;
		deviceLimit: number;
		expiresAt: number | null;
		createdAt: number;
		updatedAt: number | null;
		activatedAt: number | null;
		productSlug: string | null;
		productName: string | null;
		activeDevices: number | null;
		notes: string | null;
	};

	type Activation = {
		id: string;
		deviceHash: string;
		deviceName: string | null;
		status: 'active' | 'deactivated';
		activatedAt: number;
		lastSeenAt: number;
		deactivatedAt: number | null;
	};

	export let data: {
		q: string;
		productSlug: string;
		status: 'all' | 'active' | 'revoked' | 'expired';
		products: Product[];
		licenses: LicenseItem[];
		selected: LicenseItem | null;
		activations: Activation[];
	};
	export let form:
		| {
				success?: boolean;
				message?: string;
				error?: string;
				licenseId?: string;
		  }
		| undefined;

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

	const statusBadge = (item: LicenseItem) => {
		const expired = item.expiresAt !== null && Date.now() > item.expiresAt;
		if (item.status === 'revoked') return { label: 'revoked', className: 'badge-error' };
		if (item.status === 'expired' || expired) return { label: 'expired', className: 'badge-warning' };
		return { label: 'active', className: 'badge-success' };
	};

	const toLocalInput = (value: number | null | undefined) => {
		if (value == null || !Number.isFinite(value)) return '';
		const d = new Date(value);
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	};

	$: selectedHref = (id: string) => {
		const params = new URLSearchParams();
		if (data.q) params.set('q', data.q);
		if (data.productSlug) params.set('product', data.productSlug);
		if (data.status && data.status !== 'all') params.set('status', data.status);
		params.set('id', id);
		return `/admin/licenses/manage?${params.toString()}`;
	};
</script>

<svelte:head>
	<title>Portal Lisensi Produk Digital</title>
</svelte:head>

<div class="mx-auto max-w-7xl space-y-5 px-3 py-4 sm:px-4 md:px-6">
	<section class="rounded-2xl border bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-800 p-4 text-white shadow-sm sm:p-6">
		<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-white/70">SantriOnline Digital Licensing</p>
				<h1 class="mt-2 text-xl font-bold sm:text-2xl">Portal Lisensi Produk Digital</h1>
				<p class="mt-2 max-w-3xl text-sm text-white/85">
					Kelola lisensi desktop terpadu: daftar, revoke/reactivate, reset device, expiry, aktivasi, dan
					pencarian pelanggan/produk. Key plaintext tidak ditampilkan ulang.
				</p>
			</div>
			<div class="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
				<a class="btn btn-sm border-white/40 bg-white/10 text-white hover:bg-white/20" href="/admin/licenses/generate">
					Generate Key
				</a>
				<a class="btn btn-sm border-white/40 bg-white/10 text-white hover:bg-white/20" href="/admin/licenses">
					Portal Streamer (lama)
				</a>
			</div>
		</div>
	</section>

	{#if form?.error}
		<div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form.error}</div>
	{/if}
	{#if form?.success && form.message}
		<div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
			{form.message}
		</div>
	{/if}

	<section class="rounded-2xl border bg-white p-4 shadow-sm">
		<form class="grid gap-3 md:grid-cols-4" method="GET">
			<label class="form-control md:col-span-2">
				<span class="label-text text-xs">Cari (email / id / produk / notes)</span>
				<input class="input input-bordered w-full" name="q" value={data.q} placeholder="contoh: guru@tpq.id atau santriprint" />
			</label>
			<label class="form-control">
				<span class="label-text text-xs">Produk</span>
				<select class="select select-bordered w-full" name="product">
					<option value="">Semua produk</option>
					{#each data.products as product}
						<option value={product.slug} selected={data.productSlug === product.slug}>{product.name}</option>
					{/each}
				</select>
			</label>
			<label class="form-control">
				<span class="label-text text-xs">Status</span>
				<select class="select select-bordered w-full" name="status">
					<option value="all" selected={data.status === 'all'}>Semua</option>
					<option value="active" selected={data.status === 'active'}>Active</option>
					<option value="revoked" selected={data.status === 'revoked'}>Revoked</option>
					<option value="expired" selected={data.status === 'expired'}>Expired</option>
				</select>
			</label>
			<div class="md:col-span-4">
				<button class="btn btn-success" type="submit">Terapkan filter</button>
			</div>
		</form>
	</section>

	<section class="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
		<div class="overflow-hidden rounded-2xl border bg-white shadow-sm">
			<div class="border-b px-4 py-3">
				<h2 class="font-semibold text-slate-900">Daftar Lisensi ({data.licenses.length})</h2>
				<p class="text-xs text-slate-500">Key asli tidak disimpan/ditampilkan ulang. Hanya internal ID.</p>
			</div>
			<div class="overflow-x-auto">
				<table class="table table-sm">
					<thead>
						<tr>
							<th>Produk</th>
							<th>Pelanggan</th>
							<th>Status</th>
							<th>Device</th>
							<th>Expiry</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.licenses as item}
							{@const badge = statusBadge(item)}
							<tr class={data.selected?.licenseId === item.licenseId ? 'bg-emerald-50' : ''}>
								<td>
									<div class="font-medium text-slate-900">{item.productName ?? item.productSlug ?? '-'}</div>
									<div class="font-mono text-[11px] text-slate-500">{item.licenseId}</div>
								</td>
								<td>
									<div>{item.userEmail ?? '-'}</div>
									<div class="text-[11px] text-slate-500">{item.userId ?? ''}</div>
								</td>
								<td><span class={`badge ${badge.className}`}>{badge.label}</span></td>
								<td>
									{item.activeDevices ?? 0}/{item.maxDevices ?? item.deviceLimit ?? 1}
								</td>
								<td class="text-xs">{formatDate(item.expiresAt)}</td>
								<td>
									<a class="btn btn-ghost btn-xs" href={selectedHref(item.licenseId)}>Detail</a>
								</td>
							</tr>
						{/each}
						{#if data.licenses.length === 0}
							<tr>
								<td colspan="6" class="py-8 text-center text-sm text-slate-500">Belum ada lisensi digital.</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>

		<div class="space-y-4">
			{#if data.selected}
				{@const selectedBadge = statusBadge(data.selected)}
				<div class="rounded-2xl border bg-white p-4 shadow-sm">
					<div class="flex items-start justify-between gap-3">
						<div>
							<h2 class="text-lg font-semibold text-slate-900">{data.selected.productName}</h2>
							<p class="font-mono text-xs text-slate-500">{data.selected.licenseId}</p>
						</div>
						<span class={`badge ${selectedBadge.className}`}>{selectedBadge.label}</span>
					</div>

					<div class="mt-4 grid gap-3 sm:grid-cols-2">
						<div class="rounded-xl border bg-slate-50 p-3">
							<p class="text-xs text-slate-500">Plan</p>
							<p class="font-semibold">{data.selected.plan}</p>
						</div>
						<div class="rounded-xl border bg-slate-50 p-3">
							<p class="text-xs text-slate-500">Aktivasi aktif</p>
							<p class="font-semibold">
								{data.selected.activeDevices ?? 0}/{data.selected.maxDevices ?? data.selected.deviceLimit}
							</p>
						</div>
						<div class="rounded-xl border bg-slate-50 p-3">
							<p class="text-xs text-slate-500">Dibuat</p>
							<p class="font-semibold text-sm">{formatDate(data.selected.createdAt)}</p>
						</div>
						<div class="rounded-xl border bg-slate-50 p-3">
							<p class="text-xs text-slate-500">Update</p>
							<p class="font-semibold text-sm">{formatDate(data.selected.updatedAt)}</p>
						</div>
					</div>

					<div class="mt-4 flex flex-wrap gap-2">
						<form method="POST" action="?/revoke">
							<input type="hidden" name="licenseId" value={data.selected.licenseId} />
							<button class="btn btn-error btn-sm" type="submit">Revoke</button>
						</form>
						<form method="POST" action="?/reactivate">
							<input type="hidden" name="licenseId" value={data.selected.licenseId} />
							<button class="btn btn-success btn-sm" type="submit">Reactivate</button>
						</form>
						<form method="POST" action="?/resetDevices">
							<input type="hidden" name="licenseId" value={data.selected.licenseId} />
							<button class="btn btn-warning btn-sm" type="submit">Reset semua device</button>
						</form>
					</div>
				</div>

				<div class="rounded-2xl border bg-white p-4 shadow-sm">
					<h3 class="font-semibold text-slate-900">Pelanggan & notes</h3>
					<form class="mt-3 space-y-3" method="POST" action="?/setCustomer">
						<input type="hidden" name="licenseId" value={data.selected.licenseId} />
						<label class="form-control">
							<span class="label-text text-xs">Email pelanggan</span>
							<input class="input input-bordered w-full" name="userEmail" value={data.selected.userEmail ?? ''} />
						</label>
						<label class="form-control">
							<span class="label-text text-xs">Notes</span>
							<textarea class="textarea textarea-bordered w-full" name="notes" rows="3">{data.selected.notes ?? ''}</textarea>
						</label>
						<button class="btn btn-outline btn-sm" type="submit">Simpan pelanggan</button>
					</form>
				</div>

				<div class="rounded-2xl border bg-white p-4 shadow-sm">
					<h3 class="font-semibold text-slate-900">Expiry</h3>
					<form class="mt-3 space-y-3" method="POST" action="?/setExpiry">
						<input type="hidden" name="licenseId" value={data.selected.licenseId} />
						<label class="form-control">
							<span class="label-text text-xs">Expires at (kosongkan = lifetime)</span>
							<input
								class="input input-bordered w-full"
								type="datetime-local"
								name="expiresAt"
								value={toLocalInput(data.selected.expiresAt)}
							/>
						</label>
						<button class="btn btn-outline btn-sm" type="submit">Update expiry</button>
					</form>
				</div>

				<div class="rounded-2xl border bg-white p-4 shadow-sm">
					<h3 class="font-semibold text-slate-900">Perangkat ({data.activations.length})</h3>
					<div class="mt-3 space-y-2">
						{#each data.activations as device}
							<div class="rounded-xl border p-3">
								<div class="flex items-start justify-between gap-2">
									<div>
										<p class="font-medium text-slate-900">{device.deviceName || 'Tanpa nama'}</p>
										<p class="font-mono text-[11px] text-slate-500">{device.deviceHash}</p>
										<p class="mt-1 text-xs text-slate-500">
											Last seen: {formatDate(device.lastSeenAt)} · {device.status}
										</p>
									</div>
									{#if device.status === 'active'}
										<form method="POST" action="?/deactivateDevice">
											<input type="hidden" name="licenseId" value={data.selected.licenseId} />
											<input type="hidden" name="deviceHash" value={device.deviceHash} />
											<button class="btn btn-ghost btn-xs text-red-600" type="submit">Nonaktifkan</button>
										</form>
									{/if}
								</div>
							</div>
						{/each}
						{#if data.activations.length === 0}
							<p class="text-sm text-slate-500">Belum ada aktivasi perangkat.</p>
						{/if}
					</div>
				</div>
			{:else}
				<div class="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
					Pilih lisensi dari daftar untuk revoke, reset device, expiry, dan detail aktivasi.
				</div>
			{/if}
		</div>
	</section>
</div>
