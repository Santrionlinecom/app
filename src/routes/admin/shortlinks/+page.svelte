<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let copiedSlug = $state<string | null>(null);

	const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value);
	const formatShortDate = (dateKey: string) =>
		new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(`${dateKey}T00:00:00Z`));
	const maxDailyClicks = $derived(Math.max(...data.dailyChart.map((row) => row.clicks), 1));
	const topShortlinks = $derived([...data.shortlinks].sort((a, b) => b.totalClicks - a.totalClicks).slice(0, 6));
	const maxTopClicks = $derived(Math.max(...topShortlinks.map((link) => link.totalClicks), 1));
	const summaryCards = $derived([
		{ label: 'Total shortlink', value: data.summary.totalLinks },
		{ label: 'Shortlink aktif', value: data.summary.activeLinks },
		{ label: 'Total klik', value: data.summary.totalClicks },
		{ label: 'Klik hari ini', value: data.summary.clicksToday },
		{ label: 'Klik 7 hari', value: data.summary.clicks7d }
	]);

	const copyLink = async (slug: string, url: string) => {
		await navigator.clipboard.writeText(url);
		copiedSlug = slug;
		setTimeout(() => {
			if (copiedSlug === slug) copiedSlug = null;
		}, 1500);
	};
</script>

<svelte:head>
	<title>Shortlink Analytics | SantriOnline</title>
</svelte:head>

<section class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<p class="text-sm font-semibold text-emerald-700">Admin</p>
			<h1 class="text-2xl font-bold text-slate-950">Shortlink Analytics</h1>
		</div>
		<a
			href="/admin/shortlinks/new"
			class="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
		>
			Buat Shortlink
		</a>
	</div>

	<div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
		{#each summaryCards as card}
			<div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
				<p class="text-sm font-medium text-slate-500">{card.label}</p>
				<p class="mt-2 text-2xl font-bold text-slate-950">{formatNumber(card.value)}</p>
			</div>
		{/each}
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
		<div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
			<div class="flex items-center justify-between gap-3">
				<h2 class="text-base font-bold text-slate-950">Grafik Klik 14 Hari</h2>
				<p class="text-sm text-slate-500">{formatNumber(data.summary.clicks7d)} klik 7 hari</p>
			</div>
			<div class="mt-5 flex h-56 items-end gap-2 border-b border-slate-200 px-1">
				{#each data.dailyChart as row}
					<div class="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
						<div class="flex h-full items-end">
							<div
								class="w-full rounded-t bg-emerald-600 transition hover:bg-emerald-700"
								style={`height: ${Math.max((row.clicks / maxDailyClicks) * 100, row.clicks > 0 ? 5 : 0)}%`}
								title={`${row.dateKey}: ${formatNumber(row.clicks)} klik`}
							></div>
						</div>
						<p class="truncate text-center text-[11px] text-slate-500">{formatShortDate(row.dateKey)}</p>
					</div>
				{/each}
			</div>
		</div>

		<div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
			<h2 class="text-base font-bold text-slate-950">Top Shortlink</h2>
			<div class="mt-5 space-y-4">
				{#each topShortlinks as link}
					<div>
						<div class="mb-1 flex items-center justify-between gap-3 text-sm">
							<a href={`/admin/shortlinks/${link.slug}`} class="min-w-0 truncate font-semibold text-slate-800 hover:text-emerald-700">
								/{link.slug}
							</a>
							<span class="shrink-0 text-slate-600">{formatNumber(link.totalClicks)}</span>
						</div>
						<div class="h-2 overflow-hidden rounded-full bg-slate-100">
							<div class="h-full rounded-full bg-emerald-600" style={`width: ${(link.totalClicks / maxTopClicks) * 100}%`}></div>
						</div>
					</div>
				{:else}
					<p class="text-sm text-slate-500">Belum ada data klik.</p>
				{/each}
			</div>
		</div>
	</div>

	<div class="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-slate-200 text-sm">
				<thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
					<tr>
						<th class="px-4 py-3">Shortlink</th>
						<th class="px-4 py-3">Target</th>
						<th class="px-4 py-3">Status</th>
						<th class="px-4 py-3 text-right">Total</th>
						<th class="px-4 py-3 text-right">Hari Ini</th>
						<th class="px-4 py-3 text-right">7 Hari</th>
						<th class="px-4 py-3">Copy</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each data.shortlinks as link}
						<tr class="align-top">
							<td class="px-4 py-4">
								<a href={`/admin/shortlinks/${link.slug}`} class="font-semibold text-slate-950 hover:text-emerald-700">
									/{link.slug}
								</a>
								<p class="mt-1 text-slate-500">{link.title}</p>
							</td>
							<td class="max-w-sm px-4 py-4 text-slate-600">
								<a href={link.targetUrl} class="break-all hover:text-emerald-700" target="_blank" rel="noreferrer">
									{link.targetUrl}
								</a>
							</td>
							<td class="px-4 py-4">
								<span
									class={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
										link.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
									}`}
								>
									{link.isActive ? 'Aktif' : 'Nonaktif'}
								</span>
							</td>
							<td class="px-4 py-4 text-right font-semibold text-slate-950">{formatNumber(link.totalClicks)}</td>
							<td class="px-4 py-4 text-right text-slate-700">{formatNumber(link.clicksToday)}</td>
							<td class="px-4 py-4 text-right text-slate-700">{formatNumber(link.clicks7d)}</td>
							<td class="px-4 py-4">
								<div class="flex min-w-64 items-center gap-2">
									<input
										class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
										readonly
										value={link.copyUrl}
									/>
									<button
										type="button"
										class="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
										onclick={() => copyLink(link.slug, link.copyUrl)}
									>
										{copiedSlug === link.slug ? 'OK' : 'Copy'}
									</button>
								</div>
							</td>
							<td class="px-4 py-4 text-right">
								<a href={`/admin/shortlinks/${link.slug}/edit`} class="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
									Edit
								</a>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="8" class="px-4 py-10 text-center text-slate-500">Belum ada shortlink.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</section>
