<script lang="ts">
	import Copy from '@lucide/svelte/icons/copy';
	import Download from '@lucide/svelte/icons/download';
	import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
	import QrCode from '@lucide/svelte/icons/qr-code';
	import StickyNote from '@lucide/svelte/icons/sticky-note';
	import Upload from '@lucide/svelte/icons/upload';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let copiedSlug = $state<string | null>(null);
	let qrModalOpen = $state(false);
	let qrModalSlug = $state<string | null>(null);
	let qrModalTitle = $state('');
	let qrModalShortUrl = $state('');
	let qrModalDataUrl = $state('');
	let qrModalLoading = $state(false);
	let qrModalError = $state('');

	type CreateValues = {
		slug: string;
		title: string;
		description: string;
		targetUrl: string;
		category: string;
		notes: string;
		isActive: boolean;
	};

	const values = $derived(
		(form as { values?: CreateValues } | null | undefined)?.values ?? {
			slug: '',
			title: '',
			description: '',
			targetUrl: '',
			category: data.createDefaults.category,
			notes: '',
			isActive: data.createDefaults.isActive
		}
	);

	const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value);
	const formatShortDate = (dateKey: string) =>
		new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(`${dateKey}T00:00:00Z`));

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

	const categoryHex = (color: string) => {
		switch (color) {
			case 'blue':
				return '#2563eb';
			case 'green':
				return '#16a34a';
			case 'teal':
				return '#0d9488';
			case 'amber':
				return '#d97706';
			case 'purple':
				return '#9333ea';
			default:
				return '#64748b';
		}
	};

	const categoryByKey = $derived(new Map(data.categories.map((category) => [category.key, category])));
	const maxDailyClicks = $derived(Math.max(...data.dailyChart.map((row) => row.clicks), 1));
	const topShortlinks = $derived([...data.shortlinks].sort((a, b) => b.totalClicks - a.totalClicks).slice(0, 6));
	const maxTopClicks = $derived(Math.max(...topShortlinks.map((link) => link.totalClicks), 1));
	const totalCategoryClicks = $derived(data.categoryStats.reduce((sum, category) => sum + category.totalClicks, 0));
	const topCategory = $derived([...data.categoryStats].sort((a, b) => b.totalClicks - a.totalClicks)[0] ?? null);
	const categoryDonutGradient = $derived.by(() => {
		if (totalCategoryClicks <= 0) return '#e2e8f0 0 100%';
		let cursor = 0;
		return data.categoryStats
			.map((category) => {
				const start = cursor;
				const width = (category.totalClicks / totalCategoryClicks) * 100;
				cursor += width;
				const color = categoryHex(category.color);
				return `${color} ${start}% ${cursor}%`;
			})
			.join(', ');
	});
	const summaryCards = $derived([
		{ label: 'Total shortlink', value: data.summary.totalLinks },
		{ label: 'Shortlink aktif', value: data.summary.activeLinks },
		{ label: 'Total klik', value: data.summary.totalClicks },
		{ label: 'Klik hari ini', value: data.summary.clicksToday },
		{ label: 'Klik 7 hari', value: data.summary.clicks7d }
	]);

	const reportUrl = (format: 'xlsx' | 'csv') => {
		const params = new URLSearchParams({ format });
		if (data.filters.q) params.set('q', data.filters.q);
		if (data.filters.category !== 'all') params.set('category', data.filters.category);
		if (data.filters.isActive !== 'all') params.set('is_active', data.filters.isActive);
		return `/api/reports/shortlinks?${params.toString()}`;
	};

	const copyText = async (text: string) => {
		await navigator.clipboard.writeText(text);
	};

	const copyLink = async (slug: string, url: string) => {
		await copyText(url);
		copiedSlug = slug;
		setTimeout(() => {
			if (copiedSlug === slug) copiedSlug = null;
		}, 1500);
	};

	const shortUrlForSlug = (slug: string) => `${window.location.origin}/r/${slug}`;

	const qrPngName = (slug: string) => `santrionline-qr-${slug}.png`;

	const generateQrDataUrl = async (shortUrl: string) => {
		const { default: QRCode } = await import('qrcode');
		return QRCode.toDataURL(shortUrl, {
			width: 1024,
			margin: 1,
			errorCorrectionLevel: 'M'
		});
	};

	const downloadQrPng = async (slug: string, shortUrl: string) => {
		const dataUrl = await generateQrDataUrl(shortUrl);
		const link = document.createElement('a');
		link.href = dataUrl;
		link.download = qrPngName(slug);
		link.click();
	};

	const openQrModal = async (link: { slug: string; title: string }) => {
		qrModalOpen = true;
		qrModalSlug = link.slug;
		qrModalTitle = link.title;
		qrModalShortUrl = shortUrlForSlug(link.slug);
		qrModalDataUrl = '';
		qrModalError = '';
		qrModalLoading = true;

		try {
			qrModalDataUrl = await generateQrDataUrl(qrModalShortUrl);
		} catch {
			qrModalError = 'QR Code gagal dibuat.';
		} finally {
			qrModalLoading = false;
		}
	};

	const closeQrModal = () => {
		qrModalOpen = false;
		qrModalSlug = null;
		qrModalTitle = '';
		qrModalShortUrl = '';
		qrModalDataUrl = '';
		qrModalError = '';
		qrModalLoading = false;
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
		<div class="flex flex-wrap gap-2">
			<a
				href={reportUrl('xlsx')}
				class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
				download
			>
				<Download size={16} strokeWidth={2.2} />
				Excel
			</a>
			<a
				href={reportUrl('csv')}
				class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
				download
			>
				<Download size={16} strokeWidth={2.2} />
				CSV
			</a>
			<a
				href="/api/reports/shortlinks/template"
				class="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
				download
			>
				<FileSpreadsheet size={16} strokeWidth={2.2} />
				Template
			</a>
		</div>
	</div>

	<div class="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
		<div class="flex flex-col gap-1">
			<h2 class="text-base font-bold text-slate-950">Buat Shortlink</h2>
			<p class="text-sm text-slate-500">Tambahkan kategori supaya analytics afiliasi mudah dipisah.</p>
		</div>

		{#if form?.error}
			<div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
				{form.error}
			</div>
		{:else if form?.updated}
			<div class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
				Status shortlink diperbarui.
			</div>
		{:else if form?.imported}
			<div class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
				Import berhasil: {form.importSummary?.inserted ?? 0} shortlink masuk, {form.importSummary?.duplicateRows ?? 0} duplikat,
				{form.importSummary?.invalidRows ?? 0} invalid.
				{#if form.importSummary?.truncatedRows}
					{form.importSummary.truncatedRows} baris melewati batas.
				{/if}
			</div>
		{/if}

		<form method="POST" action="?/create" class="mt-5 grid gap-4 lg:grid-cols-2">
			<div>
				<label for="slug" class="block text-sm font-semibold text-slate-700">Slug</label>
				<input
					id="slug"
					name="slug"
					required
					pattern="[a-z0-9_-]+"
					class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
					value={values.slug}
					placeholder="gotrade"
				/>
			</div>
			<div>
				<label for="title" class="block text-sm font-semibold text-slate-700">Title</label>
				<input
					id="title"
					name="title"
					required
					class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
					value={values.title}
					placeholder="GoTrade - Belajar Saham Global"
				/>
			</div>
			<div class="lg:col-span-2">
				<label for="target_url" class="block text-sm font-semibold text-slate-700">Target URL</label>
				<input
					id="target_url"
					name="target_url"
					required
					type="url"
					class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
					value={values.targetUrl}
					placeholder="https://example.com/gotrade-affiliate-link"
				/>
			</div>
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
			<div class="flex flex-col gap-4 lg:col-span-2 sm:flex-row sm:items-center sm:justify-between">
				<label class="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700">
					<input name="is_active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-emerald-700" checked={values.isActive} />
					Is Active
				</label>
				<button
					type="submit"
					class="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
				>
					Simpan Shortlink
				</button>
			</div>
		</form>
	</div>

	<div class="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
		<div class="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
			<div>
				<h2 class="text-base font-bold text-slate-950">Upload Massal Shortlink</h2>
				<p class="mt-1 text-sm text-slate-500">Unggah file .xlsx, .xls, atau .csv dengan kolom slug, title, target_url, category, description, notes, is_active.</p>
			</div>
			<form method="POST" action="?/importShortlinks" enctype="multipart/form-data" class="flex flex-col gap-2 sm:flex-row sm:items-center">
				<input
					name="file"
					type="file"
					accept=".xlsx,.xls,.csv"
					required
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200 sm:w-[320px]"
				/>
				<button
					type="submit"
					class="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
				>
					<Upload size={16} strokeWidth={2.2} />
					Upload
				</button>
			</form>
		</div>
	</div>

	<div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
		{#each summaryCards as card}
			<div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
				<p class="text-sm font-medium text-slate-500">{card.label}</p>
				<p class="mt-2 text-2xl font-bold text-slate-950">{formatNumber(card.value)}</p>
			</div>
		{/each}
	</div>

	{#if data.categoryStats.length > 0}
		<div class="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
			{#each data.categoryStats as category}
				<a
					href={`/admin/shortlinks?category=${category.key}`}
					class={`rounded-lg border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow ${categoryBadgeClass(category.color)}`}
				>
					<p class="text-sm font-bold">{category.label}</p>
					<p class="mt-1 text-xs opacity-80">{category.description}</p>
					<div class="mt-4 flex items-end justify-between gap-3">
						<p class="text-sm font-semibold">{formatNumber(category.linkCount)} link</p>
						<p class="text-2xl font-bold">{formatNumber(category.totalClicks)}</p>
					</div>
				</a>
			{/each}
		</div>
	{/if}

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
			<div class="flex items-start justify-between gap-4">
				<div>
					<h2 class="text-base font-bold text-slate-950">Klik per Kategori</h2>
					{#if topCategory}
						<p class="mt-1 text-sm text-slate-500">Teratas: {topCategory.label}</p>
					{/if}
				</div>
				<div
					class="grid h-24 w-24 shrink-0 place-items-center rounded-full"
					style={`background: conic-gradient(${categoryDonutGradient})`}
					aria-label="Clicks by category"
				>
					<div class="h-14 w-14 rounded-full bg-white"></div>
				</div>
			</div>
			<div class="mt-5 space-y-3">
				{#each data.categoryStats as category}
					<div class="flex items-center justify-between gap-3 text-sm">
						<div class="flex min-w-0 items-center gap-2">
							<span class="h-2.5 w-2.5 shrink-0 rounded-full" style={`background: ${categoryHex(category.color)}`}></span>
							<span class="truncate text-slate-700">{category.label}</span>
						</div>
						<span class="shrink-0 font-semibold text-slate-950">{formatNumber(category.totalClicks)}</span>
					</div>
				{:else}
					<p class="text-sm text-slate-500">Belum ada data kategori.</p>
				{/each}
			</div>
		</div>
	</div>

	<div class="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
		<form method="GET" class="grid gap-3 lg:grid-cols-[1fr_220px_180px_auto]">
			<input
				name="q"
				class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
				value={data.filters.q}
				placeholder="Cari slug atau destination_url"
			/>
			<select
				name="category"
				class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
			>
				<option value="all" selected={data.filters.category === 'all'}>Semua kategori</option>
				{#each data.categories as category}
					<option value={category.key} selected={data.filters.category === category.key}>{category.label}</option>
				{/each}
			</select>
			<select
				name="is_active"
				class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
			>
				<option value="all" selected={data.filters.isActive === 'all'}>Semua status</option>
				<option value="active" selected={data.filters.isActive === 'active'}>Active</option>
				<option value="inactive" selected={data.filters.isActive === 'inactive'}>Inactive</option>
			</select>
			<button
				type="submit"
				class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
			>
				Filter
			</button>
		</form>
	</div>

	<div class="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
		<div class="overflow-x-auto">
			<table class="w-full min-w-[1180px] table-fixed divide-y divide-slate-200 text-sm">
				<colgroup>
					<col class="w-[220px]" />
					<col class="w-[150px]" />
					<col class="w-[320px]" />
					<col class="w-[100px]" />
					<col class="w-[80px]" />
					<col class="w-[90px]" />
					<col class="w-[90px]" />
					<col class="w-[260px]" />
					<col class="w-[90px]" />
				</colgroup>
				<thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
					<tr>
						<th class="px-4 py-3">Shortlink</th>
						<th class="px-4 py-3">Category</th>
						<th class="px-4 py-3">Target</th>
						<th class="px-4 py-3">Status</th>
						<th class="px-4 py-3 text-right">Total</th>
						<th class="px-4 py-3 text-right">Hari Ini</th>
						<th class="px-4 py-3 text-right">7 Hari</th>
					<th class="px-4 py-3">Aksi</th>
					<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each data.shortlinks as link}
						<tr class="align-top">
							<td class="px-4 py-4">
								<div class="flex items-center gap-2">
									<a href={`/admin/shortlinks/${link.slug}`} class="font-semibold text-slate-950 hover:text-emerald-700">
										/{link.slug}
									</a>
									{#if link.hasNotes}
										<span title={link.notes ?? ''} class="inline-flex text-slate-400">
											<StickyNote size={14} strokeWidth={2.2} />
										</span>
									{/if}
								</div>
								<p class="mt-1 text-slate-500">{link.title}</p>
							</td>
							<td class="px-4 py-4">
								<span
									class={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${categoryBadgeClass(
										categoryByKey.get(link.category)?.color ?? 'gray'
									)}`}
								>
									{link.categoryLabel}
								</span>
							</td>
							<td class="px-4 py-4 text-slate-600">
								<a
									href={link.targetUrl}
									class="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap hover:text-emerald-700"
									target="_blank"
									rel="noreferrer"
									title={link.targetUrl}
								>
									{link.targetUrl}
								</a>
							</td>
							<td class="px-4 py-4">
								<form method="POST" action="?/toggleStatus">
									<input type="hidden" name="id" value={link.id} />
									<input type="hidden" name="is_active" value={link.isActive ? '0' : '1'} />
									<button
										type="submit"
										class={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold transition ${
											link.isActive
												? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
												: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
										}`}
										title="Toggle active/inactive"
									>
										{link.isActive ? 'Active' : 'Inactive'}
									</button>
								</form>
							</td>
							<td class="px-4 py-4 text-right font-semibold text-slate-950">{formatNumber(link.totalClicks)}</td>
							<td class="px-4 py-4 text-right text-slate-700">{formatNumber(link.clicksToday)}</td>
							<td class="px-4 py-4 text-right text-slate-700">{formatNumber(link.clicks7d)}</td>
							<td class="px-4 py-4">
								<div class="flex flex-wrap gap-2">
									<button
										type="button"
										class="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
										onclick={() => openQrModal(link)}
									>
										<QrCode size={14} strokeWidth={2.2} />
										QR Code / Barcode
									</button>
									<button
										type="button"
										class="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
										onclick={() => downloadQrPng(link.slug, shortUrlForSlug(link.slug))}
									>
										<Download size={14} strokeWidth={2.2} />
										Download QR PNG
									</button>
									<button
										type="button"
										class="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
										onclick={() => copyLink(link.slug, shortUrlForSlug(link.slug))}
									>
										<Copy size={14} strokeWidth={2.2} />
										{copiedSlug === link.slug ? 'OK' : 'Copy Short URL'}
									</button>
								</div>
							</td>
							<td class="px-4 py-4 text-right">
								<a href={`/admin/shortlinks/${link.slug}`} class="text-sm font-semibold text-emerald-700 hover:text-emerald-700">
									Kelola
								</a>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="9" class="px-4 py-10 text-center text-slate-500">Belum ada shortlink.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	{#if qrModalOpen}
		<div class="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
			<button
				type="button"
				class="absolute inset-0 bg-slate-950/60"
				aria-label="Tutup modal QR"
				onclick={closeQrModal}
			></button>
			<div
				class="relative z-10 w-full max-w-lg rounded-lg border border-slate-200 bg-white p-5 shadow-2xl"
				role="dialog"
				tabindex="-1"
				aria-modal="true"
				aria-labelledby="qr-modal-title"
			>
				<div class="flex items-start justify-between gap-4">
					<div>
						<h2 id="qr-modal-title" class="text-base font-bold text-slate-950">QR Code / Barcode</h2>
						<p class="mt-1 text-sm text-slate-500">{qrModalTitle}</p>
					</div>
					<button
						type="button"
						class="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
						onclick={closeQrModal}
					>
						Tutup
					</button>
				</div>

				<div class="mt-4 space-y-3 text-sm">
					<div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
						<p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Slug</p>
						<p class="mt-1 break-all font-mono text-slate-900">{qrModalSlug}</p>
					</div>
					<div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
						<p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Short URL</p>
						<p class="mt-1 break-all font-mono text-slate-900">{qrModalShortUrl}</p>
					</div>
				</div>

				<div class="mt-5 rounded-lg border border-slate-200 bg-white p-4">
					{#if qrModalLoading}
						<p class="text-sm text-slate-600">Memuat QR Code...</p>
					{:else if qrModalError}
						<p class="text-sm text-red-700">{qrModalError}</p>
					{:else if qrModalDataUrl}
						<div class="grid place-items-center">
							<img
								src={qrModalDataUrl}
								alt={`QR Code ${qrModalTitle}`}
								class="h-64 w-64 rounded-lg border border-slate-200 bg-white p-3"
							/>
						</div>
					{/if}
				</div>

				<div class="mt-5 flex flex-wrap gap-2">
					<button
						type="button"
						class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
						onclick={() => qrModalShortUrl && copyText(qrModalShortUrl)}
						disabled={!qrModalShortUrl}
					>
						<Copy size={16} strokeWidth={2.2} />
						Salin Short URL
					</button>
					<button
						type="button"
						class="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
						onclick={() => qrModalSlug && qrModalShortUrl && downloadQrPng(qrModalSlug, qrModalShortUrl)}
						disabled={!qrModalSlug || !qrModalShortUrl}
					>
						<Download size={16} strokeWidth={2.2} />
						Download QR PNG
					</button>
				</div>
			</div>
		</div>
	{/if}
</section>
