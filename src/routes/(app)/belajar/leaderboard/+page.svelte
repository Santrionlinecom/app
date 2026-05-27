<script lang="ts">
	import { ArrowLeft, Flame, Medal, Trophy } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Leaderboard SantriLearn - SantriOnline</title>
	<meta name="description" content="Ranking XP SantriLearn antar santri dalam lembaga." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<section class="learn-page mx-auto max-w-5xl space-y-6 pb-24 md:pb-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<a
			href="/belajar"
			class="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:text-[#1B4332]"
		>
			<ArrowLeft class="h-4 w-4" />
			SantriLearn
		</a>
		<div class="inline-flex w-fit items-center gap-2 rounded-full bg-[#FAF8F3] px-4 py-2 text-sm font-bold text-[#1B4332]">
			<Flame class="h-4 w-4 text-orange-500" />
			Streak saya {data.summary.streakHari} hari
		</div>
	</div>

	<header class="rounded-3xl border border-[#1B4332]/10 bg-[#FAF8F3] p-5 shadow-sm sm:p-7">
		<p class="text-xs font-bold uppercase tracking-[0.22em] text-[#C9A84C]">Leaderboard</p>
		<h1 class="mt-2 text-3xl font-extrabold tracking-tight text-[#1B4332] md:text-5xl">
			Ranking XP Santri
		</h1>
		<p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
			Top 10 santri berdasarkan total XP SantriLearn di lembaga aktif.
		</p>
	</header>

	<div class="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
		{#if data.leaderboard.length === 0}
			<div class="grid min-h-52 place-items-center text-center">
				<div>
					<Trophy class="mx-auto h-10 w-10 text-[#C9A84C]" />
					<p class="mt-3 text-lg font-extrabold text-[#1B4332]">Belum ada ranking</p>
					<p class="mt-1 text-sm text-slate-500">XP akan muncul setelah santri mulai belajar.</p>
				</div>
			</div>
		{:else}
			<div class="space-y-2">
				{#each data.leaderboard as row}
					<div
						class={`grid gap-3 rounded-2xl border px-4 py-4 transition sm:grid-cols-[4rem_minmax(0,1fr)_8rem_8rem_7rem] sm:items-center ${
							row.isCurrentUser
								? 'border-[#C9A84C] bg-[#FAF8F3]'
								: 'border-slate-100 bg-white hover:bg-slate-50'
						}`}
					>
						<div class="flex items-center gap-3">
							<div class="grid h-10 w-10 place-items-center rounded-full bg-[#1B4332] text-sm font-extrabold text-white">
								#{row.rank}
							</div>
							{#if row.rank <= 3}
								<Medal class="h-5 w-5 text-[#C9A84C] sm:hidden" />
							{/if}
						</div>

						<div class="min-w-0">
							<p class="truncate text-base font-extrabold text-[#1B4332]">{row.nama}</p>
							{#if row.isCurrentUser}
								<p class="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#C9A84C]">
									Akun saya
								</p>
							{/if}
						</div>

						<div class="flex items-center justify-between gap-3 sm:block">
							<span class="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 sm:hidden">
								XP
							</span>
							<p class="text-sm font-extrabold text-slate-900">{row.totalXp}</p>
						</div>

						<div class="flex items-center justify-between gap-3 sm:block">
							<span class="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 sm:hidden">
								Streak
							</span>
							<p class="text-sm font-extrabold text-slate-900">🔥 {row.streakHari}</p>
						</div>

						<div class="flex items-center justify-between gap-3 sm:block">
							<span class="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 sm:hidden">
								Badge
							</span>
							<p class="text-sm font-extrabold text-slate-900">{row.badgeCount}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	.learn-page {
		font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
	}
</style>
