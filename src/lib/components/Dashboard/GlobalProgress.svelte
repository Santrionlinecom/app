<script lang="ts">
	export let percentage: number;
	export let totalAyah: number;

	// Calculate circumference for the circle
	const radius = 50;
	const circumference = 2 * Math.PI * radius;
	$: offset = circumference - (percentage / 100) * circumference;
</script>

<div class="relative flex flex-col items-center justify-center p-6">
	<div class="relative h-48 w-48">
		<!-- Background Circle -->
		<svg class="h-full w-full -rotate-90 transform" viewBox="0 0 120 120">
			<circle
				cx="60"
				cy="60"
				r="50"
				fill="none"
				stroke="#e2e8f0"
				stroke-width="10"
			/>
			<!-- Progress Circle -->
			<circle
				cx="60"
				cy="60"
				r="50"
				fill="none"
				stroke="currentColor"
				stroke-width="10"
				stroke-dasharray={circumference}
				stroke-dashoffset={offset}
				stroke-linecap="round"
				class="text-emerald-500 transition-all duration-1000 ease-out"
			/>
		</svg>
		
		<!-- Center Text -->
		<div class="absolute inset-0 flex flex-col items-center justify-center text-center">
			<span class="text-4xl font-bold text-slate-800">{percentage.toFixed(1)}%</span>
			<span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Selesai</span>
		</div>
	</div>

	<div class="mt-4 text-center">
		<h3 class="text-lg font-semibold text-slate-700">Total Hafalan</h3>
		<p class="text-slate-500">{totalAyah} Ayat dari 6236</p>
	</div>
</div>
