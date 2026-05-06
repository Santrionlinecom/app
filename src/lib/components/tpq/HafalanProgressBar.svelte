<script lang="ts">
	let {
		value = 0,
		max = 0,
		label = 'Progress',
		tone = 'success'
	} = $props<{
		value?: number;
		max?: number;
		label?: string;
		tone?: 'success' | 'warning' | 'error' | 'info';
	}>();

	let safeMax = $derived(Math.max(0, Number(max) || 0));
	let safeValue = $derived(Math.min(safeMax, Math.max(0, Number(value) || 0)));
	let percent = $derived(safeMax ? Math.round((safeValue / safeMax) * 10000) / 100 : 0);
	let progressClass = $derived(
		tone === 'warning'
			? 'progress-warning'
			: tone === 'error'
				? 'progress-error'
				: tone === 'info'
					? 'progress-info'
					: 'progress-success'
	);
</script>

<div class="space-y-1">
	<div class="flex items-center justify-between gap-3 text-xs">
		<span class="font-medium text-base-content/70">{label}</span>
		<span class="font-semibold text-base-content">{safeValue}/{safeMax} · {percent}%</span>
	</div>
	<progress class={`progress ${progressClass} h-2 w-full`} value={safeValue} max={safeMax || 1}></progress>
</div>
