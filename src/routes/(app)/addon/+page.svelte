<script lang="ts">
	import { BadgeCheck, Clock3, CreditCard, Settings } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	type AddonAktif = {
		tipeAddon: string;
		status: string;
	};

	const addonCatalog = [
		{
			type: 'santri_unlimited',
			emoji: '👥',
			name: 'Santri Unlimited',
			price: 'Rp20.000/bulan',
			features: ['Hapus batas 30 santri aktif']
		},
		{
			type: 'raport_premium',
			emoji: '📄',
			name: 'Raport PDF Premium',
			price: 'Rp15.000/bulan',
			features: ['Template custom', 'Kirim ke wali via WhatsApp']
		},
		{
			type: 'modul_masjid',
			emoji: '🕌',
			name: 'Modul Masjid',
			price: 'Rp25.000/bulan',
			features: ['Zakat', 'Qurban', 'Agenda jamaah']
		},
		{
			type: 'modul_tahfidz',
			emoji: '📖',
			name: 'Modul Rumah Tahfidz',
			price: 'Rp20.000/bulan',
			features: ['Halaqoh detail', 'Ujian', 'Ijazah']
		},
		{
			type: 'modul_musholla',
			emoji: '🏠',
			name: 'Modul Musholla',
			price: 'Rp15.000/bulan',
			features: ['Kas musholla', 'Kegiatan rutin']
		},
		{
			type: 'lembaga_tambahan',
			emoji: '➕',
			name: 'Lembaga Tambahan',
			price: 'Rp15.000/bulan',
			features: ['Tambah lembaga ke-2', 'Tambah lembaga ke-3 dan seterusnya']
		}
	];

	$: activeTypes = new Set(
		((data.addonAktif ?? []) as AddonAktif[]).map((addon) => addon.tipeAddon)
	);
</script>

<svelte:head>
	<title>Addon - SantriOnline App</title>
	<meta name="description" content="Katalog addon SantriOnline untuk lembaga aktif." />
</svelte:head>

<section class="space-y-6 font-sans">
	<header
		class="rounded-so-lg border border-so-border bg-white/88 p-5 shadow-card backdrop-blur md:p-6"
	>
		<p class="text-xs font-bold uppercase tracking-[0.22em] text-so-muted">Addon Berbayar</p>
		<div class="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
			<div class="min-w-0">
				<h1 class="text-2xl font-black tracking-tight text-so-green md:text-3xl">
					Katalog Addon
				</h1>
				<p class="mt-2 max-w-2xl text-sm leading-6 text-so-muted">
					Aktivasi fitur tambahan untuk {data.lembagaNama ?? 'lembaga aktif'}.
				</p>
			</div>
			<div
				class="inline-flex w-fit items-center gap-2 rounded-full border border-so-gold/40 bg-so-gold/12 px-3 py-1.5 text-xs font-bold text-so-green"
			>
				<BadgeCheck size={15} strokeWidth={2.4} />
				{activeTypes.size} addon aktif
			</div>
		</div>
	</header>

	<div
		class="flex flex-col gap-3 rounded-so-lg border border-so-gold/35 bg-so-gold/12 p-4 text-so-green shadow-card md:flex-row md:items-center"
	>
		<div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-so-green text-white">
			<CreditCard size={19} strokeWidth={2.2} />
		</div>
		<p class="text-sm font-semibold leading-6">
			Pembayaran addon akan segera tersedia via Midtrans, BSI, dan Coin SantriOnline.
		</p>
	</div>

	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each addonCatalog as addon}
			{@const isActive = activeTypes.has(addon.type)}
			<article
				class={`flex min-h-[18rem] flex-col rounded-so-lg border bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft ${
					isActive ? 'border-so-green/45' : 'border-so-border hover:border-so-gold/60'
				}`}
			>
				<div class="flex items-start justify-between gap-4">
					<div class="min-w-0">
						<div class="text-4xl leading-none" aria-hidden="true">{addon.emoji}</div>
						<h2 class="mt-4 text-lg font-black text-so-green">{addon.name}</h2>
						<p class="mt-1 text-sm font-bold text-so-gold">{addon.price}</p>
					</div>

					{#if isActive}
						<span
							class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-so-green/20 bg-so-green/10 px-3 py-1 text-xs font-black text-so-green"
						>
							<BadgeCheck size={14} strokeWidth={2.4} />
							Aktif
						</span>
					{:else}
						<span
							class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-so-border bg-so-cream px-3 py-1 text-xs font-bold text-so-muted"
						>
							<Clock3 size={14} strokeWidth={2.4} />
							Belum aktif
						</span>
					{/if}
				</div>

				<ul class="mt-5 space-y-2 text-sm leading-6 text-so-muted">
					{#each addon.features as feature}
						<li class="flex gap-2">
							<span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-so-gold"></span>
							<span>{feature}</span>
						</li>
					{/each}
				</ul>

				<div class="mt-auto pt-6">
					{#if isActive}
						<button
							type="button"
							class="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-so-green px-4 text-sm font-bold text-white opacity-75"
							disabled
						>
							<Settings size={17} strokeWidth={2.3} />
							Kelola
						</button>
					{:else}
						<button
							type="button"
							class="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-xl border border-so-border bg-so-cream px-4 text-sm font-bold text-so-muted"
							disabled
						>
							Segera Hadir
						</button>
					{/if}
				</div>
			</article>
		{/each}
	</div>
</section>
