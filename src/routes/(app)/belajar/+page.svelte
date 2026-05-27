<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowRight, Medal } from 'lucide-svelte';
	import ModulCard from '$lib/components/belajar/ModulCard.svelte';
	import ProgressXP from '$lib/components/belajar/ProgressXP.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	type ApiModule = {
		id: string;
		judul: string;
		deskripsi: string | null;
		kategori: string;
		urutan: number;
		total_soal: number;
		soal_selesai: number;
		progress_persen: number;
		status: string;
		xp: number;
		locked: boolean;
		terkunci: boolean;
	};

	type ApiSummary = {
		xp_sekarang: number;
		xp_target: number;
		streak_hari: number;
	};

	const fromServerModule = (module: PageData['modules'][number]): ApiModule => {
		const progress = module.totalSoal
			? Math.round((module.soalSelesai / module.totalSoal) * 100)
			: 0;
		return {
			id: module.id,
			judul: module.judul,
			deskripsi: module.deskripsi,
			kategori: module.kategori,
			urutan: module.urutan,
			total_soal: module.totalSoal,
			soal_selesai: module.soalSelesai,
			progress_persen: progress,
			status: module.status,
			xp: module.xp,
			locked: module.locked,
			terkunci: module.locked
		};
	};

	const actionLabel = (module: ApiModule) => {
		if (module.locked) return 'Terkunci';
		if (module.status === 'selesai') return 'Ulangi';
		if (module.soal_selesai > 0) return 'Lanjutkan';
		return 'Mulai Belajar';
	};

	let modules: ApiModule[] = (data.modules ?? []).map(fromServerModule);
	let summary: ApiSummary = {
		xp_sekarang: data.summary.totalXp,
		xp_target: Math.max(100, (Math.floor(data.summary.totalXp / 100) + 1) * 100),
		streak_hari: data.summary.streakHari
	};
	let isLoading = false;
	let loadError = '';

	onMount(async () => {
		isLoading = true;
		try {
			const response = await fetch('/api/belajar/modul');
			const payload = await response.json();
			if (!response.ok || !payload.ok) {
				throw new Error(payload.error ?? 'Gagal memuat modul belajar.');
			}
			modules = payload.modules ?? modules;
			summary = payload.summary ?? summary;
		} catch (err) {
			loadError = err instanceof Error ? err.message : 'Gagal memuat modul belajar.';
		} finally {
			isLoading = false;
		}
	});

	$: completedCount = modules.filter((module) => module.progress_persen >= 100).length;
</script>

<svelte:head>
	<title>SantriLearn - SantriOnline</title>
	<meta
		name="description"
		content="Gamifikasi belajar Nahwu dan percakapan Bahasa Arab untuk santri."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Scheherazade+New:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<section class="learn-page mx-auto max-w-7xl space-y-6 pb-24 md:pb-8">
	<header class="rounded-xl border border-[#1B4332]/10 bg-white p-5 shadow-sm sm:p-7">
		<div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
			<div class="min-w-0">
				<p class="text-xs font-bold uppercase tracking-[0.22em] text-[#C9A84C]">Belajar Santri</p>
				<h1 class="mt-2 text-3xl font-extrabold tracking-tight text-[#1B4332] md:text-5xl">
					SantriLearn 🎓
				</h1>
				<p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
					Kurikulum bertahap untuk memahami kata, jumlah, fi'il, maf'ul bih, dan dialog
					perkenalan Bahasa Arab.
				</p>
			</div>

			<a
				href="/belajar/leaderboard"
				class="inline-flex items-center justify-center gap-2 rounded-xl border border-[#C9A84C]/40 bg-[#FAF8F3] px-4 py-3 text-sm font-extrabold text-[#1B4332] transition hover:border-[#C9A84C]"
			>
				<Medal class="h-4 w-4 text-[#C9A84C]" />
				Leaderboard
				<ArrowRight class="h-4 w-4" />
			</a>
		</div>

		<div class="mt-6">
			<ProgressXP
				xp_sekarang={summary.xp_sekarang}
				xp_target={summary.xp_target}
				streak_hari={summary.streak_hari}
			/>
		</div>
	</header>

	<div class="grid gap-4 sm:grid-cols-3">
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<p class="text-sm font-semibold text-slate-500">Modul selesai</p>
			<p class="mt-2 text-2xl font-extrabold text-[#1B4332]">{completedCount}/{modules.length}</p>
		</div>
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<p class="text-sm font-semibold text-slate-500">XP per benar</p>
			<p class="mt-2 text-2xl font-extrabold text-[#1B4332]">+10</p>
		</div>
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<p class="text-sm font-semibold text-slate-500">XP per salah</p>
			<p class="mt-2 text-2xl font-extrabold text-[#1B4332]">+2</p>
		</div>
	</div>

	{#if loadError}
		<p class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
			{loadError}
		</p>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		{#each modules as module}
			<div class="space-y-3">
				{#if module.locked}
					<ModulCard modul={module} />
					<button
						type="button"
						class="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-extrabold text-slate-500"
						disabled
					>
						Terkunci
					</button>
				{:else}
					<a href={`/belajar/${module.id}`} class="block">
						<ModulCard modul={module} />
					</a>
					<a
						href={`/belajar/${module.id}`}
						class="inline-flex w-full items-center justify-center rounded-xl bg-[#1B4332] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#143527]"
					>
						{actionLabel(module)}
					</a>
				{/if}
			</div>
		{/each}
	</div>

	{#if isLoading}
		<p class="text-center text-sm font-semibold text-slate-500">Memuat ulang modul...</p>
	{/if}
</section>

<style>
	.learn-page {
		font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
	}
</style>
