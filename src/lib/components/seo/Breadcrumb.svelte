<script lang="ts">
	export let items: Array<{ name: string; url: string }> = [];
</script>

<nav aria-label="Breadcrumb" class="mb-6 text-sm text-slate-500">
	<ol class="flex flex-wrap items-center gap-2" itemscope itemtype="https://schema.org/BreadcrumbList">
		{#each items as item, i}
			<li
				class="inline-flex items-center gap-2"
				itemprop="itemListElement"
				itemscope
				itemtype="https://schema.org/ListItem"
			>
				{#if i < items.length - 1}
					<a itemprop="item" href={item.url} class="font-semibold text-emerald-700 hover:text-emerald-900">
						<span itemprop="name">{item.name}</span>
					</a>
					<span aria-hidden="true" class="text-slate-300">/</span>
				{:else}
					<span itemprop="name" aria-current="page" class="font-semibold text-slate-700">{item.name}</span>
				{/if}
				<meta itemprop="position" content={String(i + 1)} />
			</li>
		{/each}
	</ol>
</nav>
