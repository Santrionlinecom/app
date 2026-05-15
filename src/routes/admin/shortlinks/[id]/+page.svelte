<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let copiedUrl = $state<string | null>(null);

	type UpdateValues = {
		title: string;
		description: string;
		targetUrl: string;
		category: string;
		tagsInput: string;
		notes: string;
		isActive: boolean;
	};

	const values = $derived(
		(form as { values?: UpdateValues } | null | undefined)?.values ?? {
			title: data.link.title,
			description: data.link.description,
			targetUrl: data.link.targetUrl,
			category: data.link.category,
			tagsInput: data.link.tagsInput,
			notes: data.link.notes,
			isActive: data.link.isActive
		}
	);

	const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value);
	const formatShortDate = (dateKey: string) =>
		new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(`${dateKey}T00:00:00Z`));
	const normalizeDateTime = (value: string) => (value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
	const formatDateTime = (value: string) =>
		new Intl.DateTimeFormat('id-ID', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: 'Asia/Jakarta'
		}).format(new Date(normalizeDateTime(value)));

	const categoryBadgeClass = (color: string) => {
		switch (color) {
			case 'blue':
				return 'border-blue-200 bg-blue-50 text-blue-700';
			case 'green':
				return 'border-green-200 bg-green-50 text-green-700';
			case 'teal':
				return 'border-teal-200 bg-teal-50 text-teal-700';
			case 'amber':
				return 'border-amber-200 bg-amber-50 text-amber-700';
			case 'purple':
				return 'border-purple-200 bg-purple-50 text-purple-700';
			default:
				return 'border-slate-200 bg-slate-100 text-slate-700';
		}
	};

	const copyUrl = async (url: string) => {
		await navigator.clipboard.writeText(url);
		copiedUrl = url;
		setTimeout(() => {
			if (copiedUrl === url) copiedUrl = null;
		}, 1500);
	};

	const metricCards = $derived([
		{ label: 'Total klik', value: data.summary.totalClicks },
		{ label: 'Unique klik', value: data.summary.uniqueClicks },
		{ label: 'Hari ini', value: data.summary.clicksToday },
		{ label: '7 hari', value: data.summary.clicks7d },
		{ label: '30 hari', value: data.summary.clicks30d }
	]);
	const chartDailyStats = $derived([...data.dailyStats].reverse());
	const maxDailyClicks = $derived(Math.max(...chartDailyStats.map((row) => row.clicks), 1));
</script>

<svelte:head>
	<title>{data.link.title} | Shortlink Analytics</title>
</svelte:head>

