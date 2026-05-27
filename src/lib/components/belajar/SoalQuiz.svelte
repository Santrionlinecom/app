<script lang="ts">
	export let soal: {
		id?: string;
		pertanyaan: string;
		pilihan_a: string;
		pilihan_b: string;
		pilihan_c: string;
		pilihan_d: string;
		jawaban_benar: string;
		penjelasan?: string | null;
	};
	export let disabled = false;
	export let onAnswered: (payload: { jawaban: string; benar: boolean }) => void = () => {};
	export let onNext: () => void = () => {};

	const normalize = (value: string) => value.trim().toLowerCase();
	const hasArabic = (value: string) => /[\u0600-\u06ff]/.test(value);

	$: pilihan = [
		{ key: 'a', label: soal.pilihan_a },
		{ key: 'b', label: soal.pilihan_b },
		{ key: 'c', label: soal.pilihan_c },
		{ key: 'd', label: soal.pilihan_d }
	].filter((item) => item.label);

	let selected = '';

	$: if (soal?.id) {
		selected = '';
	}

	const isCorrect = (key: string, label: string) => {
		const answer = normalize(soal.jawaban_benar);
		return answer === key || answer === normalize(label);
	};

	const choose = (key: string, label: string) => {
		if (selected || disabled) return;
		selected = key;
		onAnswered({ jawaban: key, benar: isCorrect(key, label) });
	};

	const optionClass = (key: string, label: string) => {
		if (!selected) return 'border-slate-200 bg-white text-slate-800 hover:border-[#C9A84C]';
		if (isCorrect(key, label)) return 'border-emerald-500 bg-emerald-50 text-emerald-900';
		if (selected === key) return 'border-red-500 bg-red-50 text-red-900';
		return 'border-slate-200 bg-slate-50 text-slate-400';
	};
</script>

<section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition sm:p-6">
	<h2
		class="text-2xl font-extrabold leading-snug text-[#1B4332] md:text-4xl"
		class:font-arabic={hasArabic(soal.pertanyaan)}
		dir={hasArabic(soal.pertanyaan) ? 'rtl' : 'ltr'}
	>
		{soal.pertanyaan}
	</h2>

	<div class="mt-7 grid gap-3 sm:grid-cols-2">
		{#each pilihan as item}
			<button
				type="button"
				class={`min-h-16 rounded-xl border px-4 py-4 text-left text-base font-bold transition ${optionClass(item.key, item.label)}`}
				class:text-right={hasArabic(item.label)}
				class:font-arabic={hasArabic(item.label)}
				dir={hasArabic(item.label) ? 'rtl' : 'ltr'}
				disabled={Boolean(selected) || disabled}
				on:click={() => choose(item.key, item.label)}
			>
				<span class="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs uppercase text-slate-500">
					{item.key}
				</span>
				{item.label}
			</button>
		{/each}
	</div>

	{#if selected}
		<div class="mt-5 rounded-xl border border-[#C9A84C]/30 bg-[#FAF8F3] px-4 py-3 text-sm leading-6 text-[#1B4332]">
			<p class="font-bold">Penjelasan</p>
			<p class="mt-1">{soal.penjelasan}</p>
		</div>
		<button
			type="button"
			class="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#1B4332] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#143527] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
			disabled={disabled}
			on:click={onNext}
		>
			Lanjut
		</button>
	{/if}
</section>

<style>
	.font-arabic {
		font-family: 'Scheherazade New', serif;
		letter-spacing: 0;
	}
</style>
