<script lang="ts">
	export let title: string = 'Terjadi kesalahan';
	export let message: string = 'Data belum bisa dimuat saat ini.';
	export let actionLabel: string = 'Coba lagi';
	export let onRetry: (() => void) | null = null;
	export let compact: boolean = false;
</script>

<div class={`flex min-w-0 flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-12'}`}>
	<div class={`${compact ? 'text-4xl' : 'text-5xl'} mb-4 opacity-60`}>
		⚠️
	</div>
	<h3 class={`font-bold text-slate-900 ${compact ? 'text-base' : 'text-lg'}`}>
		{title}
	</h3>
	<p class={`mt-2 max-w-md break-words leading-relaxed text-slate-600 ${compact ? 'text-xs' : 'text-sm'}`}>
		{message}
	</p>
	{#if onRetry}
		<button
			type="button"
			on:click={onRetry}
			class={`mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 active:scale-95 ${compact ? 'px-4 py-2 text-xs' : 'px-6 py-3 text-sm'}`}
		>
			{actionLabel}
		</button>
	{/if}
</div>
