<script lang="ts">
	export let message: string = 'Memuat data...';
	export let compact: boolean = false;
	export let showSkeleton: boolean = false;
</script>

{#if showSkeleton}
	<div class={`space-y-4 ${compact ? 'py-4' : 'py-8'}`}>
		<div class="animate-pulse space-y-3">
			<div class="h-4 w-3/4 rounded-lg bg-slate-200"></div>
			<div class="h-4 w-full rounded-lg bg-slate-200"></div>
			<div class="h-4 w-5/6 rounded-lg bg-slate-200"></div>
		</div>
		<div class="animate-pulse space-y-3">
			<div class="h-4 w-2/3 rounded-lg bg-slate-200"></div>
			<div class="h-4 w-full rounded-lg bg-slate-200"></div>
		</div>
	</div>
{:else}
	<div class={`flex min-w-0 flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-12'}`}>
		<div class="mb-4">
			<svg
				class={`animate-spin text-emerald-600 ${compact ? 'h-8 w-8' : 'h-12 w-12'}`}
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		</div>
		<p class={`font-semibold text-slate-700 ${compact ? 'text-sm' : 'text-base'}`}>
			{message}
		</p>
	</div>
{/if}
