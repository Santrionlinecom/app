<script lang="ts">
	import { deserialize } from '$app/forms';
	import { onDestroy } from 'svelte';
	import {
		ArrowLeft,
		ArrowRight,
		CheckCircle2,
		Loader2,
		RotateCcw,
		Trophy,
		XCircle
	} from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	type Question = PageData['questions'][number];
	type AnswerPayload = {
		message?: string;
		is_benar?: boolean;
		xp_total?: number;
		xp_didapat?: number;
		soal_selesai?: number;
		total_soal?: number;
		status?: string;
		modul_selesai?: boolean;
		badge_baru?: string | null;
	};

	const hasArabic = (text: string) => /[\u0600-\u06ff]/.test(text);
	const randomUnit = () => {
		if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
			const bytes = new Uint8Array(1);
			crypto.getRandomValues(bytes);
			return (bytes[0] ?? 0) / 255;
		}
		return Math.random();
	};
	const shuffle = (items: string[]) => [...items].sort(() => randomUnit() - 0.5);

	let currentIndex =
		data.module.status === 'selesai'
			? 0
			: Math.min(data.module.soalSelesai, Math.max(data.questions.length - 1, 0));
	let currentQuestion: Question | null = null;
	let optionSet: string[] = [];
	let selectedAnswer = '';
	let typedAnswer = '';
	let selectedLeft = false;
	let selectedTokens: string[] = [];
	let selectedTokenIndexes: number[] = [];
	let answerState: 'idle' | 'submitting' | 'correct' | 'wrong' = 'idle';
	let errorMessage = '';
	let sessionXp = 0;
	let totalXp = data.summary.totalXp;
	let badgeBaru: string | null = null;
	let modulSelesai = data.module.status === 'selesai';
	let advanceTimer: ReturnType<typeof setTimeout> | null = null;

	$: totalQuestions = data.questions.length;
	$: isComplete = currentIndex >= totalQuestions || totalQuestions === 0;
	$: progressPercent = totalQuestions
		? Math.round((Math.min(currentIndex, totalQuestions) / totalQuestions) * 100)
		: 0;

	$: {
		const nextQuestion = data.questions[currentIndex] ?? null;
		if (currentQuestion?.id !== nextQuestion?.id) {
			currentQuestion = nextQuestion;
			optionSet = nextQuestion ? shuffle(nextQuestion.options ?? []) : [];
			selectedAnswer = '';
			typedAnswer = '';
			selectedLeft = false;
			selectedTokens = [];
			selectedTokenIndexes = [];
			answerState = 'idle';
			errorMessage = '';
		}
	}

	const goNext = () => {
		if (advanceTimer) clearTimeout(advanceTimer);
		advanceTimer = setTimeout(() => {
			currentIndex += 1;
		}, 1000);
	};

	onDestroy(() => {
		if (advanceTimer) clearTimeout(advanceTimer);
	});

	const submitAnswer = async (question: Question, jawaban: string) => {
		if (answerState !== 'idle') return;
		const trimmed = jawaban.trim();
		if (!trimmed) {
			errorMessage = 'Jawaban wajib diisi.';
			return;
		}

		answerState = 'submitting';
		errorMessage = '';
		selectedAnswer = trimmed;

		try {
			const formData = new FormData();
			formData.set('soal_id', question.id);
			formData.set('jawaban', trimmed);

			const response = await fetch('?/jawab', {
				method: 'POST',
				body: formData
			});
			const result = deserialize(await response.text());

			if (result.type === 'failure') {
				const payload = result.data as AnswerPayload | undefined;
				throw new Error(payload?.message ?? 'Jawaban gagal disimpan.');
			}
			if (result.type === 'error') {
				throw new Error(result.error?.message ?? 'Jawaban gagal disimpan.');
			}
			if (result.type === 'redirect') {
				window.location.href = result.location;
				return;
			}

			const payload = result.data as AnswerPayload | undefined;
			if (result.type !== 'success' || !payload) {
				throw new Error('Jawaban gagal diproses.');
			}

			answerState = payload.is_benar ? 'correct' : 'wrong';
			sessionXp += Number(payload.xp_didapat ?? 0);
			totalXp = Number(payload.xp_total ?? totalXp);
			modulSelesai = Boolean(payload.modul_selesai);
			if (payload.badge_baru) badgeBaru = payload.badge_baru;
			goNext();
		} catch (err) {
			answerState = 'idle';
			errorMessage = err instanceof Error ? err.message : 'Jawaban gagal disimpan.';
		}
	};

	const submitCurrentAnswer = (jawaban: string) => {
		if (currentQuestion) void submitAnswer(currentQuestion, jawaban);
	};

	const selectMatchSource = () => {
		if (answerState === 'idle') selectedLeft = true;
	};

	const submitMatchAnswer = (jawaban: string) => {
		if (!selectedLeft) return;
		submitCurrentAnswer(jawaban);
	};

	const resetSusunKata = () => {
		selectedTokens = [];
		selectedTokenIndexes = [];
		selectedAnswer = '';
	};

	const addToken = (token: string, tokenIndex: number) => {
		if (answerState !== 'idle') return;
		if (selectedTokenIndexes.includes(tokenIndex)) return;
		selectedTokenIndexes = [...selectedTokenIndexes, tokenIndex];
		selectedTokens = [...selectedTokens, token];
		selectedAnswer = selectedTokens.join(' ');
	};

	const submitTyped = () => {
		submitCurrentAnswer(typedAnswer);
	};

	const optionClasses = (option: string) => {
		const isSelected = selectedAnswer === option;
		if (isSelected && answerState === 'correct') {
			return 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-100';
		}
		if (isSelected && answerState === 'wrong') {
			return 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-100';
		}
		return 'border-slate-200 bg-white text-slate-800 hover:border-[#C9A84C] hover:bg-[#fffaf0]';
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

<section class="learn-page mx-auto max-w-5xl space-y-5 pb-24 md:pb-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<a
			href="/belajar"
			class="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:text-[#1B4332]"
		>
			<ArrowLeft class="h-4 w-4" />
			Dashboard
		</a>
		<div class="inline-flex w-fit items-center gap-2 rounded-full bg-[#FAF8F3] px-4 py-2 text-sm font-bold text-[#1B4332]">
			<Trophy class="h-4 w-4 text-[#C9A84C]" />
			{totalXp} XP
		</div>
	</div>

	<header class="rounded-3xl border border-[#1B4332]/10 bg-[#FAF8F3] p-4 shadow-sm sm:p-6">
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

	{#if isComplete}
		<section class="rounded-3xl border border-emerald-200 bg-white p-6 text-center shadow-sm">
			<div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-700">
				<CheckCircle2 class="h-8 w-8" />
			</div>
			<h2 class="mt-4 text-2xl font-extrabold text-[#1B4332]">Latihan selesai</h2>
			<p class="mt-2 text-sm leading-6 text-slate-600">
				XP didapat sesi ini: <strong class="text-[#1B4332]">+{sessionXp}</strong>
			</p>
			{#if badgeBaru}
				<p class="mt-3 rounded-full border border-[#C9A84C]/40 bg-[#FAF8F3] px-4 py-2 text-sm font-bold text-[#1B4332]">
					Badge baru: {badgeBaru}
				</p>
			{:else if modulSelesai}
				<p class="mt-3 text-sm font-semibold text-emerald-700">Modul ini sudah selesai.</p>
			{/if}

			<div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
				{#if data.nextModule}
					<a
						href={`/belajar/${data.nextModule.id}`}
						class="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4332] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#143527]"
					>
						Lanjut ke {data.nextModule.judul}
						<ArrowRight class="h-4 w-4" />
					</a>
				{/if}
				<a
					href="/belajar"
					class="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
				>
					Kembali ke Dashboard
				</a>
			</div>
		</section>
	{:else if currentQuestion}
		<section class="question-slide rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
			<div class="flex min-h-[24rem] flex-col">
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
							{currentQuestion.tipe.replace('_', ' ')}
						</p>
						<h2
							class:arabic={hasArabic(currentQuestion.pertanyaan)}
							dir={hasArabic(currentQuestion.pertanyaan) ? 'rtl' : 'ltr'}
							class="mt-3 text-3xl font-extrabold leading-tight text-[#1B4332] md:text-5xl"
						>
							{currentQuestion.pertanyaan}
						</h2>
					</div>
					{#if answerState === 'correct'}
						<CheckCircle2 class="h-8 w-8 shrink-0 text-emerald-600" />
					{:else if answerState === 'wrong'}
						<XCircle class="h-8 w-8 shrink-0 text-red-600" />
					{/if}
				</div>

				<div class="mt-8 flex-1">
					{#if currentQuestion.tipe === 'pilihan_ganda' || currentQuestion.tipe === 'dengar_pilih'}
						<div class="grid gap-3 sm:grid-cols-2">
							{#each optionSet as option}
								<button
									type="button"
									class={`min-h-20 rounded-2xl border px-4 py-4 text-center text-lg font-extrabold transition ${optionClasses(option)}`}
									class:arabic={hasArabic(option)}
									dir={hasArabic(option) ? 'rtl' : 'ltr'}
									disabled={answerState !== 'idle'}
									on:click={() => submitCurrentAnswer(option)}
								>
									{#if answerState === 'submitting' && selectedAnswer === option}
										<Loader2 class="mx-auto h-5 w-5 animate-spin" />
									{:else}
										{option}
									{/if}
								</button>
							{/each}
						</div>
					{:else if currentQuestion.tipe === 'cocokkan'}
						<div class="grid gap-4 md:grid-cols-2">
							<button
								type="button"
								class={`min-h-28 rounded-2xl border bg-[#FAF8F3] px-5 py-4 text-center text-4xl font-bold text-[#1B4332] transition ${
									selectedLeft
										? 'border-[#C9A84C] ring-4 ring-[#C9A84C]/15'
										: 'border-[#C9A84C]/50 hover:border-[#C9A84C]'
								}`}
								class:arabic={hasArabic(currentQuestion.pertanyaan)}
								dir={hasArabic(currentQuestion.pertanyaan) ? 'rtl' : 'ltr'}
								disabled={answerState !== 'idle'}
								on:click={selectMatchSource}
							>
								{currentQuestion.pertanyaan}
							</button>
							<div class="grid gap-3">
								{#each optionSet as option}
									<button
										type="button"
										class={`rounded-2xl border px-4 py-4 text-left text-base font-bold transition ${optionClasses(option)}`}
										disabled={answerState !== 'idle' || !selectedLeft}
										on:click={() => submitMatchAnswer(option)}
									>
										{#if answerState === 'submitting' && selectedAnswer === option}
											<Loader2 class="h-5 w-5 animate-spin" />
										{:else}
											{option}
										{/if}
									</button>
								{/each}
							</div>
						</div>
					{:else if currentQuestion.tipe === 'isi_titik'}
						<form class="space-y-4" on:submit|preventDefault={submitTyped}>
							<input
								bind:value={typedAnswer}
								class="arabic w-full rounded-2xl border border-slate-200 bg-[#FAF8F3] px-5 py-4 text-right text-3xl font-bold text-[#1B4332] outline-none transition focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/15"
								dir="rtl"
								placeholder="اكتب الجواب"
								disabled={answerState !== 'idle'}
							/>
							<button
								type="submit"
								class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1B4332] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#143527] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
								disabled={answerState !== 'idle'}
							>
								{#if answerState === 'submitting'}
									<Loader2 class="h-4 w-4 animate-spin" />
								{/if}
								Cek Jawaban
							</button>
						</form>
					{:else if currentQuestion.tipe === 'susun_kata'}
						<div class="space-y-4">
							<div class="min-h-20 rounded-2xl border border-dashed border-[#C9A84C]/60 bg-[#FAF8F3] p-4">
								<p class="arabic text-right text-2xl font-bold text-[#1B4332]" dir="rtl">
									{selectedTokens.join(' ')}
								</p>
							</div>
							<div class="flex flex-wrap gap-2">
								{#each optionSet as option, tokenIndex}
									{#if !selectedTokenIndexes.includes(tokenIndex)}
										<button
											type="button"
											class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-[#C9A84C]"
											disabled={answerState !== 'idle'}
											on:click={() => addToken(option, tokenIndex)}
										>
											{option}
										</button>
									{/if}
								{/each}
							</div>
							<div class="flex flex-col gap-2 sm:flex-row">
								<button
									type="button"
									class="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4332] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#143527]"
									disabled={answerState !== 'idle'}
									on:click={() => submitCurrentAnswer(selectedTokens.join(' '))}
								>
									Cek Susunan
								</button>
								<button
									type="button"
									class="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
									disabled={answerState !== 'idle'}
									on:click={resetSusunKata}
								>
									<RotateCcw class="h-4 w-4" />
									Reset
								</button>
							</div>
						</div>
					{/if}
				</div>

				{#if errorMessage}
					<p class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
						{errorMessage}
					</p>
				{/if}
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
		letter-spacing: 0;
	}

	.question-slide {
		animation: slide-in 240ms ease both;
	}

	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(18px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
