<script lang="ts">
	export let title = '';
	export let subtitle = '';
	export let typePath = '';
	export let orgs: Array<{
		id: string;
		name: string;
		slug: string;
		city?: string | null;
		address?: string | null;
		contactPhone?: string | null;
		thumbnailUrl?: string | null;
	}> = [];
</script>

<section class="max-w-6xl mx-auto py-10 px-4 space-y-6">
	<header class="space-y-2 text-center">
		<p class="text-sm uppercase tracking-[0.3em] text-emerald-500">Santri Online</p>
		<h1 class="text-3xl md:text-4xl font-bold text-slate-900">{title}</h1>
		<p class="text-slate-600">{subtitle}</p>
		<div class="pt-4">
			<a class="btn btn-primary" href={`/${typePath}/daftar`}>Daftarkan {title}</a>
		</div>
	</header>

	{#if orgs.length === 0}
		<div class="rounded-2xl border bg-white p-6 text-center text-slate-600">
			Belum ada lembaga aktif. Jadilah yang pertama mendaftar.
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each orgs as org}
				<a
					href={`/${typePath}/${org.slug}`}
					class="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition space-y-3"
				>
					<div class="aspect-video overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
						{#if org.thumbnailUrl}
							<img src={org.thumbnailUrl} alt={`Foto ${org.name}`} class="h-full w-full object-cover" loading="lazy" />
						{:else}
							<div class="flex h-full items-center justify-center text-xs text-slate-400">
								Belum ada foto
							</div>
						{/if}
					</div>
					<div class="font-semibold text-slate-900">{org.name}</div>
					{#if org.city || org.address}
						<p class="mt-1 text-sm text-slate-600">{org.address || ''} {org.city || ''}</p>
					{/if}
					{#if org.contactPhone}
						<p class="mt-2 text-xs text-slate-500">Kontak: {org.contactPhone}</p>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</section>
