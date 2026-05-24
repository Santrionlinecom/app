<script>
	export let title = '';
	export let subtitle = '';
</script>

<div class="so-card rounded-so-lg p-5 sm:p-6">
	{#if title || subtitle}
		<div class="mb-5 flex items-start justify-between gap-4">
			<div>
				{#if title}<h2 class="font-display text-xl font-bold text-so-green">{title}</h2>{/if}
				{#if subtitle}<p class="mt-1 text-sm text-so-muted">{subtitle}</p>{/if}
			</div>
			<slot name="action" />
		</div>
	{/if}
	<slot />
</div>
