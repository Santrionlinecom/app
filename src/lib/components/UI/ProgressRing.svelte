<script lang="ts">
	export let percentage = 0;
	const radius = 48;
	const circumference = 2 * Math.PI * radius;
	$: dash = ((100 - percentage) / 100) * circumference;
</script>

<svg viewBox="0 0 120 120" class="h-28 w-28">
	<circle
		class="stroke-slate-200"
		fill="transparent"
		stroke-width="12"
		stroke-linecap="round"
		cx="60"
		cy="60"
		r={radius}
	/>
	<circle
		class="stroke-emerald-500 transition-all"
		fill="transparent"
		stroke-width="12"
		stroke-linecap="round"
		cx="60"
		cy="60"
		r={radius}
		stroke-dasharray={circumference}
		stroke-dashoffset={dash}
		transform="rotate(-90 60 60)"
	/>
	<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" class="fill-slate-800 text-xl font-bold">
		{Math.round(percentage)}%
	</text>
</svg>
