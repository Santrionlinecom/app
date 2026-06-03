<script lang="ts">
	export let icon: string = '📭';
	export let title: string = 'Belum ada data';
	export let description: string = '';
	export let actionLabel: string = '';
	export let actionHref: string = '';
	export let compact: boolean = false;
</script>

<div class={`flex min-w-0 flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-12'}`}>
	<div class={`${compact ? 'text-4xl' : 'text-5xl'} mb-4 opacity-40`}>
		{icon}
	</div>
	<h3 class={`font-bold text-slate-900 ${compact ? 'text-base' : 'text-lg'}`}>
		{title}
	</h3>
	{#if description}
		<p class={`mt-2 max-w-md break-words leading-relaxed text-slate-600 ${compact ? 'text-xs' : 'text-sm'}`}>
			{description}
		</p>
	{/if}
	{#if actionLabel && actionHref}
		<a
			href={actionHref}
			class={`mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl border-2 border-emerald-600 bg-emerald-600 font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:border-emerald-700 active:scale-95 ${compact ? 'px-4 py-2 text-xs' : 'px-6 py-3 text-sm'}`}
		>
			{actionLabel}
		</a>
	{/if}
</div>
