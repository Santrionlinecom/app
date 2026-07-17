<script lang="ts">
	import { onMount } from 'svelte';

	type Device = {
		id: string;
		deviceName: string;
		lastActive: string;
		createdAt: string;
	};

	let devices: Device[] = [];
	let isLoading = true;
	let errorMessage = '';
	let deletingId = '';

	const formatDate = (value: string) =>
		value
			? new Date(value).toLocaleString('id-ID', {
					dateStyle: 'medium',
					timeStyle: 'short'
				})
			: '-';

	async function loadDevices() {
		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/drm/devices');
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) {
				errorMessage = payload.error || 'Daftar perangkat belum bisa dimuat.';
				return;
			}
			devices = payload.devices ?? [];
		} catch (err) {
			console.error('Load devices error:', err);
			errorMessage = 'Daftar perangkat belum bisa dimuat.';
		} finally {
			isLoading = false;
		}
	}

	async function hapusPerangkat(deviceId: string) {
		if (!confirm('Hapus perangkat ini dari akun kamu?')) return;
		deletingId = deviceId;
		errorMessage = '';

		try {
			const response = await fetch('/api/drm/devices', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ deviceId })
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) {
				errorMessage = payload.error || 'Perangkat belum berhasil dihapus.';
				return;
			}
			devices = devices.filter((device) => device.id !== deviceId);
		} catch (err) {
			console.error('Delete device error:', err);
			errorMessage = 'Perangkat belum berhasil dihapus.';
		} finally {
			deletingId = '';
		}
	}

	onMount(() => {
		void loadDevices();
	});
</script>

<svelte:head>
	<title>Perangkat Terdaftar - SantriOnline</title>
	<meta name="description" content="Kelola perangkat yang dipakai untuk membaca buku digital SantriOnline." />
</svelte:head>

<div class="mx-auto min-h-screen w-full max-w-4xl space-y-6 px-4 pb-36 pt-6 sm:px-6 md:pb-12 lg:pt-10">
	<header class="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
		<a href="/akun" class="text-sm font-semibold text-emerald-600 hover:text-emerald-600">Kembali ke Akun</a>
		<div class="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Akun</p>
				<h1 class="mt-2 text-3xl font-bold text-slate-950">Perangkat Terdaftar</h1>
				<p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
					Maksimal 3 perangkat dapat dipakai untuk reader buku. Hapus perangkat lama jika ingin mengganti
					perangkat.
				</p>
			</div>
			<div class="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600">
				{devices.length}/3 perangkat
			</div>
		</div>
	</header>

	{#if errorMessage}
		<div class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
			{errorMessage}
		</div>
	{/if}

	<section class="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
		{#if isLoading}
			<div class="py-12 text-center text-sm font-semibold text-slate-500">Memuat perangkat...</div>
		{:else if devices.length === 0}
			<div class="py-12 text-center">
				<p class="text-base font-bold text-slate-950">Belum ada perangkat terdaftar.</p>
				<p class="mt-2 text-sm text-slate-500">Perangkat akan otomatis terdaftar saat kamu membuka reader.</p>
			</div>
		{:else}
			<div class="grid gap-3">
				{#each devices as device}
					<div class="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
						<div class="min-w-0">
							<p class="truncate text-base font-bold text-slate-950">{device.deviceName}</p>
							<p class="mt-1 text-sm text-slate-500">Terakhir aktif: {formatDate(device.lastActive)}</p>
							<p class="mt-1 text-xs text-slate-400">Terdaftar: {formatDate(device.createdAt)}</p>
						</div>
						<button
							type="button"
							class="btn btn-outline btn-sm border-red-200 text-red-700 hover:border-red-500 hover:bg-red-50"
							disabled={deletingId === device.id}
							on:click={() => hapusPerangkat(device.id)}
						>
							{deletingId === device.id ? 'Menghapus...' : 'Hapus'}
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>
