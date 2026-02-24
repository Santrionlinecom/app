<script lang="ts">
	import { onMount } from 'svelte';

	type PlanType = 'monthly' | 'yearly' | 'lifetime';

	type StreamerLicenseItem = {
		id: string;
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

	const copyText = async (value: string) => {
		copyMessage = '';
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			copyMessage = 'License key berhasil disalin.';
		} catch {
			copyMessage = 'Gagal menyalin otomatis. Silakan copy manual.';
		}
	};

	const generateLicense = async (event: SubmitEvent) => {
		event.preventDefault();
		errorMessage = '';
		infoMessage = '';
		copyMessage = '';

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
			infoMessage = 'License berhasil dibuat. Simpan/copy key sekarang karena plaintext tidak disimpan.';
			items = [data.item, ...items.filter((item) => item.id !== data.item.id)].slice(0, 50);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Gagal generate license';
		} finally {
			submitting = false;
		}
	};

	onMount(() => {
		void loadItems();
	});
</script>

<svelte:head>
	<title>Generate Streamer License</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
	<section class="rounded-2xl border bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-700 p-6 text-white shadow-sm">
		<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-white/70">Santri Streamer Desktop</p>
				<h1 class="mt-2 text-2xl font-bold">Generate License</h1>
				<p class="mt-2 text-sm text-white/85">
					Buat license baru untuk aplikasi desktop Santri Streamer. Sistem hanya menyimpan hash license key.
				</p>
			</div>
			<div class="flex gap-2">
				<a class="btn btn-sm border-white/40 bg-white/10 text-white hover:bg-white/20" href="/admin/licenses">
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
						<select class="select select-bordered" bind:value={planType}>
							<option value="monthly">Bulanan</option>
							<option value="yearly">Tahunan</option>
							<option value="lifetime">Lifetime</option>
						</select>
					</label>
					<label class="form-control">
						<span class="label-text text-xs">Max Devices</span>
						<input
							class="input input-bordered"
							type="number"
							min="1"
							max="50"
							step="1"
							bind:value={maxDevices}
						/>
					</label>
				</div>

				<div class="rounded-xl border p-3">
					<div class="flex items-start justify-between gap-3">
						<div>
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
						<label class="label cursor-pointer gap-2">
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
							<input class="input input-bordered" type="datetime-local" bind:value={expiresAtInput} />
						</label>
					{/if}
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<button class="btn btn-primary" type="submit" disabled={submitting}>
						{submitting ? 'Membuat...' : 'Generate License'}
					</button>
					<button class="btn btn-outline" type="button" on:click={loadItems} disabled={loadingList || submitting}>
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
					<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
						<p class="text-xs font-medium uppercase tracking-wide text-emerald-800">License Key</p>
						<div class="mt-2 flex flex-col gap-2 sm:flex-row">
							<input class="input input-bordered w-full font-mono text-sm" readonly value={generatedLicenseKey} />
							<button class="btn btn-success btn-outline" type="button" on:click={() => copyText(generatedLicenseKey)}>
								Copy
							</button>
						</div>
						<p class="mt-2 text-xs text-emerald-800/80">
							Key plaintext tidak bisa ditampilkan lagi setelah halaman ditutup/reload.
						</p>
						{#if copyMessage}
							<p class="mt-2 text-xs text-emerald-900">{copyMessage}</p>
						{/if}
					</div>

					<div class="grid gap-3 sm:grid-cols-2">
						<div class="rounded-xl border p-3">
							<p class="text-xs text-slate-500">Plan</p>
							<p class="mt-1 font-semibold text-slate-900">{generatedItem.plan_type}</p>
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
						<p class="mt-1 text-sm text-slate-700">
							Masukkan <code class="rounded bg-slate-100 px-1 py-0.5">{generatedLicenseKey}</code> ke form aktivasi di aplikasi
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
		<div class="flex items-center justify-between gap-3">
			<h2 class="text-lg font-semibold text-slate-900">License Terbaru</h2>
			<button class="btn btn-sm btn-outline" type="button" on:click={loadItems} disabled={loadingList || submitting}>
				{loadingList ? 'Memuat...' : 'Refresh'}
			</button>
		</div>
		<p class="mt-1 text-xs text-slate-500">
			Daftar ini tidak menampilkan plaintext license key karena yang tersimpan di database hanya hash.
		</p>

		{#if items.length === 0}
			<p class="mt-4 text-sm text-slate-500">{loadingList ? 'Memuat data...' : 'Belum ada data license.'}</p>
		{:else}
			<div class="mt-4 overflow-x-auto">
				<table class="table table-zebra">
					<thead>
						<tr>
							<th>ID</th>
							<th>Plan</th>
							<th>Status</th>
							<th>Device</th>
							<th>Expires</th>
							<th>Created</th>
							<th>Last Seen</th>
						</tr>
					</thead>
					<tbody>
						{#each items as item}
							{@const statusDisplay = getStatusDisplay(item)}
							<tr>
								<td>
									<code class="text-xs">{item.id.slice(0, 8)}...</code>
								</td>
								<td>{item.plan_type}</td>
								<td>
									<span class="badge {statusDisplay.badgeClass} badge-outline">
										{statusDisplay.label}
									</span>
								</td>
								<td>{item.device_count} / {item.max_devices}</td>
								<td>{formatDate(item.expires_at)}</td>
								<td>{formatDate(item.created_at)}</td>
								<td>{formatDate(item.last_seen_at)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
