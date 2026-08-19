<script lang="ts">
	import { ArrowRight, BookOpen, Medal } from '@lucide/svelte';
	import ModulCard from '$lib/components/belajar/ModulCard.svelte';
	import ProgressXP from '$lib/components/belajar/ProgressXP.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	type ApiModule = {
		id: string;
		judul: string;
		deskripsi: string | null;
		kategori: string;
		path_key: string;
		path_title: string;
		path_purpose: string;
		path_order: number;
		path_kitab_slug: string | null;
		urutan: number;
		total_soal: number;
		soal_selesai: number;
		progress_persen: number;
		status: string;
		xp: number;
		locked: boolean;
		terkunci: boolean;
	};

	type PathGroup = {
		key: string;
		title: string;
		purpose: string;
		order: number;
		kitabSlug: string | null;
		modules: ApiModule[];
		completedModules: number;
		totalQuestions: number;
		solvedQuestions: number;
		progressPercent: number;
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
			path_key: module.pathKey,
			path_title: module.pathTitle,
			path_purpose: module.pathPurpose,
			path_order: module.pathOrder,
			path_kitab_slug: module.pathKitabSlug ?? null,
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

	const groupByPath = (items: ApiModule[]): PathGroup[] => {
		const groups = new Map<string, Omit<PathGroup, 'completedModules' | 'totalQuestions' | 'solvedQuestions' | 'progressPercent'>>();
		for (const module of items) {
			const key = module.path_key || 'arabic_nahwu';
			const group = groups.get(key) ?? {
				key,
				title: module.path_title || 'Bahasa Arab & Nahwu',
				purpose: module.path_purpose || 'Fondasi belajar bertahap untuk santri.',
				order: Number(module.path_order ?? 999),
				kitabSlug: module.path_kitab_slug ?? null,
				modules: []
			};
			group.modules.push(module);
			groups.set(key, group);
		}

		return Array.from(groups.values())
			.map((group) => {
				const totalQuestions = group.modules.reduce((total, module) => total + module.total_soal, 0);
				const solvedQuestions = group.modules.reduce((total, module) => total + module.soal_selesai, 0);
				const completedModules = group.modules.filter((module) => module.progress_persen >= 100).length;
				return {
					...group,
					modules: [...group.modules].sort((a, b) => a.urutan - b.urutan),
					completedModules,
					totalQuestions,
					solvedQuestions,
					progressPercent: totalQuestions ? Math.round((solvedQuestions / totalQuestions) * 100) : 0
				};
			})
			.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
	};

	let modules: ApiModule[] = (data.modules ?? []).map(fromServerModule);
	let summary: ApiSummary = {
		xp_sekarang: data.summary.totalXp,
		xp_target: Math.max(100, (Math.floor(data.summary.totalXp / 100) + 1) * 100),
		streak_hari: data.summary.streakHari
	};

	$: completedCount = modules.filter((module) => module.progress_persen >= 100).length;
	$: totalQuestions = modules.reduce((total, module) => total + module.total_soal, 0);
	$: pathGroups = groupByPath(modules);
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
					Pilih jalur pembinaan sesuai kebutuhan: aqidah, adab, fikih praktis, sirah,
					skill masa depan, atau Bahasa Arab dan Nahwu. Progress dibuka bertahap di dalam
					masing-masing jalur.
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
			<p class="text-sm font-semibold text-slate-500">Jalur tersedia</p>
			<p class="mt-2 text-2xl font-extrabold text-[#1B4332]">{pathGroups.length}</p>
		</div>
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<p class="text-sm font-semibold text-slate-500">Latihan tersedia</p>
			<p class="mt-2 text-2xl font-extrabold text-[#1B4332]">{totalQuestions} soal</p>
		</div>
	</div>

	<section aria-labelledby="active-curriculum-title">
		<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
			<div>
				<p class="text-xs font-bold uppercase tracking-[0.18em] text-[#C9A84C]">Jalur pembinaan</p>
				<h2 id="active-curriculum-title" class="mt-1 text-2xl font-extrabold text-[#1B4332]">
					Pilih jalur yang ingin dilanjutkan
				</h2>
			</div>
			<p class="text-sm font-semibold text-slate-500">{modules.length} modul pembelajaran</p>
		</div>

		<div class="space-y-6">
			{#each pathGroups as group}
				<section class="space-y-4" aria-labelledby={`path-${group.key}`}>
					<div class="rounded-xl border border-[#1B4332]/10 bg-white p-4 shadow-sm sm:p-5">
						<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
							<div class="min-w-0">
								<h3 id={`path-${group.key}`} class="text-xl font-extrabold text-[#1B4332]">
									{group.title}
								</h3>
								<p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{group.purpose}</p>

								{#if group.kitabSlug}
									<a
										href={`/kitab/${group.kitabSlug}`}
										class="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#C9A84C]/40 bg-[#FAF8F3] px-3 py-1.5 text-xs font-bold text-[#1B4332] transition hover:border-[#C9A84C]"
									>
										<BookOpen class="h-3.5 w-3.5 text-[#C9A84C]" />
										Baca kitab rujukan
										<ArrowRight class="h-3.5 w-3.5" />
									</a>
								{/if}
							</div>
							<div class="shrink-0 rounded-xl bg-[#FAF8F3] px-4 py-3 text-sm font-bold text-[#1B4332]">
								{group.completedModules}/{group.modules.length} modul
							</div>
						</div>

						<div class="mt-4">
							<div class="flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
								<span>{group.solvedQuestions}/{group.totalQuestions} latihan</span>
								<span>{group.progressPercent}%</span>
							</div>
							<div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
								<div
									class="h-full rounded-full bg-[#C9A84C] transition-all duration-500"
									style={`width: ${group.progressPercent}%`}
								></div>
							</div>
						</div>
					</div>

					<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{#each group.modules as module}
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
				</section>
			{/each}
		</div>

		{#if modules.length === 0}
			<div class="rounded-xl border border-[#C9A84C]/30 bg-[#FAF8F3] p-6 text-center">
				<h3 class="text-lg font-extrabold text-[#1B4332]">Modul sedang disiapkan</h3>
				<p class="mt-2 text-sm leading-6 text-slate-600">
					Kurikulum akan muncul di sini setelah proses sinkronisasi selesai.
				</p>
			</div>
		{/if}
	</section>
</section>

<style>
	.learn-page {
		font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
	}
</style>
