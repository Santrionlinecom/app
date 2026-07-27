<script lang="ts">
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import {
		adabNotes,
		companionGroups,
		historyTimeline,
		khulafaRasyidin,
		knowledgeRoles,
		notableSahabat
	} from '$lib/data/sahabat';
</script>

<SeoHead
	title="Sahabat Rasulullah ﷺ — Khulafa, Tokoh, dan Adab Sejarah"
	description="Mengenal sahabat Nabi: Khulafaur Rasyidin, tokoh penting, garis sejarah, kelompok sahabat, dan adab ahlus sunnah membaca sejarah generasi emas."
	keywords="sahabat nabi, khulafaur rasyidin, abu bakar, umar, utsman, ali, ahlul badr"
	canonical="/sahabat"
/>

<div class="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50/40 py-10 md:py-12">
	<div class="mx-auto max-w-6xl space-y-10 px-4">
		<header class="relative overflow-hidden rounded-[1.85rem] bg-gradient-to-br from-amber-700 via-orange-600 to-yellow-600 p-8 text-white shadow-xl md:p-12">
			<div class="absolute -right-16 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10 max-w-3xl">
				<p class="text-xs font-semibold uppercase tracking-[0.28em] text-amber-100/80">Sirah · Generasi emas</p>
				<h1 class="mt-3 text-3xl font-black md:text-5xl">Sahabat Rasulullah ﷺ</h1>
				<p class="mt-4 text-base leading-8 text-white/90 md:text-lg">
					Saksi wahyu, pembawa amanah dakwah, dan mata rantai pertama ilmu. Dikenang dengan cinta, adab, dan tanpa
					cercaan — sesuai manhaj ahlus sunnah.
				</p>
			</div>
		</header>

		<div class="grid gap-6 lg:grid-cols-2">
			<section class="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm md:p-8">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">Definisi</p>
				<h2 class="mt-2 text-2xl font-bold text-slate-900">Siapa sahabat?</h2>
				<div class="mt-4 space-y-3 text-sm leading-7 text-slate-700">
					<p>
						Dalam istilah ilmu hadis, sahabat adalah orang yang bertemu Nabi Muhammad ﷺ dalam keadaan beriman dan
						wafat di atas Islam. Mereka membawa Al-Qur’an, sunnah, adab ibadah, dan praktik dakwah kepada generasi
						berikutnya.
					</p>
					<p>
						Kedudukan mereka berbeda sesuai keutamaan, ilmu, dan pengorbanan: ada yang paling awal masuk Islam,
						hijrah, Badar, Baiat Ridwan, penulis wahyu, perawi, panglima, dan guru wilayah.
					</p>
				</div>
			</section>
			<section class="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm md:p-8">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">Peran</p>
				<h2 class="mt-2 text-2xl font-bold text-slate-900">Mengapa penting?</h2>
				<ul class="mt-4 space-y-3 text-sm leading-7 text-slate-700">
					{#each knowledgeRoles as role}
						<li class="flex gap-3">
							<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-500"></span>
							<span>{role}</span>
						</li>
					{/each}
				</ul>
			</section>
		</div>

		<section>
			<div class="mb-5">
				<h2 class="text-2xl font-bold text-slate-900 md:text-3xl">Khulafaur Rasyidin</h2>
				<p class="mt-1 text-sm text-slate-600">Empat khalifah teladan — buka biografi lengkap</p>
			</div>
			<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{#each khulafaRasyidin as kh}
					<a
						href={`/sahabat/${kh.slug}`}
						class="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md"
					>
						<p class="text-xs font-bold uppercase tracking-wide text-amber-600">Khalifah ke-{kh.rank}</p>
						<h3 class="mt-2 text-lg font-bold text-slate-900">{kh.name}</h3>
						<p class="mt-1 text-xs text-slate-500">{kh.born} – {kh.died}</p>
						<p class="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{kh.summary}</p>
						<p class="mt-4 text-sm font-semibold text-amber-700">Baca biografi →</p>
					</a>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-yellow-100 bg-white p-6 shadow-sm md:p-8">
			<h2 class="text-2xl font-bold text-slate-900">Garis sejarah</h2>
			<div class="mt-5 grid gap-3">
				{#each historyTimeline as item}
					<article class="grid gap-2 rounded-2xl border border-yellow-100 bg-yellow-50/50 p-4 md:grid-cols-[9rem_1fr]">
						<p class="text-xs font-bold uppercase tracking-wide text-amber-700">{item.period}</p>
						<div>
							<h3 class="font-bold text-slate-900">{item.title}</h3>
							<p class="mt-1 text-sm leading-7 text-slate-700">{item.desc}</p>
						</div>
					</article>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm md:p-8">
			<h2 class="text-2xl font-bold text-slate-900">Kelompok sahabat</h2>
			<div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each companionGroups as group}
					<article class="rounded-2xl border border-amber-50 bg-amber-50/40 p-4">
						<h3 class="font-bold text-slate-900">{group.name}</h3>
						<p class="mt-2 text-sm leading-6 text-slate-700">{group.desc}</p>
					</article>
				{/each}
			</div>
		</section>

		<section>
			<div class="mb-5">
				<h2 class="text-2xl font-bold text-slate-900 md:text-3xl">Tokoh sahabat lain</h2>
				<p class="mt-1 text-sm text-slate-600">Biografi ringkas yang bisa dibuka per tokoh</p>
			</div>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each notableSahabat as s}
					<a
						href={`/sahabat/${s.slug}`}
						class="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md"
					>
						<h3 class="text-lg font-bold text-slate-900">{s.name}</h3>
						<p class="mt-1 text-xs font-medium text-orange-700">{s.role}</p>
						<p class="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{s.summary}</p>
						<p class="mt-3 text-sm font-semibold text-orange-700">Detail →</p>
					</a>
				{/each}
			</div>
		</section>

		<section class="grid gap-6 lg:grid-cols-2">
			<div class="rounded-3xl border border-yellow-100 bg-white p-6 shadow-sm">
				<h2 class="text-xl font-bold text-slate-900">Al-Asyarah al-Mubasyarah</h2>
				<p class="mt-3 text-sm leading-7 text-slate-700">
					Sepuluh yang dijanjikan surga dalam riwayat masyhur: Abu Bakar, Umar, Utsman, Ali, Thalhah, Zubair,
					Abdurrahman bin Auf, Sa’d bin Abi Waqqash, Sa’id bin Zaid, dan Abu Ubaidah bin Jarrah. Ini keutamaan
					khusus, bukan penafian kemuliaan sahabat lain.
				</p>
			</div>
			<div class="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
				<h2 class="text-xl font-bold text-slate-900">Pusat ilmu sahabat</h2>
				<p class="mt-3 text-sm leading-7 text-slate-700">
					Ilmu menyebar lewat majelis sahabat: Aisyah & Ibnu Umar di Madinah, Ibnu Abbas di Makkah, Ibnu Mas’ud di
					Kufah, Abu Musa di Basrah, Mu’adz di Yaman, dan banyak lagi di Syam-Mesir. Dari situ lahir tabi’in dan
					fondasi mazhab.
				</p>
			</div>
		</section>

		<section class="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm md:p-8">
			<h2 class="text-2xl font-bold text-slate-900">Adab membaca sejarah sahabat</h2>
			<div class="mt-4 grid gap-3 md:grid-cols-2">
				{#each adabNotes as note}
					<div class="rounded-2xl border border-amber-50 bg-amber-50/50 p-4 text-sm leading-7 text-slate-700">
						{note}
					</div>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-orange-100 bg-orange-50/50 p-6 md:p-8">
			<h2 class="text-xl font-bold text-slate-900">Pelajaran untuk santri</h2>
			<p class="mt-3 text-sm leading-7 text-slate-700">
				Sahabat mengajarkan sidik, amanah, itsar, sabar, dan ilmu bersanad. Cintai mereka, teladani akhlak mereka,
				dan jangan jadikan sejarah sebagai bahan perpecahan.
			</p>
			<div class="mt-5 flex flex-wrap gap-3">
				<a href="/nabi" class="btn border-none bg-amber-700 text-white hover:bg-amber-800">Kisah 25 Nabi</a>
				<a href="/kitab" class="btn btn-outline border-amber-200 text-amber-900">Kitab & rujukan</a>
				<a href="/dinasti" class="btn btn-ghost text-slate-700">Dinasti & Daulah Islam</a>
			</div>
		</section>
	</div>
</div>
