<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowLeft, CheckCircle2, Loader2, Trophy } from 'lucide-svelte';
	import SoalQuiz from '$lib/components/belajar/SoalQuiz.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	type QuizQuestion = {
		id: string;
		modul_id: string;
		tipe: string;
		pertanyaan: string;
		pilihan_a: string;
		pilihan_b: string;
		pilihan_c: string;
		pilihan_d: string;
		jawaban_benar: string;
		penjelasan: string | null;
		urutan: number;
	};

	let questions: QuizQuestion[] = [];
	let currentIndex = 0;
	let sessionXp = 0;
	let totalXp = data.summary.totalXp;
	let isLoading = true;
	let isSubmitting = false;
	let errorMessage = '';

	$: totalQuestions = questions.length;
	$: currentQuestion = questions[currentIndex] ?? null;
	$: isComplete = totalQuestions > 0 && currentIndex >= totalQuestions;
	$: progressPercent = totalQuestions
		? Math.round((Math.min(currentIndex, totalQuestions) / totalQuestions) * 100)
		: 0;

	onMount(async () => {
		try {
			const response = await fetch(`/api/belajar/modul/${data.module.id}/soal`);
			const payload = await response.json();
			if (!response.ok || !payload.ok) {
				throw new Error(payload.error ?? 'Gagal memuat soal.');
			}
			questions = payload.soal ?? [];
			currentIndex = 0;
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Gagal memuat soal.';
		} finally {
			isLoading = false;
		}
	});

	const submitProgress = async (payload: { jawaban: string; benar: boolean }) => {
		if (!currentQuestion) return;
		isSubmitting = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/belajar/progress', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					modul_id: data.module.id,
					soal_id: currentQuestion.id,
					jawaban: payload.jawaban,
					benar: payload.benar
				})
			});
			const result = await response.json();
			if (!response.ok || !result.ok) {
				throw new Error(result.error ?? 'Gagal menyimpan progress.');
			}
			sessionXp += Number(result.xp_didapat ?? 0);
			totalXp = Number(result.xp_total ?? totalXp);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan progress.';
		} finally {
			isSubmitting = false;
		}
	};

	const goNext = () => {
		currentIndex += 1;
	};
</script>

<svelte:head>
	<title>{data.module.judul} - SantriLearn</title>
	<meta name="description" content={`Latihan interaktif modul ${data.module.judul}.`} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Scheherazade+New:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<section class="learn-page mx-auto max-w-4xl space-y-5 pb-24 md:pb-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<a
			href="/belajar"
			class="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600 transition hover:text-[#1B4332]"
		>
			<ArrowLeft class="h-4 w-4" />
			Daftar Modul
		</a>
		<div class="inline-flex w-fit items-center gap-2 rounded-xl bg-[#FAF8F3] px-4 py-2 text-sm font-extrabold text-[#1B4332]">
			<Trophy class="h-4 w-4 text-[#C9A84C]" />
			{totalXp} XP
		</div>
	</div>

	<header class="rounded-xl border border-[#1B4332]/10 bg-[#FAF8F3] p-5 shadow-sm sm:p-6">
		<p class="text-xs font-bold uppercase tracking-[0.22em] text-[#C9A84C]">SantriLearn</p>
		<h1 class="mt-2 text-2xl font-extrabold tracking-tight text-[#1B4332] md:text-4xl">
			{data.module.judul}
		</h1>
		<p class="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{data.module.deskripsi}</p>

		<div class="mt-5 space-y-2">
			<div class="flex items-center justify-between text-sm font-bold text-slate-500">
				<span>Soal {Math.min(currentIndex + 1, totalQuestions)} dari {totalQuestions}</span>
				<span>{progressPercent}%</span>
			</div>
			<div class="h-3 overflow-hidden rounded-full bg-white">
				<div
					class="h-full rounded-full bg-[#C9A84C] transition-all duration-500"
					style={`width: ${progressPercent}%`}
				></div>
			</div>
		</div>
	</header>

	{#if errorMessage}
		<p class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
			{errorMessage}
		</p>
	{/if}

	{#if isLoading}
		<div class="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
			<div class="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
				<Loader2 class="h-5 w-5 animate-spin" />
				Memuat soal...
			</div>
		</div>
	{:else if isComplete || totalQuestions === 0}
		<section class="rounded-xl border border-emerald-200 bg-white p-6 text-center shadow-sm">
			<div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-700">
				<CheckCircle2 class="h-8 w-8" />
			</div>
			<h2 class="mt-4 text-2xl font-extrabold text-[#1B4332]">Latihan selesai</h2>
			<p class="mt-2 text-sm leading-6 text-slate-600">
				XP didapat sesi ini: <strong class="text-[#1B4332]">+{sessionXp}</strong>
			</p>
			<a
				href="/belajar"
				class="mt-6 inline-flex items-center justify-center rounded-xl bg-[#1B4332] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#143527]"
			>
				Kembali ke Daftar Modul
			</a>
		</section>
	{:else if currentQuestion}
		<SoalQuiz
			soal={currentQuestion}
			disabled={isSubmitting}
			onAnswered={submitProgress}
			onNext={goNext}
		/>
	{/if}
</section>

<style>
	.learn-page {
		font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
	}
</style>
