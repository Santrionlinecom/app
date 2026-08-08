<script lang="ts">
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import { nabiList, ululAzmiList } from '$lib/data/nabi';

	const ordered = [...nabiList].sort((a, b) => a.order - b.order);
</script>

<SeoHead
	title="25 Nabi & Rasul — Kisah, Teladan, dan Dalil"
	description="Pelajari 25 nabi dan rasul yang wajib diimani: ringkasan kisah, poin penting, pelajaran adab, dan dalil Al-Qur’an. Konten sirah untuk pembinaan generasi muslim."
	keywords="25 nabi, kisah nabi, ulul azmi, sirah, nabi muhammad, nabi musa, nabi ibrahim"
	canonical="/nabi"
/>

<div class="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50/40 py-10 md:py-12">
	<div class="mx-auto max-w-6xl space-y-8 px-4">
		<header class="relative overflow-hidden rounded-[1.85rem] bg-gradient-to-br from-emerald-800 via-teal-700 to-cyan-700 p-8 text-white shadow-xl md:p-12">
			<div class="absolute -right-16 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10 max-w-3xl">
				<p class="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100/80">Sirah · Ilmu hidup</p>
				<h1 class="mt-3 text-3xl font-black tracking-tight md:text-5xl">25 Nabi & Rasul</h1>
				<p class="mt-4 text-base leading-8 text-white/90 md:text-lg">
					Utusan Allah yang membawa tauhid, sabar, dan adab. Dipelajari untuk memperkuat iman dan meneladani akhlak — bukan sekadar hafal nama.
				</p>
				<div class="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
					<span class="rounded-full bg-white/15 px-3 py-1.5">{ordered.length} nabi & rasul</span>
					<span class="rounded-full bg-white/15 px-3 py-1.5">{ululAzmiList.length} ulul azmi</span>
					<span class="rounded-full bg-white/15 px-3 py-1.5">Dalil + pelajaran</span>
				</div>
			</div>
		</header>

		<section class="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
			<h2 class="text-xl font-bold text-slate-900">Kenapa dipelajari di SantriOnline?</h2>
			<div class="mt-3 space-y-3 text-sm leading-7 text-slate-700 md:text-base">
				<p>
					Iman kepada nabi dan rasul adalah rukun iman. Mengenal kisah mereka menumbuhkan cinta kepada Allah, rasa sabar, dan adab kepada utusan-Nya. Materi ini disusun ringkas namun lebih lengkap: konteks, kisah, poin, pelajaran, dan rujukan ayat.
				</p>
				<p class="text-slate-600">
					Catatan: detail nasab/era yang bersumber riwayat tafsir/sirah disebut sebagai riwayat bila tidak qath’i. Untuk tafsir mendalam, rujuk guru dan kitab mu’tabar.
				</p>
			</div>
		</section>

		<section class="rounded-3xl border border-teal-100 bg-teal-50/50 p-6 shadow-sm">
			<h2 class="text-lg font-bold text-teal-900">Ulul Azmi</h2>
			<p class="mt-2 text-sm text-teal-900/80">Nabi yang menanggung ujian dakwah paling berat:</p>
			<div class="mt-4 flex flex-wrap gap-2">
				{#each ululAzmiList as n}
					<a
						href={`/nabi/${n.slug}`}
						class="rounded-full border border-teal-200 bg-white px-3 py-1.5 text-sm font-semibold text-teal-800 hover:bg-teal-50"
					>
						{n.name}
					</a>
				{/each}
			</div>
		</section>

		<section class="grid gap-4 md:grid-cols-2">
			{#each ordered as item}
				<a
					href={`/nabi/${item.slug}`}
					class="group rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
				>
					<div class="flex items-start gap-3">
						<span
							class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-sm font-bold text-white"
						>
							{item.order}
						</span>
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<h2 class="text-lg font-bold text-emerald-800 group-hover:text-emerald-700">{item.name}</h2>
								{#if item.ululAzmi}
									<span class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700"
										>Ulul Azmi</span
									>
								{/if}
							</div>
							{#if item.titles?.length}
								<p class="mt-1 text-xs font-medium text-slate-500">{item.titles.slice(0, 2).join(' · ')}</p>
							{/if}
							<p class="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.summary}</p>
							<p class="mt-3 text-sm font-semibold text-emerald-700">Baca lengkap →</p>
						</div>
					</div>
				</a>
			{/each}
		</section>

		<section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
			<h2 class="text-xl font-bold text-slate-900">Cara meneladani</h2>
			<ul class="mt-4 grid gap-3 text-sm leading-7 text-slate-700 md:grid-cols-2">
				<li>• Ambil satu pelajaran amaliyah, bukan hanya hafal urutan nama.</li>
				<li>• Kaitkan dengan adab: sabar Nuh, sidik Ibrahim, kehormatan Yusuf, rahmat Muhammad ﷺ.</li>
				<li>• Baca dalil, lalu tanyakan ke guru bila butuh tafsir mendalam.</li>
				<li>• Hindari kisah israiliyyat yang bertentangan dengan akidah.</li>
			</ul>
			<div class="mt-6 flex flex-wrap gap-3">
				<a href="/sahabat" class="btn border-none bg-emerald-700 text-white hover:bg-emerald-800">Lanjut ke Sahabat</a>
				<a href="/kitab" class="btn btn-outline border-emerald-200 text-emerald-800">Kitab & rujukan</a>
			</div>
		</section>
	</div>
</div>
