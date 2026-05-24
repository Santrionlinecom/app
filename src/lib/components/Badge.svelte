<script lang="ts">
	export let tone = 'green';
	export let dot = false;
	const tones: Record<string, string> = {
		green: 'bg-so-green/10 text-so-green border-so-green/20',
		gold: 'bg-so-gold/15 text-amber-700 border-so-gold/30',
		red: 'bg-red-50 text-red-700 border-red-200',
		gray: 'bg-stone-100 text-so-muted border-so-border'
	};
</script>

<span
	class={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${tones[tone] ?? tones.green}`}
>
	{#if dot}<span class="h-1.5 w-1.5 rounded-full bg-current"></span>{/if}
	<slot />
</span>
