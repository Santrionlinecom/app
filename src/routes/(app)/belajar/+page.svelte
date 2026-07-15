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
	$: totalQuestions = modules.reduce((total, module) => total + module.total_soal, 0);
</script>

<svelte:head>
	<title>Ruang Belajar Santri - SantriOnline</title>
	<meta
		name="description"
		content="Kurikulum bertahap SantriOnline untuk membangun ilmu, adab, amal, dan keterampilan santri."
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
				<p class="text-xs font-bold uppercase tracking-[0.22em] text-[#C9A84C]">Ruang Belajar Santri</p>
				<h1 class="mt-2 text-3xl font-extrabold tracking-tight text-[#1B4332] md:text-5xl">
					Belajar bertahap, tumbuh setiap hari
				</h1>
				<p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
					Mulai dari pondasi Bahasa Arab dan Nahwu melalui pelajaran singkat, latihan langsung,
					serta progres yang tersimpan. Selesaikan satu tingkat sebelum membuka tingkat berikutnya.
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
			<p class="text-sm font-semibold text-slate-500">Latihan tersedia</p>
			<p class="mt-2 text-2xl font-extrabold text-[#1B4332]">{totalQuestions} soal</p>
		</div>
	</div>

	{#if loadError}
		<p class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
			{loadError}
		</p>
	{/if}

	<section aria-labelledby="active-curriculum-title">
		<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
			<div>
				<p class="text-xs font-bold uppercase tracking-[0.18em] text-[#C9A84C]">Jalur aktif</p>
				<h2 id="active-curriculum-title" class="mt-1 text-2xl font-extrabold text-[#1B4332]">
					Bahasa Arab & Nahwu Dasar
				</h2>
			</div>
			<p class="text-sm font-semibold text-slate-500">{modules.length} tingkat pembelajaran</p>
		</div>

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

		{#if !isLoading && modules.length === 0}
			<div class="rounded-xl border border-[#C9A84C]/30 bg-[#FAF8F3] p-6 text-center">
				<h3 class="text-lg font-extrabold text-[#1B4332]">Modul sedang disiapkan</h3>
				<p class="mt-2 text-sm leading-6 text-slate-600">
					Kurikulum akan muncul di sini setelah proses sinkronisasi selesai.
				</p>
			</div>
		{/if}
	</section>

	<aside class="rounded-xl border border-[#1B4332]/10 bg-[#F2F7F4] p-5 sm:p-6" aria-labelledby="next-path-title">
		<p class="text-xs font-bold uppercase tracking-[0.18em] text-[#C9A84C]">Roadmap kurikulum</p>
		<h2 id="next-path-title" class="mt-1 text-xl font-extrabold text-[#1B4332]">
			Jalur pembinaan berikutnya
		</h2>
		<p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
			Materi Aqidah Aswaja, adab, fikih ibadah, sirah Rasulullah ﷺ, dan keterampilan digital
			akan dibuka bertahap agar belajar tidak berhenti pada pengetahuan, tetapi menjadi kebiasaan baik.
		</p>
	</aside>

	{#if isLoading}
		<p class="text-center text-sm font-semibold text-slate-500">Memuat ulang modul...</p>
	{/if}
</section>

<style>
	.learn-page {
		font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
	}
</style>
