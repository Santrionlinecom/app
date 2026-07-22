<script lang="ts">
	type DayStatus = 'pending' | 'partial' | 'done';

	export let title: string;
	export let description: string;
	export let dayStatus: DayStatus = 'pending';
	export let supportCopy = '';
	export let streakCurrent = 0;
	export let detailLine: string | null = null;
	export let busy = false;

	const statusLabel: Record<DayStatus, string> = {
		pending: 'Belum',
		partial: 'Sebagian',
		done: 'Selesai'
	};

	const statusClass: Record<DayStatus, string> = {
		pending: 'bg-amber-100 text-amber-800',
		partial: 'bg-sky-100 text-sky-800',
		done: 'bg-emerald-100 text-emerald-800'
	};
</script>

<article class="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0">
			<div
				class="inline-flex items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm"
			>
				Misi Harian
			</div>
			<h3 class="mt-3 text-lg font-bold text-slate-900">{title}</h3>
			<p class="mt-1 text-sm leading-6 text-slate-600">{description}</p>
		</div>
		<span class={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass[dayStatus]}`}>
			{statusLabel[dayStatus]}
		</span>
	</div>

	{#if detailLine}
		<p class="mt-3 text-sm font-medium text-slate-700">{detailLine}</p>
	{/if}

	<p class="mt-3 text-sm leading-6 text-emerald-800">{supportCopy}</p>

	<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
		<p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
			Streak {streakCurrent} hari
		</p>
		<div class="flex flex-wrap gap-2">
			<slot name="actions" />
			{#if busy}
				<span class="text-xs text-slate-500">Menyimpan…</span>
			{/if}
		</div>
	</div>
</article>
