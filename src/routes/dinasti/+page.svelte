<script lang="ts">
	import { islamicDynasties } from '$lib/data/dinasti';

	const orderedDynasties = [...islamicDynasties].sort((a, b) => a.startYearCE - b.startYearCE);
</script>

<svelte:head>
	<title>Dinasti Islam - Santri Online</title>
</svelte:head>

<div class="space-y-8">
	<section class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 via-slate-950 to-sky-950 px-6 py-10 text-white shadow-xl md:px-8">
		<div class="absolute -left-20 top-10 h-48 w-48 rounded-full bg-indigo-300/10 blur-3xl"></div>
		<div class="absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-sky-300/10 blur-3xl"></div>
		<div class="relative max-w-4xl">
			<p class="text-xs uppercase tracking-[0.35em] text-sky-200/70">Dinasti Islam</p>
			<h1 class="mt-3 text-3xl font-bold md:text-5xl">Peta dinasti pasca-Khulafaur Rasyidin</h1>
			<p class="mt-4 text-sm leading-7 text-white/75 md:text-base">
				Setelah era Khulafaur Rasyidin berakhir pada 661 M, sejarah politik Islam berkembang ke banyak
				dinasti dan kekhalifahan. Sebagiannya saling menyambung, sebagiannya hidup paralel di wilayah
				berbeda. Urutan di halaman ini disusun menurut tahun awal berdiri agar pola sejarahnya mudah dibaca.
			</p>
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-indigo-200 bg-white p-6 shadow-sm">
		<div class="grid gap-4 md:grid-cols-[0.8fr,1.2fr]">
			<div class="rounded-3xl bg-indigo-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-700">Titik Awal</p>
				<h2 class="mt-3 text-2xl font-semibold text-slate-900">Khulafaur Rasyidin</h2>
				<p class="mt-3 text-sm leading-7 text-slate-700">
					632-661 M / 11-41 H. Menjadi patokan awal sebelum masuk ke fase dinasti dan kekuasaan regional.
				</p>
			</div>
			<div class="rounded-3xl bg-slate-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Catatan Struktur Sejarah</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">
					Sejak era Umayyah, sejarah Islam tidak selalu berjalan sebagai satu garis politik tunggal.
					Ada fase ketika Abbasiyah, Umayyah Andalus, dan Fatimiyah berdiri pada masa yang saling
					bertumpang tindih. Karena itu, halaman ini memetakan kronologi berdirinya dinasti-dinasti
					yang paling berpengaruh, bukan memaksa semuanya sebagai rantai tunggal tanpa cabang.
				</p>
			</div>
		</div>
	</section>

	<section class="space-y-5">
		<div>
			<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Urutan Kronologis</p>
			<h2 class="mt-2 text-2xl font-semibold text-slate-900">Dinasti dan kekhalifahan utama</h2>
		</div>

		<div class="space-y-5">
			{#each orderedDynasties as dynasty}
				<article
					id={dynasty.slug}
					class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
				>
					<div class="grid gap-5 lg:grid-cols-[0.22fr,0.78fr]">
						<div class="rounded-3xl bg-slate-50 p-5 text-center">
							<p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Urutan</p>
							<p class="mt-3 text-4xl font-bold text-slate-900">{dynasty.order}</p>
						</div>

						<div>
							<div class="flex flex-wrap items-center gap-2">
								<span class="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-700">
									{dynasty.type}
								</span>
								<span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
									{dynasty.periodCE}
								</span>
								<span class="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
									{dynasty.periodAH}
								</span>
							</div>

							<h3 class="mt-4 text-2xl font-semibold text-slate-900">{dynasty.name}</h3>
							<p class="mt-3 text-sm leading-7 text-slate-600">{dynasty.summary}</p>

							<div class="mt-5 grid gap-4 md:grid-cols-3">
								<div class="rounded-2xl bg-slate-50 p-4">
									<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Ibu Kota</p>
									<p class="mt-3 text-sm leading-7 text-slate-700">{dynasty.capital}</p>
								</div>
								<div class="rounded-2xl bg-slate-50 p-4">
									<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Wilayah Inti</p>
									<p class="mt-3 text-sm leading-7 text-slate-700">{dynasty.regions}</p>
								</div>
								<div class="rounded-2xl bg-slate-50 p-4">
									<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Warisan</p>
									<p class="mt-3 text-sm leading-7 text-slate-700">{dynasty.legacy}</p>
								</div>
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	</section>
</div>
