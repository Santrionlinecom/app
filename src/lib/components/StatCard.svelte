<script lang="ts">
	export let label = '';
	export let value = '';
	export let helper = '';
	export let icon = '▣';
	export let tone = 'green';
	export let trend = '';

	const tones: Record<string, string> = {
		green: 'bg-so-green/10 text-so-green',
		gold: 'bg-so-gold/18 text-amber-700',
		cream: 'bg-stone-100 text-so-green',
		red: 'bg-red-50 text-red-700'
	};
</script>

<article
	class="so-card group rounded-so-lg p-5 transition hover:-translate-y-0.5 hover:shadow-soft"
>
	<div class="flex items-start justify-between gap-4">
		<div
			class={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${tones[tone] ?? tones.green}`}
		>
			{icon}
		</div>
		<button
			class="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-so-green"
			aria-label="Opsi">⋮</button
		>
	</div>
	<p class="mt-4 text-sm font-medium text-so-muted">{label}</p>
	<div class="mt-1 flex items-end gap-2">
		<p class="font-display text-3xl font-bold tracking-tight text-so-ink">{value}</p>
		{#if trend}<span class="mb-1 text-xs font-bold text-emerald-700">{trend}</span>{/if}
	</div>
	{#if helper}<p class="mt-2 text-xs text-so-muted">{helper}</p>{/if}
</article>
