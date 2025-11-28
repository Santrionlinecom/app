<script lang="ts">
	export let checklist: {
		surahNumber: number;
		name: string;
		totalAyah: number;
		setor: number;
		disetujui: number;
	}[];

	// Helper to determine status color
	function getStatusColor(row: typeof checklist[0]) {
		if (row.disetujui === row.totalAyah) return 'bg-emerald-500 text-white border-emerald-600';
		if (row.setor > row.disetujui) return 'bg-amber-400 text-white border-amber-500';
		if (row.disetujui > 0) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
		return 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300';
	}
</script>

<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
	{#each checklist as surah}
		<button
			class="relative flex flex-col items-center justify-center rounded-2xl border p-4 transition-all hover:shadow-md {getStatusColor(surah)}"
		>
			<span class="text-xs font-medium opacity-70">Surah {surah.surahNumber}</span>
			<span class="font-bold truncate w-full text-center">{surah.name}</span>
			
			<!-- Mini Progress Bar -->
			<div class="mt-2 h-1.5 w-full rounded-full bg-black/10 overflow-hidden">
				<div 
					class="h-full bg-current opacity-80" 
					style="width: {(surah.disetujui / surah.totalAyah) * 100}%"
				></div>
			</div>
		</button>
	{/each}
</div>