<section class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
		<div>
			<a href="/admin/shortlinks" class="text-sm font-semibold text-emerald-700 hover:text-emerald-800">Shortlinks</a>
			<h1 class="mt-2 text-2xl font-bold text-slate-950">{data.link.title}</h1>
			<div class="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
				<span class="rounded-full bg-slate-100 px-3 py-1">/{data.link.slug}</span>
				<span class={`rounded-full border px-3 py-1 font-semibold ${categoryBadgeClass(data.link.categoryColor)}`}>
					{data.link.categoryLabel}
				</span>
				<span
					class={`rounded-full px-3 py-1 font-semibold ${
						data.link.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
					}`}
				>
					{data.link.isActive ? 'Aktif' : 'Nonaktif'}
				</span>
				{#each data.link.tags as tag}
					<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{tag}</span>
				{/each}
			</div>
			<a href={data.link.targetUrl} target="_blank" rel="noreferrer" class="mt-3 block break-all text-sm text-slate-600 hover:text-emerald-700">
				{data.link.targetUrl}
			</a>
		</div>
		<div class="flex flex-wrap gap-2">
			<a
				href={data.link.shortUrl}
				target="_blank"
				rel="noreferrer"
				class="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
			>
				Buka
			</a>
		</div>
	</div>

	{#if form?.error}
		<div class="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
			{form.error}
		</div>
	{:else if form?.updated}
		<div class="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
			Shortlink berhasil diperbarui.
		</div>
	{/if}

	<div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
		{#each metricCards as card}
			<div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
				<p class="text-sm font-medium text-slate-500">{card.label}</p>
				<p class="mt-2 text-2xl font-bold text-slate-950">{formatNumber(card.value)}</p>
			</div>
		{/each}
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
		<div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
			<h2 class="text-base font-bold text-slate-950">Edit Kategori & Tracking</h2>
			<form method="POST" action="?/update" class="mt-5 grid gap-4">
				<div>
					<label for="title" class="block text-sm font-semibold text-slate-700">Title</label>
					<input
						id="title"
						name="title"
						required
						class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
						value={values.title}
					/>
				</div>
				<div>
					<label for="target_url" class="block text-sm font-semibold text-slate-700">Target URL</label>
					<input
						id="target_url"
						name="target_url"
						required
						type="url"
						class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
						value={values.targetUrl}
					/>
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label for="category" class="block text-sm font-semibold text-slate-700">Category</label>
						<select
							id="category"
							name="category"
							class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
						>
							{#each data.categories as category}
								<option value={category.key} selected={values.category === category.key}>{category.label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="tags" class="block text-sm font-semibold text-slate-700">Tags</label>
						<input
							id="tags"
							name="tags"
							class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
							value={values.tagsInput}
							placeholder="gotrade, saham"
						/>
						<p class="mt-1 text-xs text-slate-500">pisahkan dengan koma</p>
					</div>
				</div>
				<div>
					<label for="description" class="block text-sm font-semibold text-slate-700">Description</label>
					<textarea
						id="description"
						name="description"
						rows="3"
						class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
					>{values.description}</textarea>
				</div>
				<div>
					<label for="notes" class="block text-sm font-semibold text-slate-700">Notes</label>
					<textarea
						id="notes"
						name="notes"
						rows="3"
						class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
						placeholder="catatan internal admin"
					>{values.notes}</textarea>
				</div>
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<label class="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700">
						<input name="is_active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-emerald-700" checked={values.isActive} />
						Is Active
					</label>
					<button
						type="submit"
						class="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
					>
						Simpan Perubahan
					</button>
				</div>
			</form>
		</div>

		<div class="space-y-6">
			<div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
				<h2 class="text-base font-bold text-slate-950">Short URL</h2>
				<div class="mt-4 flex items-center gap-2">
					<input class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" readonly value={data.link.shortUrl} />
					<button
						type="button"
						class="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
						onclick={() => copyUrl(data.link.shortUrl)}
					>
						{copiedUrl === data.link.shortUrl ? 'OK' : 'Copy'}
					</button>
				</div>
			</div>

			<div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
				<h2 class="text-base font-bold text-slate-950">Contoh Campaign</h2>
				<div class="mt-4 space-y-2">
					{#each data.campaignExamples as url}
						<div class="flex items-center gap-2">
							<input class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600" readonly value={url} />
							<button
								type="button"
								class="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
								onclick={() => copyUrl(url)}
							>
								{copiedUrl === url ? 'OK' : 'Copy'}
							</button>
						</div>
					{/each}
				</div>
			</div>

			<div class="rounded-lg border border-red-200 bg-white p-4 shadow-sm">
				<h2 class="text-base font-bold text-red-700">Hapus Shortlink</h2>
				<p class="mt-2 text-sm text-slate-600">Penghapusan juga menghapus click logs dan daily stats untuk slug ini.</p>
				<form
					method="POST"
					action="?/delete"
					class="mt-4 space-y-3"
					onsubmit={(event) => {
						if (!confirm(`Hapus shortlink /${data.link.slug}?`)) event.preventDefault();
					}}
				>
					<label for="confirm_delete" class="block text-sm font-semibold text-slate-700">Ketik slug untuk konfirmasi</label>
					<input
						id="confirm_delete"
						name="confirm_delete"
						class="w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
						placeholder={data.link.slug}
					/>
					<button
						type="submit"
						class="inline-flex w-full items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
					>
						Hapus
					</button>
				</form>
			</div>
		</div>
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
		<div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
			<div class="flex items-center justify-between gap-3">
				<h2 class="text-base font-bold text-slate-950">Grafik Klik 30 Hari</h2>
			</div>
			<div class="mt-5 flex h-60 items-end gap-1 border-b border-slate-200 px-1 sm:gap-2">
				{#each chartDailyStats as row}
					<div class="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
						<div class="flex h-full items-end">
							<div
								class="w-full rounded-t bg-emerald-600 transition hover:bg-emerald-700"
								style={`height: ${Math.max((row.clicks / maxDailyClicks) * 100, row.clicks > 0 ? 5 : 0)}%`}
								title={`${row.dateKey}: ${formatNumber(row.clicks)} klik`}
							></div>
						</div>
						<p class="hidden truncate text-center text-[11px] text-slate-500 sm:block">{formatShortDate(row.dateKey)}</p>
					</div>
				{/each}
			</div>
			<div class="mt-4 overflow-x-auto">
				<h3 class="mb-3 text-sm font-semibold text-slate-700">Tabel klik harian</h3>
				<table class="min-w-full divide-y divide-slate-200 text-sm">
					<thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
						<tr>
							<th class="px-3 py-2">Tanggal</th>
							<th class="px-3 py-2 text-right">Klik</th>
							<th class="px-3 py-2 text-right">Unique</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each data.dailyStats as row}
							<tr>
								<td class="px-3 py-2 text-slate-700">{row.dateKey}</td>
								<td class="px-3 py-2 text-right font-semibold text-slate-950">{formatNumber(row.clicks)}</td>
								<td class="px-3 py-2 text-right text-slate-700">{formatNumber(row.uniqueClicks)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
			{@render TopTable('Top Source', data.topSource)}
			{@render TopTable('Top Campaign', data.topCampaign)}
			{@render TopTable('Top Country', data.topCountry)}
			{@render TopTable('Top Referrer', data.topReferrer)}
		</div>
	</div>

	<div class="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
		<h2 class="text-base font-bold text-slate-950">Click Logs</h2>
		<div class="mt-4 overflow-x-auto">
			<table class="min-w-full divide-y divide-slate-200 text-sm">
				<thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
					<tr>
						<th class="px-3 py-2">Waktu</th>
						<th class="px-3 py-2">Source</th>
						<th class="px-3 py-2">Campaign</th>
						<th class="px-3 py-2">Medium</th>
						<th class="px-3 py-2">Lokasi</th>
						<th class="px-3 py-2">Referrer</th>
						<th class="px-3 py-2">User Agent</th>
						<th class="px-3 py-2">Hash IP</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each data.clickLogs as click}
						<tr class="align-top">
							<td class="whitespace-nowrap px-3 py-2 text-slate-700">{formatDateTime(click.clickedAt)}</td>
							<td class="px-3 py-2 text-slate-700">{click.source ?? '-'}</td>
							<td class="px-3 py-2 text-slate-700">{click.campaign ?? '-'}</td>
							<td class="px-3 py-2 text-slate-700">{click.medium ?? '-'}</td>
							<td class="px-3 py-2 text-slate-700">
								{[click.city, click.country, click.colo].filter(Boolean).join(', ') || '-'}
							</td>
							<td class="max-w-md break-all px-3 py-2 text-slate-600">{click.referrer ?? '-'}</td>
							<td class="max-w-md break-all px-3 py-2 text-slate-600">{click.userAgent ?? '-'}</td>
							<td class="px-3 py-2 text-slate-700">{click.hasIpHash ? 'Ada' : '-'}</td>
						</tr>
					{:else}
						<tr>
							<td colspan="8" class="px-3 py-8 text-center text-slate-500">Belum ada klik.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</section>

{#snippet TopTable(title: string, rows: { label: string; total: number }[])}
	<div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
		<h2 class="text-base font-bold text-slate-950">{title}</h2>
		<div class="mt-4 space-y-3">
			{#each rows as row}
				<div class="flex items-start justify-between gap-3 text-sm">
					<span class="min-w-0 break-all text-slate-600">{row.label}</span>
					<span class="shrink-0 font-semibold text-slate-950">{formatNumber(row.total)}</span>
				</div>
			{:else}
				<p class="text-sm text-slate-500">Belum ada data.</p>
			{/each}
		</div>
	</div>
{/snippet}
