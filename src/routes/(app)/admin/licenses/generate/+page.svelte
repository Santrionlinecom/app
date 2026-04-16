<script lang="ts">
	import { onMount } from 'svelte';

	type PlanType = 'monthly' | 'yearly' | 'lifetime';

	type StreamerLicenseItem = {
		id: string;
		license_key: string | null;
		plan_type: PlanType;
		status: 'active' | 'revoked';
		max_devices: number;
		created_at: number;
		expires_at: number | null;
		device_count: number;
		last_seen_at: number | null;
		last_event_type: string | null;
	};

	type ListResponse =
		| {
				ok: true;
				items: StreamerLicenseItem[];
		  }
		| {
				ok?: false;
				error?: string;
				message?: string;
		  };

	type CreateResponse =
		| {
				ok: true;
				license_key: string;
				item: StreamerLicenseItem;
		  }
		| {
				ok?: false;
				error?: string;
				message?: string;
		  };

	type DeleteResponse =
		| {
				ok: true;
				id: string;
		  }
		| {
				ok?: false;
				error?: string;
				message?: string;
		  };

	const DAY_MS = 24 * 60 * 60 * 1000;

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

	const planLabel = (plan: PlanType) => {
		if (plan === 'monthly') return 'Bulanan';
		if (plan === 'yearly') return 'Tahunan';
		return 'Lifetime';
	};

	const shortId = (value: string, length = 8) =>
		value.length <= length ? value : `${value.slice(0, length)}...`;

	const getStatusDisplay = (item: StreamerLicenseItem) => {
		if (item.status === 'revoked') {
			return { label: 'revoked', badgeClass: 'badge-error' };
		}
		if (item.last_event_type === 'deactivate') {
			return { label: 'deactivate', badgeClass: 'badge-error' };
		}
		return { label: 'active', badgeClass: 'badge-success' };
	};

	const suggestedExpiryMs = (plan: PlanType) => {
		const now = Date.now();
		if (plan === 'monthly') return now + 30 * DAY_MS;
		if (plan === 'yearly') return now + 365 * DAY_MS;
		return now;
	};

	const pad = (value: number) => String(value).padStart(2, '0');
	const toDateTimeLocal = (value: number) => {
		const d = new Date(value);
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
			d.getMinutes()
		)}`;
	};

	let items: StreamerLicenseItem[] = [];
	let loadingList = false;
	let submitting = false;
	let errorMessage = '';
	let infoMessage = '';

	let planType: PlanType = 'monthly';
	let maxDevices = 1;
	let customExpiryEnabled = false;
	let expiresAtInput = '';

	let generatedLicenseKey = '';
	let generatedItem: StreamerLicenseItem | null = null;
	let copyMessage = '';
	let copyError = '';
	let deletingId = '';

	$: if (planType === 'lifetime' && customExpiryEnabled) {
		customExpiryEnabled = false;
	}

	$: if (customExpiryEnabled && planType !== 'lifetime' && !expiresAtInput) {
		expiresAtInput = toDateTimeLocal(suggestedExpiryMs(planType));
	}

	const loadItems = async () => {
		loadingList = true;
		try {
			const response = await fetch('/api/admin/streamer-licenses?limit=50');
			const data = (await response.json().catch(() => ({}))) as ListResponse;
			if (!response.ok || !('ok' in data) || data.ok !== true) {
				throw new Error((data as { message?: string }).message || 'Gagal memuat daftar license');
			}
			items = data.items;
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Gagal memuat daftar license';
		} finally {
			loadingList = false;
		}
	};

	const copyText = async (value: string, successMessage = 'License key berhasil disalin.') => {
		copyMessage = '';
		copyError = '';
		if (!value.trim()) {
			copyError = 'License key belum tersedia untuk data ini.';
			return;
		}
		try {
			await navigator.clipboard.writeText(value);
			copyMessage = successMessage;
		} catch {
			copyError = 'Gagal menyalin otomatis. Silakan copy manual.';
		}
	};

	const generateLicense = async (event: SubmitEvent) => {
		event.preventDefault();
		errorMessage = '';
		infoMessage = '';
		copyMessage = '';
		copyError = '';

		let expiresAt: number | undefined;
		if (customExpiryEnabled && planType !== 'lifetime') {
			if (!expiresAtInput.trim()) {
				errorMessage = 'Tanggal kadaluarsa wajib diisi jika custom expiry aktif.';
				return;
			}
			const parsed = new Date(expiresAtInput).getTime();
			if (!Number.isFinite(parsed)) {
				errorMessage = 'Format tanggal kadaluarsa tidak valid.';
				return;
			}
			expiresAt = parsed;
		}

		submitting = true;
		try {
			const response = await fetch('/api/admin/streamer-licenses', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					plan_type: planType,
					max_devices: Number(maxDevices),
					expires_at: expiresAt
				})
			});
			const data = (await response.json().catch(() => ({}))) as CreateResponse;
			if (!response.ok || !('ok' in data) || data.ok !== true) {
				throw new Error((data as { message?: string }).message || 'Gagal generate license');
			}

			generatedLicenseKey = data.license_key;
			generatedItem = data.item;
			infoMessage = 'License berhasil dibuat. Key juga tersimpan di daftar License Terbaru dan bisa dicopy ulang.';
			items = [data.item, ...items.filter((item) => item.id !== data.item.id)].slice(0, 50);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Gagal generate license';
		} finally {
			submitting = false;
		}
	};

	const deleteLicense = async (item: StreamerLicenseItem) => {
		errorMessage = '';
		infoMessage = '';
		copyMessage = '';
		copyError = '';

		const label = item.license_key ?? item.id;
		if (!confirm(`Hapus license ${label}? Tindakan ini tidak bisa dibatalkan.`)) return;

		deletingId = item.id;
		try {
			const response = await fetch(`/api/admin/streamer-licenses/${item.id}`, {
				method: 'DELETE'
			});
			const data = (await response.json().catch(() => ({}))) as DeleteResponse;
			if (!response.ok || !('ok' in data) || data.ok !== true) {
				throw new Error((data as { message?: string }).message || 'Gagal menghapus license');
			}

			items = items.filter((current) => current.id !== item.id);
			if (generatedItem?.id === item.id) {
				generatedItem = null;
				generatedLicenseKey = '';
			}
			infoMessage = 'License berhasil dihapus.';
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Gagal menghapus license';
		} finally {
			deletingId = '';
		}
	};

	onMount(() => {
		void loadItems();
	});
</script>

<svelte:head>
	<title>Generate Streamer License</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-5 px-3 py-4 sm:px-4 md:px-6">
	<section class="rounded-2xl border bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-700 p-4 text-white shadow-sm sm:p-6">
		<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-white/70">Santri Streamer Desktop</p>
				<h1 class="mt-2 text-xl font-bold sm:text-2xl">Generate License</h1>
				<p class="mt-2 max-w-2xl text-sm text-white/85">
					Buat license baru untuk aplikasi desktop Santri Streamer. Key akan tersimpan di panel admin agar bisa dicopy ulang.
				</p>
			</div>
			<div class="flex w-full gap-2 md:w-auto">
				<a class="btn btn-sm w-full border-white/40 bg-white/10 text-white hover:bg-white/20 md:w-auto" href="/admin/licenses">
					Portal Cek License
				</a>
			</div>
		</div>
	</section>

	<section class="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
		<div class="rounded-2xl border bg-white p-4 shadow-sm">
			<h2 class="text-lg font-semibold text-slate-900">Form Generator</h2>
			<form class="mt-4 space-y-4" on:submit={generateLicense}>
				<div class="grid gap-4 sm:grid-cols-2">
					<label class="form-control">
						<span class="label-text text-xs">Plan</span>
						<select class="select select-bordered w-full" bind:value={planType}>
							<option value="monthly">Bulanan</option>
							<option value="yearly">Tahunan</option>
							<option value="lifetime">Lifetime</option>
						</select>
					</label>
					<label class="form-control">
						<span class="label-text text-xs">Max Devices</span>
						<input
							class="input input-bordered w-full"
							type="number"
							min="1"
							max="50"
							step="1"
							bind:value={maxDevices}
						/>
					</label>
				</div>

				<div class="rounded-xl border p-3 sm:p-4">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div class="min-w-0">
							<p class="text-sm font-medium text-slate-900">Expiry</p>
							<p class="text-xs text-slate-500">
								{#if planType === 'lifetime'}
									Lifetime tidak menggunakan tanggal kadaluarsa.
								{:else if customExpiryEnabled}
									Gunakan tanggal kadaluarsa custom.
								{:else}
									Kadaluarsa otomatis mengikuti plan ({planLabel(planType)}).
								{/if}
							</p>
						</div>
						<label class="label cursor-pointer justify-start gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 sm:border-0 sm:px-0 sm:py-0">
							<span class="label-text text-xs">Custom expiry</span>
							<input
								class="toggle toggle-sm"
								type="checkbox"
								bind:checked={customExpiryEnabled}
								disabled={planType === 'lifetime'}
							/>
						</label>
					</div>

					{#if customExpiryEnabled && planType !== 'lifetime'}
						<label class="form-control mt-3">
							<span class="label-text text-xs">Tanggal Kadaluarsa</span>
							<input class="input input-bordered w-full" type="datetime-local" bind:value={expiresAtInput} />
						</label>
					{/if}
				</div>

				<div class="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
					<button class="btn btn-primary w-full sm:w-auto" type="submit" disabled={submitting}>
						{submitting ? 'Membuat...' : 'Generate License'}
					</button>
					<button class="btn btn-outline w-full sm:w-auto" type="button" on:click={loadItems} disabled={loadingList || submitting}>
						{loadingList ? 'Memuat...' : 'Refresh Daftar'}
					</button>
				</div>
			</form>
			{#if infoMessage}
				<p class="mt-3 text-sm text-emerald-700">{infoMessage}</p>
			{/if}
			{#if errorMessage}
				<p class="mt-3 text-sm text-red-600">{errorMessage}</p>
			{/if}
		</div>

		<div class="rounded-2xl border bg-white p-4 shadow-sm">
			<h2 class="text-lg font-semibold text-slate-900">Hasil Generate Terakhir</h2>
			{#if generatedLicenseKey && generatedItem}
				<div class="mt-4 space-y-4">
					<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
						<p class="text-xs font-medium uppercase tracking-wide text-emerald-800">License Key</p>
						<div class="mt-2 flex flex-col gap-2 sm:flex-row">
							<textarea
								class="textarea textarea-bordered min-h-[88px] w-full resize-none font-mono text-sm leading-6 sm:min-h-[52px]"
								readonly
							>{generatedLicenseKey}</textarea>
							<button
								class="btn btn-success btn-outline w-full sm:w-auto"
								type="button"
								on:click={() => copyText(generatedLicenseKey, 'License key terbaru berhasil disalin.')}
							>
								Copy
							</button>
						</div>
						<p class="mt-2 text-xs text-emerald-800/80">
							Key ini juga tersedia di tabel License Terbaru agar bisa dicopy kembali saat dibutuhkan.
						</p>
						{#if copyMessage}
							<p class="mt-2 text-xs text-emerald-900">{copyMessage}</p>
						{/if}
						{#if copyError}
							<p class="mt-2 text-xs text-red-700">{copyError}</p>
						{/if}
					</div>

					<div class="grid gap-3 sm:grid-cols-2">
						<div class="rounded-xl border p-3">
							<p class="text-xs text-slate-500">Plan</p>
							<p class="mt-1 font-semibold text-slate-900">{planLabel(generatedItem.plan_type)}</p>
						</div>
						<div class="rounded-xl border p-3">
							<p class="text-xs text-slate-500">Max Devices</p>
							<p class="mt-1 font-semibold text-slate-900">{generatedItem.max_devices}</p>
						</div>
						<div class="rounded-xl border p-3">
							<p class="text-xs text-slate-500">Created</p>
							<p class="mt-1 font-semibold text-slate-900">{formatDate(generatedItem.created_at)}</p>
						</div>
						<div class="rounded-xl border p-3">
							<p class="text-xs text-slate-500">Expires</p>
							<p class="mt-1 font-semibold text-slate-900">{formatDate(generatedItem.expires_at)}</p>
						</div>
					</div>

					<div class="rounded-xl border p-3">
						<p class="text-xs text-slate-500">Petunjuk Singkat</p>
						<p class="mt-1 break-words text-sm text-slate-700">
							Masukkan <code class="break-all rounded bg-slate-100 px-1 py-0.5">{generatedLicenseKey}</code> ke form aktivasi di aplikasi
							desktop Santri Streamer.
						</p>
					</div>
				</div>
			{:else}
				<p class="mt-4 text-sm text-slate-500">
					Belum ada license yang digenerate pada sesi ini. Hasil key baru akan muncul di sini.
				</p>
			{/if}
		</div>
	</section>

	<section class="rounded-2xl border bg-white p-4 shadow-sm">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<h2 class="text-lg font-semibold text-slate-900">License Terbaru</h2>
			<button class="btn btn-sm btn-outline w-full sm:w-auto" type="button" on:click={loadItems} disabled={loadingList || submitting}>
				{loadingList ? 'Memuat...' : 'Refresh'}
			</button>
		</div>
		<p class="mt-1 text-xs text-slate-500">
			License key bisa dicopy langsung dari daftar ini. Data lama sebelum update mungkin belum memiliki key plaintext.
		</p>
		{#if copyMessage}
			<p class="mt-2 text-xs text-emerald-700">{copyMessage}</p>
		{/if}
		{#if copyError}
			<p class="mt-2 text-xs text-red-600">{copyError}</p>
		{/if}

		{#if items.length === 0}
			<p class="mt-4 text-sm text-slate-500">{loadingList ? 'Memuat data...' : 'Belum ada data license.'}</p>
		{:else}
			<div class="mt-4 space-y-3 lg:hidden">
				{#each items as item}
					{@const statusDisplay = getStatusDisplay(item)}
					<div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="text-xs uppercase tracking-[0.18em] text-slate-400">License</p>
								<p class="mt-1 font-mono text-sm font-semibold break-all text-slate-900">
									{item.license_key ?? 'Tidak tersedia'}
								</p>
							</div>
							<span class="badge {statusDisplay.badgeClass} badge-outline shrink-0">
								{statusDisplay.label}
							</span>
						</div>

						<div class="mt-4 grid grid-cols-2 gap-3">
							<div class="rounded-lg border bg-white p-3">
								<p class="text-[11px] text-slate-500">ID</p>
								<p class="mt-1 font-mono text-xs text-slate-900">{shortId(item.id)}</p>
							</div>
							<div class="rounded-lg border bg-white p-3">
								<p class="text-[11px] text-slate-500">Plan</p>
								<p class="mt-1 text-sm font-semibold text-slate-900">{planLabel(item.plan_type)}</p>
							</div>
							<div class="rounded-lg border bg-white p-3">
								<p class="text-[11px] text-slate-500">Device</p>
								<p class="mt-1 text-sm font-semibold text-slate-900">{item.device_count} / {item.max_devices}</p>
							</div>
							<div class="rounded-lg border bg-white p-3">
								<p class="text-[11px] text-slate-500">Last Seen</p>
								<p class="mt-1 text-sm font-semibold text-slate-900">{formatDate(item.last_seen_at)}</p>
							</div>
							<div class="rounded-lg border bg-white p-3">
								<p class="text-[11px] text-slate-500">Expires</p>
								<p class="mt-1 text-sm font-semibold text-slate-900">{formatDate(item.expires_at)}</p>
							</div>
							<div class="rounded-lg border bg-white p-3">
								<p class="text-[11px] text-slate-500">Created</p>
								<p class="mt-1 text-sm font-semibold text-slate-900">{formatDate(item.created_at)}</p>
							</div>
						</div>

						<div class="mt-4 grid gap-2 sm:grid-cols-2">
							<button
								class="btn btn-sm btn-outline w-full"
								type="button"
								on:click={() => copyText(item.license_key ?? '', `License key ${item.id.slice(0, 8)} berhasil disalin.`)}
								disabled={!item.license_key || deletingId === item.id}
							>
								Copy
							</button>
							<button
								class="btn btn-sm btn-outline btn-error w-full"
								type="button"
								on:click={() => deleteLicense(item)}
								disabled={deletingId === item.id}
							>
								{deletingId === item.id ? 'Menghapus...' : 'Hapus'}
							</button>
						</div>
					</div>
				{/each}
			</div>

			<div class="mt-4 hidden overflow-x-auto lg:block">
				<table class="table table-zebra min-w-[980px]">
					<thead>
						<tr>
							<th>ID</th>
							<th>License Key</th>
							<th>Plan</th>
							<th>Status</th>
							<th>Device</th>
							<th>Expires</th>
							<th>Created</th>
							<th>Last Seen</th>
							<th class="text-right">Aksi</th>
						</tr>
					</thead>
						<tbody>
							{#each items as item}
								{@const statusDisplay = getStatusDisplay(item)}
							<tr>
								<td>
									<code class="text-xs">{shortId(item.id)}</code>
								</td>
								<td>
									{#if item.license_key}
										<code class="text-xs">{item.license_key}</code>
									{:else}
										<span class="text-xs text-slate-400">Tidak tersedia</span>
									{/if}
								</td>
								<td>{planLabel(item.plan_type)}</td>
								<td>
									<span class="badge {statusDisplay.badgeClass} badge-outline">
										{statusDisplay.label}
									</span>
								</td>
								<td>{item.device_count} / {item.max_devices}</td>
								<td>{formatDate(item.expires_at)}</td>
								<td>{formatDate(item.created_at)}</td>
								<td>{formatDate(item.last_seen_at)}</td>
								<td class="text-right">
									<div class="flex justify-end gap-2">
										<button
											class="btn btn-xs btn-outline"
											type="button"
											on:click={() =>
												copyText(item.license_key ?? '', `License key ${item.id.slice(0, 8)} berhasil disalin.`)}
											disabled={!item.license_key || deletingId === item.id}
										>
											Copy
										</button>
										<button
											class="btn btn-xs btn-outline btn-error"
											type="button"
											on:click={() => deleteLicense(item)}
											disabled={deletingId === item.id}
										>
											{deletingId === item.id ? 'Menghapus...' : 'Hapus'}
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
