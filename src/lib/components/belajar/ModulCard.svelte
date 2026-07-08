<script lang="ts">
	import { LockKeyhole } from 'lucide-svelte';

	export let modul: {
		id: string;
		judul: string;
		deskripsi?: string | null;
		kategori: string;
		progress_persen: number;
		locked?: boolean;
		terkunci?: boolean;
	};

	const categoryIcon: Record<string, string> = {
		nahwu: '📖',
		percakapan: '💬',
		hijaiyah: 'ح',
		mufrodat: 'ك',
		shorof: 'ص',
		kitab: 'ق'
	};

	$: progress = Math.min(100, Math.max(0, Number(modul.progress_persen ?? 0)));
	$: isLocked = Boolean(modul.locked ?? modul.terkunci);
	$: isDone = progress >= 100;
	$: icon = categoryIcon[modul.kategori] ?? '📖';
</script>

<article
	class="group flex min-h-[17rem] flex-col rounded-xl border border-emerald-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1B4332]/25 hover:shadow-md"
	class:opacity-70={isLocked}
>
	<div class="flex items-start justify-between gap-3">
		<div class="grid h-12 w-12 place-items-center rounded-xl bg-[#1B4332] text-2xl font-extrabold text-white">
			<span class:font-arabic={modul.kategori === 'hijaiyah'}>{icon}</span>
		</div>

		{#if isLocked}
			<div class="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500">
				<LockKeyhole class="h-4 w-4" />
			</div>
		{:else if isDone}
			<span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-600">
				SELESAI
			</span>
		{/if}
	</div>

	<p class="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#C9A84C]">
		{modul.kategori}
	</p>
	<h2 class="mt-2 line-clamp-2 text-lg font-extrabold leading-snug text-[#1B4332]">
		{modul.judul}
	</h2>
	<p class="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
		{modul.deskripsi}
	</p>

	<div class="mt-auto pt-5">
		<div class="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
			<span>Progress</span>
			<span>{progress}%</span>
		</div>
		<div class="h-3 overflow-hidden rounded-full bg-slate-100">
			<div
				class="h-full rounded-full bg-[#1B4332] transition-all duration-500"
				style={`width: ${progress}%`}
			></div>
		</div>
	</div>
</article>

<style>
	.font-arabic {
		font-family: 'Scheherazade New', serif;
	}
</style>
