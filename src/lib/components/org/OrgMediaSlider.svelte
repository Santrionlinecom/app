<script lang="ts">
	type OrgMediaItem = {
		id: string;
		url: string;
		createdAt?: number;
	};

	export let media: OrgMediaItem[] = [];
	export let orgName = '';

	let activeIndex = 0;

	$: if (activeIndex >= media.length) {
		activeIndex = media.length ? 0 : 0;
	}

	const next = () => {
		if (!media.length) return;
		activeIndex = (activeIndex + 1) % media.length;
	};

	const prev = () => {
		if (!media.length) return;
		activeIndex = (activeIndex - 1 + media.length) % media.length;
	};

	const selectIndex = (index: number) => {
		if (index < 0 || index >= media.length) return;
		activeIndex = index;
	};

	$: activeItem = media[activeIndex] ?? null;
	$: altText = activeItem
		? `Foto ${orgName || 'lembaga'} ${activeIndex + 1}`
		: `Foto ${orgName || 'lembaga'}`;
</script>

<section class="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h2 class="text-lg font-semibold text-slate-900">Galeri Lembaga</h2>
			<p class="text-xs text-slate-500">Kegiatan dan suasana lembaga dalam satu tampilan.</p>
		</div>
		{#if media.length}
			<span class="text-xs text-slate-500">{activeIndex + 1} / {media.length}</span>
		{/if}
	</div>

	{#if !media.length}
		<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
			Belum ada foto yang ditampilkan.
		</div>
	{:else}
		<div class="relative">
			<div class="aspect-video overflow-hidden rounded-xl bg-slate-100">
				<img src={activeItem?.url} alt={altText} class="h-full w-full object-cover" loading="lazy" />
			</div>
			<div class="pointer-events-none absolute inset-0 flex items-center justify-between px-3">
				<button
					type="button"
					class="btn btn-xs md:btn-sm btn-outline bg-white/90 pointer-events-auto"
					on:click={prev}
					aria-label="Foto sebelumnya"
				>
					Sebelum
				</button>
				<button
					type="button"
					class="btn btn-xs md:btn-sm btn-outline bg-white/90 pointer-events-auto"
					on:click={next}
					aria-label="Foto berikutnya"
				>
					Berikut
				</button>
			</div>
		</div>

		<div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
			{#each media as item, index}
				<button
					type="button"
					class={`overflow-hidden rounded-lg border ${
						index === activeIndex
							? 'border-emerald-300 ring-2 ring-emerald-200'
							: 'border-slate-200'
					}`}
					on:click={() => selectIndex(index)}
					aria-label={`Lihat foto ${index + 1}`}
				>
					<div class="aspect-video bg-slate-100">
						<img src={item.url} alt="Thumbnail lembaga" class="h-full w-full object-cover" loading="lazy" />
					</div>
				</button>
			{/each}
		</div>
	{/if}
</section>
