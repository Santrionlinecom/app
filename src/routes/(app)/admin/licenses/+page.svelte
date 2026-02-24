<script lang="ts">
	type DeviceItem = {
		id: string;
		license_id: string;
		device_id_hash: string;
		activated_at: number;
		last_seen_at: number;
	};

	type StatusResponse = {
		ok: true;
		license: {
			id: string;
			plan_type: 'monthly' | 'yearly' | 'lifetime';
			status: 'active' | 'revoked' | 'expired';
			status_db: 'active' | 'revoked';
			expires_at: number | null;
			valid_until: number | null;
			max_devices: number;
			created_at: number;
		};
		device_count: number;
		devices: DeviceItem[];
	};

	type ErrorResponse = {
		ok?: false;
		error?: string;
		message?: string;
	};

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

	let licenseKey = '';
	let loading = false;
	let revokingDeviceHash = '';
	let errorMessage = '';
	let infoMessage = '';
	let result: StatusResponse | null = null;

	const fetchStatus = async () => {
		errorMessage = '';
		infoMessage = '';
		if (!licenseKey.trim()) {
			errorMessage = 'License key wajib diisi';
			result = null;
			return;
		}

		loading = true;
		try {
			const response = await fetch('/api/license/status', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ license_key: licenseKey.trim() })
			});
			const data = (await response.json().catch(() => ({}))) as StatusResponse | ErrorResponse;
			if (!response.ok || !('ok' in data) || data.ok !== true) {
				throw new Error((data as ErrorResponse)?.message || 'Gagal mengambil status license');
			}
			result = data;
			infoMessage = 'Status license berhasil dimuat.';
		} catch (err) {
			result = null;
			errorMessage = err instanceof Error ? err.message : 'Gagal mengambil status license';
		} finally {
			loading = false;
		}
	};

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		await fetchStatus();
	};

	const revokeDevice = async (deviceIdHash: string) => {
		if (!result) return;
		if (!licenseKey.trim()) return;
		if (!confirm(`Revoke device ${deviceIdHash}?`)) return;

		revokingDeviceHash = deviceIdHash;
		errorMessage = '';
		infoMessage = '';
		try {
			const response = await fetch('/api/license/revoke-device', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					license_key: licenseKey.trim(),
					device_id_hash: deviceIdHash
				})
			});
			const data = (await response.json().catch(() => ({}))) as { removed?: number; message?: string };
			if (!response.ok) {
				throw new Error(data?.message || 'Gagal revoke device');
			}
			infoMessage = `Device berhasil dihapus (${Number(data?.removed ?? 0)}).`;
			await fetchStatus();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Gagal revoke device';
		} finally {
			revokingDeviceHash = '';
		}
	};
</script>

<svelte:head>
	<title>Portal License</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
	<section class="rounded-2xl border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-sm">
		<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-white/70">Santri Streamer</p>
				<h1 class="mt-2 text-2xl font-bold">Portal Cek License</h1>
				<p class="mt-2 text-sm text-white/80">
					Cek status license streamer, lihat daftar device terdaftar, dan revoke device bila diperlukan.
				</p>
			</div>
			<div class="flex gap-2">
				<a class="btn btn-sm border-white/40 bg-white/10 text-white hover:bg-white/20" href="/admin/licenses/generate">
					Generate License
				</a>
			</div>
		</div>
	</section>

	<section class="rounded-2xl border bg-white p-4 shadow-sm">
		<form class="grid gap-3 md:grid-cols-[1fr_auto]" on:submit={handleSubmit}>
			<label class="form-control">
				<span class="label-text text-xs">License Key</span>
				<input
					class="input input-bordered w-full"
					type="text"
					bind:value={licenseKey}
					placeholder="Masukkan license key"
					autocomplete="off"
				/>
			</label>
			<div class="flex items-end">
				<button class="btn btn-primary w-full md:w-auto" type="submit" disabled={loading}>
					{loading ? 'Memuat...' : 'Cek Status'}
				</button>
			</div>
		</form>
		<p class="mt-2 text-xs text-slate-500">Frontend hanya mengirim request ke API. Signing secret tetap di server.</p>
		{#if infoMessage}
			<p class="mt-3 text-sm text-emerald-700">{infoMessage}</p>
		{/if}
		{#if errorMessage}
			<p class="mt-3 text-sm text-red-600">{errorMessage}</p>
		{/if}
	</section>

	{#if result}
		<section class="rounded-2xl border bg-white p-4 shadow-sm">
			<h2 class="text-lg font-semibold text-slate-900">Status License</h2>
			<div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				<div class="rounded-xl border p-3">
					<p class="text-xs text-slate-500">Plan</p>
					<p class="mt-1 font-semibold text-slate-900">{result.license.plan_type}</p>
				</div>
				<div class="rounded-xl border p-3">
					<p class="text-xs text-slate-500">Status</p>
					<p class="mt-1 font-semibold text-slate-900">{result.license.status}</p>
				</div>
				<div class="rounded-xl border p-3">
					<p class="text-xs text-slate-500">Device</p>
					<p class="mt-1 font-semibold text-slate-900">{result.device_count} / {result.license.max_devices}</p>
				</div>
				<div class="rounded-xl border p-3">
					<p class="text-xs text-slate-500">Valid Until</p>
					<p class="mt-1 font-semibold text-slate-900">{formatDate(result.license.valid_until)}</p>
				</div>
				<div class="rounded-xl border p-3">
					<p class="text-xs text-slate-500">Expires (DB)</p>
					<p class="mt-1 font-semibold text-slate-900">{formatDate(result.license.expires_at)}</p>
				</div>
				<div class="rounded-xl border p-3">
					<p class="text-xs text-slate-500">Created</p>
					<p class="mt-1 font-semibold text-slate-900">{formatDate(result.license.created_at)}</p>
				</div>
			</div>
		</section>

		<section class="rounded-2xl border bg-white p-4 shadow-sm">
			<div class="flex items-center justify-between gap-3">
				<h2 class="text-lg font-semibold text-slate-900">Device Terdaftar</h2>
				<button class="btn btn-sm btn-outline" type="button" on:click={fetchStatus} disabled={loading || !!revokingDeviceHash}>
					Refresh
				</button>
			</div>

			{#if result.devices.length === 0}
				<p class="mt-4 text-sm text-slate-500">Belum ada device terdaftar.</p>
			{:else}
				<div class="mt-3 overflow-x-auto">
					<table class="table table-zebra">
						<thead>
							<tr>
								<th>Device Hash</th>
								<th>Activated</th>
								<th>Last Seen</th>
								<th class="text-right">Aksi</th>
							</tr>
						</thead>
						<tbody>
							{#each result.devices as device}
								<tr>
									<td>
										<code class="text-xs">{device.device_id_hash}</code>
									</td>
									<td>{formatDate(device.activated_at)}</td>
									<td>{formatDate(device.last_seen_at)}</td>
									<td class="text-right">
										<button
											class="btn btn-xs btn-error btn-outline"
											type="button"
											on:click={() => revokeDevice(device.device_id_hash)}
											disabled={!!revokingDeviceHash}
										>
											{revokingDeviceHash === device.device_id_hash ? 'Memproses...' : 'Revoke'}
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>
	{/if}
</div>
