<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	type Notifikasi = {
		id: string;
		kind: string;
		severity: 'urgent' | 'warning' | 'info';
		title: string;
		body: string;
		href: string;
		createdAt: number | null;
	};

	let terbuka = false;
	let notifikasi: Notifikasi[] = [];
	let jumlah = 0;
	let memuat = true;
	let gagal = false;
	let timer: ReturnType<typeof setInterval> | null = null;

	const warnaTitik = (severity: Notifikasi['severity']) =>
		severity === 'urgent'
			? 'bg-rose-500'
			: severity === 'warning'
				? 'bg-amber-500'
				: 'bg-emerald-500';

	const waktuSingkat = (createdAt: number | null) => {
		if (!createdAt) return '';
		const selisih = Date.now() - createdAt;
		if (selisih < 60_000) return 'baru saja';
		if (selisih < 3_600_000) return `${Math.floor(selisih / 60_000)} mnt lalu`;
		if (selisih < 86_400_000) return `${Math.floor(selisih / 3_600_000)} jam lalu`;
		return `${Math.floor(selisih / 86_400_000)} hari lalu`;
	};

	const muat = async () => {
		try {
			const res = await fetch('/api/admin/notifications', { headers: { accept: 'application/json' } });
			if (!res.ok) {
				gagal = true;
				return;
			}
			const data = await res.json();
			notifikasi = data.notifications ?? [];
			jumlah = data.counts?.total ?? notifikasi.length;
			gagal = false;
		} catch {
			gagal = true;
		} finally {
			memuat = false;
		}
	};

	onMount(() => {
		void muat();
		// Polling ringan; endpoint sekaligus memicu push untuk kejadian baru.
		timer = setInterval(() => void muat(), 60_000);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});
</script>

<svelte:window on:click={() => (terbuka = false)} />

<div class="relative" role="presentation" on:click|stopPropagation>
	<button
		type="button"
		aria-label={jumlah > 0 ? `Notifikasi, ${jumlah} belum ditangani` : 'Notifikasi'}
		aria-expanded={terbuka}
		class="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-so-muted shadow-sm transition hover:border-emerald-200 hover:text-so-green sm:h-11 sm:w-11"
		on:click={() => (terbuka = !terbuka)}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.8"
			class="h-5 w-5"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-5-5.9V4a1 1 0 1 0-2 0v1.1A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0m6 0H9"
			/>
		</svg>

		{#if jumlah > 0}
			<span
				class="absolute -right-1 -top-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold leading-5 text-white"
			>
				{jumlah > 99 ? '99+' : jumlah}
			</span>
		{/if}
	</button>

	{#if terbuka}
		<div
			class="absolute right-0 z-[60] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
		>
			<div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
				<p class="text-sm font-bold text-slate-900">Notifikasi</p>
				<a href="/admin/super/overview#activity-feed" class="text-xs font-semibold text-so-green hover:underline">
					Lihat semua
				</a>
			</div>

			<div class="max-h-[24rem] overflow-y-auto">
				{#if memuat}
					<p class="px-4 py-6 text-center text-sm text-slate-500">Memuat…</p>
				{:else if gagal}
					<p class="px-4 py-6 text-center text-sm text-rose-600">Gagal memuat notifikasi.</p>
				{:else if notifikasi.length === 0}
					<p class="px-4 py-6 text-center text-sm text-slate-500">Tidak ada notifikasi baru.</p>
				{:else}
					<ul class="divide-y divide-slate-100">
						{#each notifikasi as n (n.id)}
							<li>
								<a href={n.href} class="flex gap-3 px-4 py-3 transition hover:bg-slate-50">
									<span class="mt-1.5 h-2 w-2 shrink-0 rounded-full {warnaTitik(n.severity)}"></span>
									<span class="min-w-0">
										<span class="block text-sm font-semibold leading-snug text-slate-900">{n.title}</span>
										<span class="mt-0.5 block text-xs leading-5 text-slate-600">{n.body}</span>
										{#if n.createdAt}
											<span class="mt-1 block text-[11px] text-slate-400">{waktuSingkat(n.createdAt)}</span>
										{/if}
									</span>
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
</div>
