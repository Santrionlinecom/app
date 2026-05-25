<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowRight, BadgeCheck, Building2, MapPin, Plus, Sparkles } from 'lucide-svelte';
	import { lembagaAktif, type LembagaAktif } from '$lib/stores/lembagaAktif';
	import type { PageData } from './$types';

	export let data: PageData;

	type AddonStatus = {
		tipeAddon: string;
		status: string;
		berlakuHingga: number | null;
	};

	type LembagaCard = LembagaAktif & {
		address?: string | null;
		city?: string | null;
		createdAt?: number | null;
		addons?: AddonStatus[];
	};

	const typeLabels: Record<string, string> = {
		tpq: 'TPQ',
		pondok: 'Pondok',
		masjid: 'Masjid',
		musholla: 'Musholla',
		'rumah-tahfidz': 'Rumah Tahfidz',
		rumah_tahfidz: 'Rumah Tahfidz'
	};

	const addonLabels: Record<string, string> = {
		lembaga_tambahan: 'Lembaga Tambahan',
		modul_masjid: 'Modul Masjid',
		modul_tahfidz: 'Modul Tahfidz',
		modul_musholla: 'Modul Musholla',
		santri_unlimited: 'Santri Unlimited',
		raport_premium: 'Raport Premium'
	};

	$: lembagaList = (data.lembagaList ?? []) as LembagaCard[];

	const formatType = (type?: string | null) => typeLabels[type ?? ''] ?? type ?? 'Lembaga';
	const formatAddon = (addon: AddonStatus) =>
		addonLabels[addon.tipeAddon] ?? addon.tipeAddon.replace(/_/g, ' ');

	const getInitials = (name: string) =>
		name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0])
			.join('')
			.toUpperCase() || 'SO';

	const manageLembaga = async (lembaga: LembagaCard) => {
		lembagaAktif.set({
			id: lembaga.id,
			name: lembaga.name,
			type: lembaga.type,
			slug: lembaga.slug,
			status: lembaga.status,
			logoUrl: lembaga.logoUrl,
			isAktif: lembaga.isAktif
		});
		await goto('/dashboard');
	};
</script>

<svelte:head>
	<title>Lembaga - SantriOnline App</title>
	<meta
		name="description"
		content="Kelola daftar lembaga aktif, addon, dan pilihan lembaga kerja SantriOnline."
	/>
</svelte:head>

<section class="space-y-6 font-sans">
	<header
		class="flex flex-col gap-4 rounded-so-lg border border-so-border bg-white/88 p-5 shadow-card backdrop-blur md:flex-row md:items-center md:justify-between"
	>
		<div class="min-w-0">
			<p class="text-xs font-bold uppercase tracking-[0.22em] text-so-muted">Multi-Lembaga</p>
			<h1 class="mt-2 text-2xl font-black tracking-tight text-so-green md:text-3xl">
				Daftar Lembaga
			</h1>
			<p class="mt-2 max-w-2xl text-sm leading-6 text-so-muted">
				Pilih lembaga aktif yang sedang dikelola. Perubahan pilihan disimpan di perangkat ini
				dan tidak mengubah URL.
			</p>
		</div>
		<a
			href="/lembaga/tambah"
			class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-so-green px-4 text-sm font-bold text-white shadow-sm transition hover:bg-so-green-2 focus:outline-none focus:ring-4 focus:ring-so-gold/25"
		>
			<Plus size={18} strokeWidth={2.3} />
			Tambah Lembaga
		</a>
	</header>

	{#if lembagaList.length > 0}
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each lembagaList as lembaga (lembaga.id)}
				<article
					class="group flex min-h-[17rem] flex-col rounded-so-lg border border-so-border bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-so-green/45 hover:shadow-soft"
				>
					<div class="flex items-start justify-between gap-3">
						<div class="flex min-w-0 items-center gap-3">
							<div
								class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-so-green text-sm font-black text-white"
							>
								{getInitials(lembaga.name)}
							</div>
							<div class="min-w-0">
								<h2 class="truncate text-lg font-black text-so-ink">{lembaga.name}</h2>
								<div class="mt-1 flex flex-wrap items-center gap-2">
									<span
										class="inline-flex items-center rounded-full border border-so-green/15 bg-so-green/8 px-2.5 py-1 text-xs font-bold text-so-green"
									>
										{formatType(lembaga.type)}
									</span>
									{#if lembaga.isAktif === 0 || lembaga.isAktif === false}
										<span
											class="inline-flex items-center rounded-full border border-so-border bg-so-cream px-2.5 py-1 text-xs font-bold text-so-muted"
										>
											Nonaktif
										</span>
									{/if}
								</div>
							</div>
						</div>
						<Building2 class="mt-1 shrink-0 text-so-gold" size={22} strokeWidth={2} />
					</div>

					<div class="mt-5 flex flex-wrap gap-2">
						{#if lembaga.addons?.length}
							{#each lembaga.addons as addon}
								<span
									class="inline-flex items-center gap-1.5 rounded-full border border-so-gold/35 bg-so-gold/14 px-3 py-1 text-xs font-bold text-so-green"
								>
									<BadgeCheck size={14} strokeWidth={2.4} />
									{formatAddon(addon)}
								</span>
							{/each}
						{:else}
							<span
								class="inline-flex items-center gap-1.5 rounded-full border border-so-border bg-so-cream px-3 py-1 text-xs font-bold text-so-muted"
							>
								<Sparkles size={14} strokeWidth={2.4} />
								Gratis
							</span>
						{/if}
					</div>

					{#if lembaga.city || lembaga.address}
						<p class="mt-5 flex items-start gap-2 text-sm leading-6 text-so-muted">
							<MapPin size={16} class="mt-1 shrink-0 text-so-green" strokeWidth={2} />
							<span>{lembaga.address || lembaga.city}</span>
						</p>
					{/if}

					<div class="mt-auto pt-6">
						<button
							type="button"
							class="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-so-green px-4 text-sm font-bold text-white transition hover:bg-so-green-2 focus:outline-none focus:ring-4 focus:ring-so-gold/25"
							on:click={() => manageLembaga(lembaga)}
						>
							Kelola
							<ArrowRight size={17} strokeWidth={2.4} />
						</button>
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<div
			class="grid min-h-[22rem] place-items-center rounded-so-lg border border-dashed border-so-border bg-white/88 p-6 text-center shadow-card"
		>
			<div class="max-w-md">
				<div class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-so-green/10 text-so-green">
					<Building2 size={28} strokeWidth={2.2} />
				</div>
				<h2 class="mt-5 text-2xl font-black text-so-green">Belum ada lembaga</h2>
				<p class="mt-2 text-sm leading-6 text-so-muted">
					Buat lembaga pertama untuk mulai mengelola santri, setoran hafalan, kas, dan
					addon premium.
				</p>
				<a
					href="/lembaga/tambah"
					class="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-so-green px-5 text-sm font-bold text-white shadow-sm transition hover:bg-so-green-2 focus:outline-none focus:ring-4 focus:ring-so-gold/25"
				>
					<Plus size={18} strokeWidth={2.3} />
					Buat Lembaga Pertama
				</a>
			</div>
		</div>
	{/if}
</section>
