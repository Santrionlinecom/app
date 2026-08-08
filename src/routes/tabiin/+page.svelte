<script lang="ts">
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import {
		tabiinAdabNotes,
		tabiinCenterProfiles,
		tabiinCenters,
		tabiinDisciplineCards,
		tabiinFigures,
		tabiinTimeline
	} from '$lib/data/tabiin';
</script>

<SeoHead
	title="Tabi'in — Murid Sahabat & Fondasi Ilmu"
	description="Mengenal generasi tabi’in: definisi, garis waktu, peta pusat ilmu, dan biografi tokoh Madinah, Makkah, Kufah, Basrah, Yaman, dan Syam."
	keywords="tabiin, tabi'in, said al musayyib, hasan basri, nafi, zuhri, atah"
	canonical="/tabiin"
/>

<div class="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50/40 py-10 md:py-12">
	<div class="mx-auto max-w-6xl space-y-8 px-4">
		<header class="relative overflow-hidden rounded-[1.85rem] bg-gradient-to-br from-amber-950 via-orange-900 to-rose-900 px-6 py-10 text-white shadow-xl md:px-10">
			<div class="absolute -left-16 top-8 h-44 w-44 rounded-full bg-amber-300/10 blur-3xl"></div>
			<div class="relative z-10 max-w-3xl">
				<p class="text-xs uppercase tracking-[0.35em] text-amber-200/70">Generasi Tabi’in</p>
				<h1 class="mt-3 text-3xl font-bold md:text-5xl">Murid para sahabat, penguat fondasi ilmu</h1>
				<p class="mt-4 text-sm leading-7 text-white/80 md:text-base">
					Tabi’in bertemu sahabat Nabi dan menyalurkan hadis, fiqih, tafsir, serta adab ke generasi sesudahnya. Dari
					mereka lahir madrasah kota dan bahan kodifikasi.
				</p>
				<div class="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
					<span class="rounded-full bg-white/15 px-3 py-1.5">{tabiinFigures.length} tokoh</span>
					<span class="rounded-full bg-white/15 px-3 py-1.5">{tabiinCenters.length} pusat ilmu</span>
					<span class="rounded-full bg-white/15 px-3 py-1.5">Biografi + pelajaran</span>
				</div>
			</div>
		</header>

		<section class="grid gap-6 lg:grid-cols-2">
			<article class="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">Definisi</p>
				<h2 class="mt-2 text-2xl font-bold text-slate-900">Siapa tabi’in?</h2>
				<div class="mt-4 space-y-3 text-sm leading-7 text-slate-700">
					<p>
						Tabi’in adalah Muslim yang bertemu sahabat Nabi dalam keadaan beriman dan wafat di atas Islam. Mereka
						tidak bertemu Rasulullah ﷺ secara langsung, tetapi menerima Al-Qur’an, sunnah, fatwa, dan adab dari para
						sahabat.
					</p>
					<p>
						Keutamaan mereka pada kedekatan sanad dan saksi masyarakat yang masih dibentuk sahabat di Madinah, Makkah,
						Kufah, Basrah, Syam, dan Yaman.
					</p>
				</div>
			</article>
			<article class="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">Tugas sejarah</p>
				<h2 class="mt-2 text-2xl font-bold text-slate-900">Jembatan saksi wahyu → kitab</h2>
				<p class="mt-4 text-sm leading-7 text-slate-700">
					Ilmu sahabat banyak hidup dalam hafalan dan praktik. Tabi’in mulai memetakan guru, kota, bab ibadah, dan
					persoalan masyarakat. Dari sini lahir bahan mentah kitab hadis, tafsir, fiqih, sirah, dan tazkiyah.
				</p>
			</article>
		</section>

		<section class="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
			<h2 class="text-2xl font-bold text-slate-900">Garis waktu</h2>
			<div class="mt-4 grid gap-3">
				{#each tabiinTimeline as item}
					<article class="grid gap-2 rounded-2xl border border-amber-50 bg-amber-50/50 p-4 md:grid-cols-[8rem_1fr]">
						<p class="text-xs font-bold uppercase tracking-wide text-amber-700">{item.period}</p>
						<div>
							<h3 class="font-bold text-slate-900">{item.title}</h3>
							<p class="mt-1 text-sm leading-7 text-slate-700">{item.desc}</p>
						</div>
					</article>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
			<h2 class="text-2xl font-bold text-slate-900">Peta pusat ilmu</h2>
			<div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each tabiinCenterProfiles as center}
					<article class="rounded-2xl border border-orange-50 bg-orange-50/40 p-5">
						<p class="text-xs font-bold uppercase tracking-wide text-orange-700">{center.name}</p>
						<h3 class="mt-2 font-semibold text-slate-900">{center.focus}</h3>
						<p class="mt-2 text-sm leading-6 text-slate-600">{center.desc}</p>
					</article>
				{/each}
			</div>
		</section>

		{#each tabiinCenters as center}
			<section class="space-y-4">
				<div class="flex flex-wrap items-end justify-between gap-3">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Pusat ilmu</p>
						<h2 class="mt-1 text-2xl font-bold text-slate-900">{center}</h2>
					</div>
					<p class="text-sm text-slate-500">
						{tabiinFigures.filter((f) => f.center === center).length} tokoh
					</p>
				</div>
				<div class="grid gap-4 lg:grid-cols-2">
					{#each tabiinFigures.filter((f) => f.center === center) as figure}
						<a
							href={`/tabiin/${figure.slug}`}
							class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md"
						>
							<div class="flex flex-wrap gap-2">
								<span class="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800"
									>{figure.era}</span
								>
								<span class="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600"
									>{figure.focus}</span
								>
							</div>
							<h3 class="mt-3 text-xl font-bold text-slate-900">{figure.name}</h3>
							<p class="mt-1 text-sm font-medium text-amber-800">{figure.role}</p>
							<p class="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{figure.summary}</p>
							<p class="mt-4 text-sm font-semibold text-amber-700">Baca biografi →</p>
						</a>
					{/each}
				</div>
			</section>
		{/each}

		<section class="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
			<h2 class="text-2xl font-bold text-slate-900">Warisan disiplin ilmu</h2>
			<div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each tabiinDisciplineCards as card}
					<article class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
						<h3 class="font-semibold text-slate-900">{card.title}</h3>
						<p class="mt-2 text-sm leading-6 text-slate-600">{card.desc}</p>
					</article>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-rose-100 bg-rose-50/50 p-6 shadow-sm">
			<h2 class="text-2xl font-bold text-slate-900">Adab membaca tabi’in</h2>
			<div class="mt-4 grid gap-3 md:grid-cols-2">
				{#each tabiinAdabNotes as note}
					<div class="rounded-2xl border border-rose-50 bg-white p-4 text-sm leading-7 text-slate-700">{note}</div>
				{/each}
			</div>
			<div class="mt-6 flex flex-wrap gap-3">
				<a href="/sahabat" class="btn border-none bg-amber-800 text-white hover:bg-amber-900">Sahabat</a>
				<a href="/tabiut-tabiin" class="btn btn-outline border-amber-200 text-amber-900">Tabi’ut Tabi’in</a>
				<a href="/nabi" class="btn btn-ghost text-slate-700">25 Nabi</a>
			</div>
		</section>
	</div>
</div>
