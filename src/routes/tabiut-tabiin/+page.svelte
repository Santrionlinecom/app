<script lang="ts">
	import { tabiutTabiinFigures } from '$lib/data/tabiut-tabiin';

	const centers = Array.from(new Set(tabiutTabiinFigures.map((figure) => figure.center)));
</script>

<svelte:head>
	<title>Tabi'ut Tabi'in - Santri Online</title>
</svelte:head>

<div class="space-y-8">
	<section class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-teal-950 to-cyan-950 px-6 py-10 text-white shadow-xl md:px-8">
		<div class="absolute -left-16 top-8 h-44 w-44 rounded-full bg-emerald-300/10 blur-3xl"></div>
		<div class="absolute -right-20 bottom-0 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl"></div>
		<div class="relative max-w-4xl">
			<p class="text-xs uppercase tracking-[0.35em] text-emerald-200/70">Generasi Tabi'ut Tabi'in</p>
			<h1 class="mt-3 text-3xl font-bold md:text-5xl">Fase kodifikasi awal dan pematangan disiplin ilmu</h1>
			<p class="mt-4 text-sm leading-7 text-white/75 md:text-base">
				Tabi'ut tabi'in adalah murid generasi tabi'in. Pada fase ini, tradisi lisan tetap kuat, tetapi
				penyusunan kitab, pemetaan mazhab, kritik hadis, dan madrasah kota mulai tampak lebih matang.
			</p>
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-emerald-200 bg-white p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Pemetaan sejarah</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-3">
			<div class="rounded-3xl bg-emerald-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Posisi</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">Generasi setelah tabi'in dan sebelum fase imam-imam besar abad ketiga.</p>
			</div>
			<div class="rounded-3xl bg-teal-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">Ciri</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">Mulai kuatnya kodifikasi hadis, kitab fiqih awal, dan kritik sanad yang lebih sistematis.</p>
			</div>
			<div class="rounded-3xl bg-cyan-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">Dampak</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">Menjadi jembatan langsung menuju mazhab-mazhab Sunni dan karya klasik utama.</p>
			</div>
		</div>
	</section>

	{#each centers as center}
		<section class="space-y-4">
			<div class="flex items-end justify-between gap-4">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Pusat Ilmu</p>
					<h2 class="mt-2 text-2xl font-semibold text-slate-900">{center}</h2>
				</div>
				<p class="text-sm text-slate-500">
					{tabiutTabiinFigures.filter((figure) => figure.center === center).length} tokoh utama
				</p>
			</div>

			<div class="grid gap-6 lg:grid-cols-2">
				{#each tabiutTabiinFigures.filter((figure) => figure.center === center) as figure}
					<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
						<div class="flex flex-wrap items-center gap-2">
							<span class="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
								{figure.era}
							</span>
							<span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
								{figure.focus}
							</span>
						</div>
						<h3 class="mt-4 text-2xl font-semibold text-slate-900">{figure.name}</h3>
						<p class="mt-2 text-sm font-medium text-emerald-700">{figure.role}</p>
						<p class="mt-4 text-sm leading-7 text-slate-600">{figure.summary}</p>

						<div class="mt-5 grid gap-4 md:grid-cols-2">
							<div class="rounded-2xl bg-slate-50 p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Guru Tabi'in</p>
								<p class="mt-3 text-sm leading-7 text-slate-700">{figure.teachers.join(', ')}</p>
							</div>
							<div class="rounded-2xl bg-slate-50 p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Murid Lanjutan</p>
								<p class="mt-3 text-sm leading-7 text-slate-700">{figure.students.join(', ')}</p>
							</div>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/each}

	<section class="rounded-[1.75rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Jembatan ke era mazhab dan kitab</h2>
		<p class="mt-4 text-sm leading-7 text-slate-700">
			Kalau generasi tabi'in menjaga transfer ilmu dari sahabat, maka generasi tabi'ut tabi'in mulai
			mematangkan metodologi. Dari sinilah muncul jalan menuju Muwatta, kitab-kitab hadis, disiplin
			jarh wa ta'dil, serta pembentukan tradisi hukum yang kemudian dikenal sebagai mazhab Sunni.
		</p>
	</section>
</div>
