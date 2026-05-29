<script lang="ts">
	import { DatabaseZap, Loader2, ShieldCheck } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	type ScraperResponse = {
		ok: boolean;
		target: string;
		label: string;
		sourceUrl: string;
		url_fetched: string;
		fetchedBy: {
			email: string;
			role: string;
		};
		meta: {
			status: number;
			durationMs: number;
			fetchedAt: string;
		};
		data: unknown;
	};

	const targets = [
		{ key: 'posts_demo', label: 'JSONPlaceholder Posts' },
		{ key: 'users_demo', label: 'JSONPlaceholder Users' },
		{ key: 'quran_surah_demo', label: 'Quran API Surah' },
		{ key: 'custom', label: 'Target Kustom (Paste Link)' }
	];

	let selectedTarget = targets[0].key;
	let customUrl = '';
	let limit = 10;
	let loading = false;
	let errorMessage = '';
	let result: ScraperResponse | null = null;

	const runScraper = async () => {
		loading = true;
		errorMessage = '';
		result = null;

		try {
			const response = await fetch('/api/tools/scraper', {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					target: selectedTarget,
					custom_url: selectedTarget === 'custom' ? customUrl : undefined,
					limit
				})
			});

			const payload = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(payload?.message ?? payload?.error ?? 'Gagal mengambil data target.');
			}

			result = payload as ScraperResponse;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak dikenal.';
		} finally {
			loading = false;
		}
	};
</script>

<svelte:head>
	<title>Scraper Data Aggregator | Admin SantriOnline</title>
</svelte:head>

<main class="min-h-screen bg-slate-50 text-slate-900">
	<section class="border-b border-slate-200 bg-white">
		<div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<p class="text-sm font-semibold uppercase tracking-wide text-emerald-700">Super Admin Tools</p>
					<h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">Scraper Data Aggregator</h1>
					<p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
						Mengambil JSON mentah dari target bawaan atau URL kustom yang sudah melewati whitelist domain di backend.
					</p>
				</div>

				<div class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
					<div class="flex items-center gap-2 font-semibold">
						<ShieldCheck class="h-4 w-4" />
						<span>Session aktif: {data.user.role}</span>
					</div>
					<p class="mt-1 text-emerald-700">{data.user.email}</p>
				</div>
			</div>
		</div>
	</section>

	<section class="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
		<form class="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm" on:submit|preventDefault={runScraper}>
			<div class="flex items-center gap-2">
				<DatabaseZap class="h-5 w-5 text-emerald-700" />
				<h2 class="text-lg font-semibold text-slate-950">Target Fetch</h2>
			</div>

			<label class="mt-5 block text-sm font-medium text-slate-700" for="target">Target JSON</label>
			<select
				id="target"
				bind:value={selectedTarget}
				class="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
			>
				{#each targets as target}
					<option value={target.key}>{target.label}</option>
				{/each}
			</select>

			{#if selectedTarget === 'custom'}
				<label class="mt-4 block text-sm font-medium text-slate-700" for="custom-url">URL API Kustom</label>
				<input
					id="custom-url"
					type="url"
					bind:value={customUrl}
					placeholder="https://dummyjson.com/products"
					required
					class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
				/>
				<p class="mt-2 text-xs leading-5 text-slate-500">
					Domain yang diizinkan: shopee.co.id, tokopedia.com, dummyjson.com.
				</p>
			{/if}

			<label class="mt-4 block text-sm font-medium text-slate-700" for="limit">Limit data</label>
			<input
				id="limit"
				type="number"
				min="1"
				max="50"
				bind:value={limit}
				class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
			/>

			<button
				type="submit"
				disabled={loading}
				class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
			>
				{#if loading}
					<Loader2 class="h-4 w-4 animate-spin" />
					<span>Mengambil data</span>
				{:else}
					<DatabaseZap class="h-4 w-4" />
					<span>Jalankan Scraper</span>
				{/if}
			</button>
		</form>

		<div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
			<div class="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 class="text-lg font-semibold text-slate-950">Hasil JSON Mentah</h2>
					<p class="text-sm text-slate-500">Response asli dari API target setelah melewati backend guard.</p>
				</div>
				{#if result}
					<span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
						Latency {result.meta.durationMs} ms
					</span>
				{/if}
			</div>

			{#if errorMessage}
				<div class="mt-5 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
					{errorMessage}
				</div>
			{:else if result}
				<div class="mt-5 grid gap-4">
					<div class="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
						<p><span class="font-semibold">Target:</span> {result.label}</p>
						<p class="mt-1"><span class="font-semibold">Status:</span> {result.meta.status}</p>
						<p class="mt-1"><span class="font-semibold">Latency:</span> {result.meta.durationMs} ms</p>
						<p class="mt-1 break-all"><span class="font-semibold">URL dieksekusi:</span> {result.url_fetched ?? result.sourceUrl}</p>
						<p class="mt-1"><span class="font-semibold">Waktu:</span> {new Date(result.meta.fetchedAt).toLocaleString('id-ID')}</p>
					</div>
					<pre class="max-h-[560px] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">{JSON.stringify(result.data, null, 2)}</pre>
				</div>
			{:else}
				<div class="mt-5 rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
					Pilih target lalu jalankan scraper untuk melihat JSON.
				</div>
			{/if}
		</div>
	</section>
</main>
