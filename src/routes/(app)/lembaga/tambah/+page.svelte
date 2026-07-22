<script lang="ts">
	import { ArrowLeft, PlusCircle } from 'lucide-svelte';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	type LembagaFormErrors = {
		name?: string;
		type?: string;
		address?: string;
		error?: string;
	};

	type LembagaFormValues = {
		name?: string;
		type?: string;
		address?: string;
	};

	type CapacityInfo = {
		unlimited?: boolean;
		limit?: number | null;
		used?: number;
		remaining?: number | null;
		canAdd?: boolean;
	};

	const lembagaTypes = [
		{
			value: 'tpq',
			emoji: '🕌',
			name: 'TPQ',
			description: 'Manajemen santri, setoran hafalan, kas dasar'
		},
		{
			value: 'pondok',
			emoji: '🏫',
			name: 'Pondok Pesantren',
			description: 'Manajemen santri, hafalan, kas dasar'
		},
		{
			value: 'masjid',
			emoji: '🕍',
			name: 'Masjid',
			description: 'Manajemen jamaah, kas masjid'
		},
		{
			value: 'musholla',
			emoji: '🏠',
			name: 'Musholla',
			description: 'Manajemen jamaah, kas musholla'
		},
		{
			value: 'rumah-tahfidz',
			emoji: '📖',
			name: 'Rumah Tahfidz',
			description: 'Halaqoh hafalan, setoran, kas dasar'
		}
	];

	let selectedType: string = form?.values?.type ?? '';

	$: errors = (form?.errors ?? {}) as LembagaFormErrors;
	$: values = (form?.values ?? {}) as LembagaFormValues;
	$: selectedOption = lembagaTypes.find((item) => item.value === selectedType);
	$: capacity = ((data as PageData & { capacity?: CapacityInfo }).capacity ?? null) as CapacityInfo | null;
	$: capacityBlocked = capacity ? capacity.canAdd === false : false;
</script>

<svelte:head>
	<title>Tambah Lembaga - SantriOnline App</title>
	<meta name="description" content="Tambah lembaga baru untuk akun admin SantriOnline." />
</svelte:head>

