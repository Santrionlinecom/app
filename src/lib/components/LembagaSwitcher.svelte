<script lang="ts">
	import { onMount } from 'svelte';
	import { Building2, Check, ChevronsUpDown, Search, X } from 'lucide-svelte';
	import { lembagaAktif, type LembagaAktif } from '$lib/stores/lembagaAktif';

	export let lembagaList: LembagaAktif[] = [];
	export let fallbackLembaga: LembagaAktif | null = null;
	export let currentUser: { id?: string | null } | null = null;

	const typeLabels: Record<string, string> = {
		tpq: 'TPQ',
		pondok: 'Pondok',
		masjid: 'Masjid',
		musholla: 'Musholla',
		'rumah-tahfidz': 'Rumah Tahfidz',
		rumah_tahfidz: 'Rumah Tahfidz'
	};

	let rootEl: HTMLDivElement | null = null;
	let open = false;
	let query = '';
	let initializedKey = '';

	const normalizeType = (type?: string | null) => typeLabels[type ?? ''] ?? type ?? 'Lembaga';
	const normalizeLembaga = (item: LembagaAktif) => ({
		...item,
		isAktif: item.isAktif === false || item.isAktif === 0 ? false : true
	});

	$: normalizedList = lembagaList.map(normalizeLembaga);
	$: fallback = fallbackLembaga ? normalizeLembaga(fallbackLembaga) : null;
	$: selectableList =
		fallback && !normalizedList.some((item) => item.id === fallback.id)
			? [fallback, ...normalizedList]
			: normalizedList;
	$: active = $lembagaAktif ?? fallback ?? selectableList[0] ?? null;
	$: filteredList = selectableList.filter((item) => {
		const haystack = `${item.name} ${normalizeType(item.type)}`.toLowerCase();
		return haystack.includes(query.trim().toLowerCase());
	});
	$: canSwitch = selectableList.length > 1;
	$: userKey = currentUser?.id ?? 'anonymous';
	$: listKey = `${userKey}:${selectableList.map((item) => item.id).join('|')}:${fallback?.id ?? ''}`;

	$: if (selectableList.length > 0 && listKey !== initializedKey) {
		initializedKey = listKey;
		lembagaAktif.initialize(selectableList, fallback?.id);
	}

	const close = () => {
		open = false;
		query = '';
	};

	const toggle = () => {
		if (!active || !canSwitch) return;
		open = !open;
	};

	const selectLembaga = (lembaga: LembagaAktif) => {
		lembagaAktif.set(lembaga);
		close();
	};

	onMount(() => {
		const handlePointerDown = (event: PointerEvent) => {
			if (!open || !rootEl || rootEl.contains(event.target as Node)) return;
			close();
		};
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') close();
		};

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeydown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

{#if active}
	<div class="relative min-w-0 font-sans" bind:this={rootEl}>
		<button
			type="button"
			class="inline-flex w-full min-w-0 max-w-[min(78vw,20rem)] items-center gap-2 rounded-xl border border-so-border bg-white px-3 py-2 text-left shadow-sm transition hover:border-so-green/60 hover:bg-so-cream/70 focus:outline-none focus:ring-4 focus:ring-so-gold/20"
			class:cursor-default={!canSwitch}
			on:click={toggle}
			aria-haspopup="listbox"
			aria-expanded={open}
			aria-label="Pilih lembaga aktif"
		>
			<span
				class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-so-green/10 text-so-green"
				aria-hidden="true"
			>
				<Building2 size={18} strokeWidth={2} />
			</span>
			<span class="min-w-0 flex-1">
				<span class="block truncate text-sm font-bold leading-5 text-so-green">{active.name}</span>
				<span class="block truncate text-xs font-semibold leading-4 text-so-muted">
					{normalizeType(active.type)}
				</span>
			</span>
			{#if canSwitch}
				<ChevronsUpDown size={16} class="shrink-0 text-so-muted" strokeWidth={2} />
			{/if}
		</button>

		{#if open}
			<button
				type="button"
				class="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px] md:hidden"
				on:click={close}
				aria-label="Tutup pilihan lembaga"
			></button>

			<section
				class="fixed inset-x-0 bottom-0 z-[60] max-h-[82dvh] rounded-t-so-lg border border-so-border bg-white p-4 shadow-soft md:hidden"
				aria-label="Daftar lembaga"
			>
				<div class="mx-auto h-1.5 w-12 rounded-full bg-so-border"></div>
				<div class="mt-4 flex items-center justify-between gap-3">
					<div>
						<p class="text-xs font-bold uppercase tracking-[0.18em] text-so-muted">Lembaga Aktif</p>
						<h2 class="mt-1 text-lg font-bold text-so-green">Pilih lembaga</h2>
					</div>
					<button
						type="button"
						class="grid h-10 w-10 place-items-center rounded-xl border border-so-border text-so-green"
						on:click={close}
						aria-label="Tutup pilihan lembaga"
					>
						<X size={18} strokeWidth={2} />
					</button>
				</div>
				<div class="mt-4">
					<label class="relative block">
						<Search
							size={16}
							class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-so-muted"
						/>
						<input
							class="h-11 w-full rounded-xl border border-so-border bg-so-cream/40 pl-9 pr-3 text-sm text-so-ink outline-none focus:border-so-gold focus:ring-4 focus:ring-so-gold/20"
							bind:value={query}
							placeholder="Cari lembaga..."
						/>
					</label>
				</div>
				<div class="mt-4 max-h-[54dvh] space-y-2 overflow-y-auto pb-2">
					{#each filteredList as lembaga (lembaga.id)}
						<button
							type="button"
							class={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
								active.id === lembaga.id ? 'border-so-green bg-so-green/5' : 'border-so-border'
							}`}
							on:click={() => selectLembaga(lembaga)}
						>
							<span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-so-green text-sm font-black text-white">
								{lembaga.name.slice(0, 2).toUpperCase()}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-bold text-so-ink">{lembaga.name}</span>
								<span class="mt-0.5 block text-xs font-semibold text-so-muted">
									{normalizeType(lembaga.type)}
								</span>
							</span>
							{#if active.id === lembaga.id}
								<Check size={18} class="text-so-green" strokeWidth={2.3} />
							{/if}
						</button>
					{:else}
						<p class="rounded-xl border border-so-border bg-so-cream/50 px-3 py-4 text-sm text-so-muted">
							Tidak ada lembaga yang cocok.
						</p>
					{/each}
				</div>
			</section>

			<div
				class="absolute right-0 top-[calc(100%+0.5rem)] z-50 hidden w-[min(22rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-so-lg border border-so-border bg-white p-3 shadow-soft md:block"
				role="listbox"
				aria-label="Daftar lembaga"
			>
				<label class="relative block">
					<Search
						size={16}
						class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-so-muted"
					/>
					<input
						class="h-10 w-full rounded-xl border border-so-border bg-so-cream/35 pl-9 pr-3 text-sm text-so-ink outline-none focus:border-so-gold focus:ring-4 focus:ring-so-gold/20"
						bind:value={query}
						placeholder="Cari lembaga..."
					/>
				</label>
				<div class="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
					{#each filteredList as lembaga (lembaga.id)}
						<button
							type="button"
							class={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-so-green/5 ${
								active.id === lembaga.id ? 'bg-so-green/8' : ''
							}`}
							on:click={() => selectLembaga(lembaga)}
							role="option"
							aria-selected={active.id === lembaga.id}
						>
							<span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-so-green/10 text-xs font-black text-so-green">
								{lembaga.name.slice(0, 2).toUpperCase()}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-bold text-so-ink">{lembaga.name}</span>
								<span class="block truncate text-xs font-semibold text-so-muted">
									{normalizeType(lembaga.type)}
								</span>
							</span>
							{#if active.id === lembaga.id}
								<Check size={17} class="text-so-green" strokeWidth={2.3} />
							{/if}
						</button>
					{:else}
						<p class="rounded-xl bg-so-cream/60 px-3 py-4 text-sm text-so-muted">
							Tidak ada lembaga yang cocok.
						</p>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
