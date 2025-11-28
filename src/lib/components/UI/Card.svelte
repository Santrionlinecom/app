<script lang="ts">
	export let title = '';
	export let subtitle = '';
</script>

<section class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-900/5">
	<p class="text-xs uppercase tracking-[0.4em] text-emerald-500">{subtitle}</p>
	<div class="mt-2 flex items-start justify-between">
		<h3 class="text-xl font-semibold text-slate-900">{title}</h3>
		<slot name="icon" />
	</div>
	<div class="mt-5 text-sm text-slate-600">
		<slot />
	</div>
</section>