<section class="space-y-6 font-sans">
	<a
		href="/lembaga"
		class="inline-flex h-10 items-center gap-2 rounded-xl border border-so-border bg-white px-3 text-sm font-bold text-so-green shadow-sm transition hover:border-so-green focus:outline-none focus:ring-4 focus:ring-so-gold/20"
	>
		<ArrowLeft size={17} strokeWidth={2.3} />
		Kembali ke Daftar Lembaga
	</a>

	<header
		class="rounded-so-lg border border-so-border bg-white/88 p-5 shadow-card backdrop-blur md:p-6"
	>
		<p class="text-xs font-bold uppercase tracking-[0.22em] text-so-muted">Multi-Lembaga</p>
		<h1 class="mt-2 text-2xl font-black tracking-tight text-so-green md:text-3xl">
			Tambah Lembaga
		</h1>
		<p class="mt-2 max-w-2xl text-sm leading-6 text-so-muted">
			Buat lembaga baru yang akan dikelola oleh akun admin saat ini.
		</p>
		{#if capacity}
			<p class="mt-3 text-sm font-semibold text-so-green">
				{#if capacity.unlimited}
					Kuota lembaga: unlimited (addon Lembaga Tambahan aktif).
				{:else}
					Kuota gratis: {capacity.used ?? 0}/{capacity.limit ?? 1} lembaga.
					{#if capacityBlocked}
						Aktifkan addon <a href="/addon" class="underline">Lembaga Tambahan</a> untuk menambah lagi.
					{/if}
				{/if}
			</p>
		{/if}
	</header>

	{#if capacityBlocked}
		<div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
			Batas 1 lembaga gratis sudah tercapai.
			<a href="/addon" class="underline">Aktifkan Lembaga Tambahan</a> dulu sebelum menambah lembaga baru.
		</div>
	{/if}

	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
		{#each lembagaTypes as option}
			<button
				type="button"
				class={`group flex min-h-[13rem] flex-col rounded-so-lg border bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-so-gold hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-so-gold/20 ${
					selectedType === option.value
						? 'border-so-gold bg-so-gold/10 ring-2 ring-so-gold/30'
						: 'border-so-border'
				}`}
				aria-pressed={selectedType === option.value}
				on:click={() => (selectedType = option.value)}
				disabled={capacityBlocked}
			>
				<span class="text-4xl leading-none" aria-hidden="true">{option.emoji}</span>
				<span class="mt-5 text-base font-black text-so-green">{option.name}</span>
				<span class="mt-2 text-sm leading-6 text-so-muted">{option.description}</span>
				{#if selectedType === option.value}
					<span
						class="mt-auto inline-flex w-fit rounded-full bg-so-gold px-3 py-1 text-xs font-black text-so-green"
					>
						Dipilih
					</span>
				{/if}
			</button>
		{/each}
	</div>

	{#if errors.type}
		<p class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
			{errors.type}
		</p>
	{/if}

	{#if selectedOption && !capacityBlocked}
		<form
			method="POST"
			class="rounded-so-lg border border-so-border bg-white p-5 shadow-card md:p-6"
		>
			<input type="hidden" name="type" value={selectedType} />

			<div class="flex flex-col gap-2 border-b border-so-border pb-5 md:flex-row md:items-start md:justify-between">
				<div>
					<p class="text-xs font-bold uppercase tracking-[0.18em] text-so-muted">
						{selectedOption.name}
					</p>
					<h2 class="mt-1 text-xl font-black text-so-green">Data Lembaga</h2>
				</div>
				<span
					class="inline-flex w-fit items-center rounded-full border border-so-gold/40 bg-so-gold/12 px-3 py-1 text-xs font-bold text-so-green"
				>
					{selectedOption.emoji} {selectedOption.name}
				</span>
			</div>

			{#if errors.error}
				<p class="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
					{errors.error}
				</p>
			{/if}

			<div class="mt-5 grid gap-5 md:grid-cols-2">
				<div class="space-y-2">
					<label for="name" class="text-sm font-bold text-so-ink">Nama Lembaga</label>
					<input
						id="name"
						name="name"
						type="text"
						value={values.name ?? ''}
						placeholder="Contoh: TPQ Al-Ikhlas"
						class="h-12 w-full rounded-xl border border-so-border bg-so-cream/45 px-4 text-sm font-semibold text-so-ink outline-none transition placeholder:text-so-muted/70 focus:border-so-gold focus:bg-white focus:ring-4 focus:ring-so-gold/20"
						autocomplete="organization"
					/>
					{#if errors.name}
						<p class="text-xs font-semibold text-red-600">{errors.name}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<label for="address" class="text-sm font-bold text-so-ink">Alamat</label>
					<input
						id="address"
						name="address"
						type="text"
						value={values.address ?? ''}
						placeholder="Alamat lengkap lembaga"
						class="h-12 w-full rounded-xl border border-so-border bg-so-cream/45 px-4 text-sm font-semibold text-so-ink outline-none transition placeholder:text-so-muted/70 focus:border-so-gold focus:bg-white focus:ring-4 focus:ring-so-gold/20"
						autocomplete="street-address"
					/>
					{#if errors.address}
						<p class="text-xs font-semibold text-red-600">{errors.address}</p>
					{/if}
				</div>
			</div>

			<div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
				<a
					href="/lembaga"
					class="inline-flex h-11 items-center justify-center rounded-xl border border-so-border bg-white px-4 text-sm font-bold text-so-green transition hover:border-so-green focus:outline-none focus:ring-4 focus:ring-so-gold/20"
				>
					Batal
				</a>
				<button
					type="submit"
					class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-so-green px-5 text-sm font-bold text-white shadow-sm transition hover:bg-so-green-2 focus:outline-none focus:ring-4 focus:ring-so-gold/25"
				>
					<PlusCircle size={18} strokeWidth={2.3} />
					Tambah Lembaga
				</button>
			</div>
		</form>
	{/if}
</section>
