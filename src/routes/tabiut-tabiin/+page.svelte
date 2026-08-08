<script lang="ts">
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import {
		tabiutAdabNotes,
		tabiutBridgeNotes,
		tabiutCenterProfiles,
		tabiutCenters,
		tabiutCodificationCards,
		tabiutTabiinFigures,
		tabiutTimeline
	} from '$lib/data/tabiut-tabiin';
</script>

<SeoHead
	title="Tabi'ut Tabi'in — Kodifikasi Ilmu & Jembatan Mazhab"
	description="Generasi tabi’ut tabi’in: fase kodifikasi hadis, jarh wa ta’dil, fiqih kota, dan biografi Imam Malik, Auza’i, Tsauri, Syu’bah, Laits, Ibnu al-Mubarak, hingga Abu Hanifah."
	keywords="tabiut tabiin, imam malik, abu hanifah, syubah, auza'i, kodifikasi hadis"
	canonical="/tabiut-tabiin"
/>

<div class="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50/40 py-10 md:py-12">
	<div class="mx-auto max-w-6xl space-y-8 px-4">
		<header class="relative overflow-hidden rounded-[1.85rem] bg-gradient-to-br from-emerald-950 via-teal-950 to-cyan-950 px-6 py-10 text-white shadow-xl md:px-10">
			<div class="absolute -right-16 top-8 h-44 w-44 rounded-full bg-emerald-300/10 blur-3xl"></div>
			<div class="relative z-10 max-w-3xl">
				<p class="text-xs uppercase tracking-[0.35em] text-emerald-200/70">Generasi Tabi’ut Tabi’in</p>
				<h1 class="mt-3 text-3xl font-bold md:text-5xl">Fase kodifikasi & pematangan disiplin ilmu</h1>
				<p class="mt-4 text-sm leading-7 text-white/80 md:text-base">
					Murid tabi’in yang merapikan penulisan, kritik sanad, fiqih kota, dan rihlah — jembatan menuju mazhab dan
					kitab klasik.
				</p>
				<div class="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
					<span class="rounded-full bg-white/15 px-3 py-1.5">{tabiutTabiinFigures.length} tokoh</span>
					<span class="rounded-full bg-white/15 px-3 py-1.5">{tabiutCenters.length} pusat</span>
					<span class="rounded-full bg-white/15 px-3 py-1.5">Detail biografi</span>
				</div>
			</div>
		</header>

		<section class="grid gap-6 lg:grid-cols-2">
			<article class="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Definisi</p>
				<h2 class="mt-2 text-2xl font-bold text-slate-900">Siapa tabi’ut tabi’in?</h2>
				<div class="mt-4 space-y-3 text-sm leading-7 text-slate-700">
					<p>
						Mereka bertemu dan belajar kepada tabi’in. Banyak sanad penting melewati generasi ini sebelum masuk kitab
						hadis, fiqih, tafsir, dan rijal.
					</p>
					<p>
						Ilmu bergerak dari majelis lisan menuju susunan bab, catatan kitab, pemetaan perawi, dan metode istinbat
						yang lebih mudah diwariskan.
					</p>
				</div>
			</article>
			<article class="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">Tugas sejarah</p>
				<h2 class="mt-2 text-2xl font-bold text-slate-900">Penyaringan & penyusunan</h2>
				<p class="mt-4 text-sm leading-7 text-slate-700">
					Riwayat makin banyak, wilayah makin luas, persoalan makin kompleks. Generasi ini memperkuat cara menilai
					perawi, membandingkan jalur, mengelompokkan bab, dan merumuskan fiqih lebih sistematis.
				</p>
			</article>
		</section>

		<section class="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
			<h2 class="text-2xl font-bold text-slate-900">Garis waktu</h2>
			<div class="mt-4 grid gap-3">
				{#each tabiutTimeline as item}
					<article class="grid gap-2 rounded-2xl border border-emerald-50 bg-emerald-50/50 p-4 md:grid-cols-[8rem_1fr]">
						<p class="text-xs font-bold uppercase tracking-wide text-emerald-700">{item.period}</p>
						<div>
							<h3 class="font-bold text-slate-900">{item.title}</h3>
							<p class="mt-1 text-sm leading-7 text-slate-700">{item.desc}</p>
						</div>
					</article>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
			<h2 class="text-2xl font-bold text-slate-900">Peta pusat ilmu abad ke-2 H</h2>
			<div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each tabiutCenterProfiles as center}
					<article class="rounded-2xl border border-teal-50 bg-teal-50/40 p-5">
						<p class="text-xs font-bold uppercase tracking-wide text-teal-700">{center.name}</p>
						<h3 class="mt-2 font-semibold text-slate-900">{center.focus}</h3>
						<p class="mt-2 text-sm leading-6 text-slate-600">{center.desc}</p>
					</article>
				{/each}
			</div>
		</section>

		{#each tabiutCenters as center}
			<section class="space-y-4">
				<div class="flex flex-wrap items-end justify-between gap-3">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Pusat ilmu</p>
						<h2 class="mt-1 text-2xl font-bold text-slate-900">{center}</h2>
					</div>
					<p class="text-sm text-slate-500">
						{tabiutTabiinFigures.filter((f) => f.center === center).length} tokoh
					</p>
				</div>
				<div class="grid gap-4 lg:grid-cols-2">
					{#each tabiutTabiinFigures.filter((f) => f.center === center) as figure}
						<a
							href={`/tabiut-tabiin/${figure.slug}`}
							class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
						>
							<div class="flex flex-wrap gap-2">
								<span class="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800"
									>{figure.era}</span
								>
								<span class="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600"
									>{figure.focus}</span
								>
							</div>
							<h3 class="mt-3 text-xl font-bold text-slate-900">{figure.name}</h3>
							<p class="mt-1 text-sm font-medium text-emerald-700">{figure.role}</p>
							<p class="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{figure.summary}</p>
							<p class="mt-4 text-sm font-semibold text-emerald-700">Baca biografi →</p>
						</a>
					{/each}
				</div>
			</section>
		{/each}

		<section class="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm">
			<h2 class="text-2xl font-bold text-slate-900">Bidang yang matang</h2>
			<div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each tabiutCodificationCards as card}
					<article class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
						<h3 class="font-semibold text-slate-900">{card.title}</h3>
						<p class="mt-2 text-sm leading-6 text-slate-600">{card.desc}</p>
					</article>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-cyan-100 bg-cyan-50/40 p-6 shadow-sm">
			<h2 class="text-2xl font-bold text-slate-900">Jalur menuju mazhab & kitab besar</h2>
			<div class="mt-4 grid gap-3 md:grid-cols-2">
				{#each tabiutBridgeNotes as note}
					<div class="rounded-2xl border border-cyan-50 bg-white p-4 text-sm leading-7 text-slate-700">{note}</div>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 shadow-sm">
			<h2 class="text-2xl font-bold text-slate-900">Adab membaca generasi ini</h2>
			<div class="mt-4 grid gap-3 md:grid-cols-2">
				{#each tabiutAdabNotes as note}
					<div class="rounded-2xl border border-emerald-50 bg-white p-4 text-sm leading-7 text-slate-700">{note}</div>
				{/each}
			</div>
			<div class="mt-6 flex flex-wrap gap-3">
				<a href="/tabiin" class="btn border-none bg-emerald-800 text-white hover:bg-emerald-900">Tabi’in</a>
				<a href="/sahabat" class="btn btn-outline border-emerald-200 text-emerald-900">Sahabat</a>
				<a href="/kitab" class="btn btn-ghost text-slate-700">Kitab</a>
			</div>
		</section>
	</div>
</div>
