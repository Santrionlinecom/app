<script lang="ts">
	export let label: string;
	export let value: string | number;
	export let accent: string = 'from-emerald-500 to-teal-400';
</script>

<div class={`rounded-2xl bg-gradient-to-tr ${accent} px-6 py-5 text-white shadow-lg`}>
	<p class="text-xs uppercase tracking-widest opacity-80">{label}</p>
	<p class="mt-2 text-3xl font-bold">{value}</p>
	<slot />
</div>
