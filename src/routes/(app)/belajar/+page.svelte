<script lang="ts">
	import { ArrowRight, BookOpen, Flame, LockKeyhole, Medal, PlayCircle, Trophy } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	type LearnModule = PageData['modules'][number];

	const categoryMeta = {
		hijaiyah: { icon: 'ا', label: 'Hijaiyah', tone: 'bg-emerald-50 text-emerald-800' },
		mufrodat: { icon: 'ك', label: 'Mufrodat', tone: 'bg-sky-50 text-sky-800' },
		nahwu: { icon: 'ن', label: 'Nahwu', tone: 'bg-amber-50 text-amber-800' },
		shorof: { icon: 'ص', label: 'Shorof', tone: 'bg-rose-50 text-rose-800' },
		kitab: { icon: 'ق', label: 'Kitab', tone: 'bg-violet-50 text-violet-800' }
	};

	const percent = (module: LearnModule) =>
		module.totalSoal ? Math.round((module.soalSelesai / module.totalSoal) * 100) : 0;

	const actionLabel = (module: LearnModule) => {
		if (module.locked) return 'Terkunci';
		if (module.status === 'selesai') return 'Ulangi';
		if (module.soalSelesai > 0) return 'Lanjutkan';
		return 'Mulai Belajar';
	};

	$: modules = data.modules ?? [];
	$: completedCount = modules.filter((module) => module.status === 'selesai').length;
</script>

<svelte:head>
	<title>SantriLearn - SantriOnline</title>
	<meta
		name="description"
		content="Gamifikasi belajar Bahasa Arab, Nahwu, dan Shorof untuk santri."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Scheherazade+New:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<section class="learn-page mx-auto max-w-7xl space-y-6 pb-24 md:pb-8">
	<header
		class="overflow-hidden rounded-3xl border border-[#1B4332]/10 bg-[#FAF8F3] px-4 py-5 shadow-sm sm:px-6 lg:px-8"
	>
		<div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
			<div class="min-w-0">
				<p class="text-xs font-bold uppercase tracking-[0.22em] text-[#C9A84C]">Belajar Santri</p>
				<h1 class="mt-2 text-3xl font-extrabold tracking-tight text-[#1B4332] md:text-5xl">
					SantriLearn 🕌
				</h1>
				<p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
					Latihan bertahap untuk Hijaiyah, Mufrodat, Nahwu, dan Shorof dengan XP, streak,
					badge, dan leaderboard lembaga.
				</p>
			</div>

			<div class="grid gap-3 sm:grid-cols-3 lg:min-w-[30rem]">
				<div class="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
					<div class="flex items-center gap-2 text-sm font-semibold text-slate-500">
						<Trophy class="h-4 w-4 text-[#C9A84C]" />
						Total XP
					</div>
					<p class="mt-2 text-3xl font-extrabold text-[#1B4332]">{data.summary.totalXp}</p>
				</div>
				<div class="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
					<div class="flex items-center gap-2 text-sm font-semibold text-slate-500">
						<Flame class="h-4 w-4 text-orange-500" />
						Streak
					</div>
					<p class="mt-2 text-3xl font-extrabold text-[#1B4332]">🔥 {data.summary.streakHari} hari</p>
				</div>
				<a
					href="/belajar/leaderboard"
					class="group flex min-h-[6.25rem] items-center justify-between gap-3 rounded-2xl border border-[#C9A84C]/40 bg-white/85 p-4 text-[#1B4332] shadow-sm transition hover:border-[#C9A84C] hover:bg-[#fffaf0]"
				>
					<div>
						<div class="flex items-center gap-2 text-sm font-semibold text-slate-500">
							<Medal class="h-4 w-4 text-[#C9A84C]" />
							Leaderboard
						</div>
						<p class="mt-2 text-sm font-bold">Lihat ranking</p>
					</div>
					<ArrowRight class="h-5 w-5 transition group-hover:translate-x-1" />
				</a>
			</div>
		</div>
	</header>

	<div class="grid gap-4 sm:grid-cols-3">
		<div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<p class="text-sm font-semibold text-slate-500">Modul selesai</p>
			<p class="mt-2 text-2xl font-extrabold text-[#1B4332]">{completedCount}/{modules.length}</p>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<p class="text-sm font-semibold text-slate-500">Badge diraih</p>
			<p class="mt-2 text-2xl font-extrabold text-[#1B4332]">{data.badges.length}</p>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<p class="text-sm font-semibold text-slate-500">XP per jawaban benar</p>
			<p class="mt-2 text-2xl font-extrabold text-[#1B4332]">+10</p>
		</div>
	</div>

	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
		{#each modules as module, index}
			{@const meta = categoryMeta[module.kategori] ?? categoryMeta.kitab}
			{@const progress = percent(module)}
			<article
				class="flex min-h-[21rem] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
				class:opacity-75={module.locked}
			>
				<div class="flex items-start justify-between gap-3">
					<div class={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${meta.tone}`}>
						<span class="arabic text-3xl font-bold" dir="rtl">{meta.icon}</span>
					</div>
					{#if module.status === 'selesai'}
						<span
							class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
						>
							Selesai ✓
						</span>
					{:else if module.locked}
						<span
							class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500"
						>
							<LockKeyhole class="h-3.5 w-3.5" />
							Terkunci
						</span>
					{/if}
				</div>

				<p class="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
					Modul {index + 1} · {meta.label}
				</p>
				<h2 class="mt-2 text-xl font-extrabold tracking-tight text-[#1B4332]">{module.judul}</h2>
				<p class="mt-3 min-h-[3.25rem] text-sm leading-6 text-slate-600">
					{module.deskripsi}
				</p>

				<div class="mt-5 space-y-2">
					<div class="flex items-center justify-between text-xs font-semibold text-slate-500">
						<span>{module.soalSelesai}/{module.totalSoal} soal</span>
						<span>{progress}%</span>
					</div>
					<div class="h-3 overflow-hidden rounded-full bg-slate-100">
						<div
							class="h-full rounded-full bg-[#C9A84C] transition-all duration-500"
							style={`width: ${progress}%`}
						></div>
					</div>
				</div>

				<div class="mt-auto pt-5">
					{#if module.locked}
						<button
							type="button"
							class="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500"
							disabled
						>
							<LockKeyhole class="h-4 w-4" />
							{actionLabel(module)}
						</button>
					{:else}
						<a
							href={`/belajar/${module.id}`}
							class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1B4332] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#143527]"
						>
							{#if module.soalSelesai > 0}
								<BookOpen class="h-4 w-4" />
							{:else}
								<PlayCircle class="h-4 w-4" />
							{/if}
							{actionLabel(module)}
						</a>
					{/if}
				</div>
			</article>
		{/each}
	</div>

	{#if data.badges.length > 0}
		<section class="rounded-3xl border border-[#C9A84C]/30 bg-white p-5 shadow-sm">
			<h2 class="text-lg font-extrabold text-[#1B4332]">Badge Santri</h2>
			<div class="mt-4 flex flex-wrap gap-2">
				{#each data.badges as badge}
					<span
						class="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/40 bg-[#FAF8F3] px-3 py-2 text-sm font-bold text-[#1B4332]"
					>
						<Medal class="h-4 w-4 text-[#C9A84C]" />
						{badge.label}
					</span>
				{/each}
			</div>
		</section>
	{/if}
</section>

<style>
	.learn-page {
		font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
	}

	.arabic {
		font-family: 'Scheherazade New', serif;
	}
</style>
