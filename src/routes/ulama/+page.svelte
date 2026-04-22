<script lang="ts">
	import { getSanadFiguresByCluster, type SanadFigure } from '$lib/data/sanad';

	type ClusterStyle = {
		panel: string;
		badge: string;
		button: string;
	};

	type ClusterSection = {
		label: string;
		note: string;
		figures: SanadFigure[];
		style: ClusterStyle;
	};

	const clusterOrder = [
		'Imam Mazhab dan Turats Klasik',
		'Perawi dan Musnid Penghubung',
		'Walisongo dan Dakwah Jawa',
		'Hadramaut dan Jejaring Alawiyyin',
		'Ulama Nusantara dan Pesantren'
	];

	const clusterNotes: Record<string, string> = {
		'Imam Mazhab dan Turats Klasik':
			'Poros fiqih, hadis, dan tasawuf Sunni yang menjadi fondasi kitab-kitab pesantren dan madrasah.',
		'Perawi dan Musnid Penghubung':
			'Tokoh-tokoh penghubung antara tabi`ut tabi`in, imam mazhab, dan generasi musnid-kritikus sanad yang membuat jaringan riwayat tetap hidup.',
		'Walisongo dan Dakwah Jawa':
			'Jalur dakwah Jawa yang menggabungkan pesantren, budaya, pelayanan sosial, dan pembentukan masyarakat Muslim pesisir.',
		'Hadramaut dan Jejaring Alawiyyin':
			'Jejaring habaib yang menguatkan zikir, maulid, adab, dan hubungan ilmu antara Tarim, Batavia, Bogor, Pekalongan, dan Nusantara.',
		'Ulama Nusantara dan Pesantren':
			'Simpul kiai dan ulama lokal yang mengubah sanad kitab menjadi lembaga pesantren, organisasi, dan gerakan kebangsaan.'
	};

	const clusterStyles: Record<string, ClusterStyle> = {
		'Imam Mazhab dan Turats Klasik': {
			panel: 'border-teal-200 bg-gradient-to-br from-teal-50 to-white',
			badge: 'bg-teal-100 text-teal-700',
			button: 'bg-teal-700 text-white hover:bg-teal-800'
		},
		'Perawi dan Musnid Penghubung': {
			panel: 'border-sky-200 bg-gradient-to-br from-sky-50 to-white',
			badge: 'bg-sky-100 text-sky-700',
			button: 'bg-sky-700 text-white hover:bg-sky-800'
		},
		'Walisongo dan Dakwah Jawa': {
			panel: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
			badge: 'bg-emerald-100 text-emerald-700',
			button: 'bg-emerald-700 text-white hover:bg-emerald-800'
		},
		'Hadramaut dan Jejaring Alawiyyin': {
			panel: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
			badge: 'bg-amber-100 text-amber-700',
			button: 'bg-amber-700 text-white hover:bg-amber-800'
		},
		'Ulama Nusantara dan Pesantren': {
			panel: 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-white',
			badge: 'bg-indigo-100 text-indigo-700',
			button: 'bg-indigo-700 text-white hover:bg-indigo-800'
		}
	};

	const sections: ClusterSection[] = clusterOrder
		.map((label) => ({
			label,
			note: clusterNotes[label],
			figures: getSanadFiguresByCluster(label),
			style: clusterStyles[label]
		}))
		.filter((section) => section.figures.length > 0);
</script>

<svelte:head>
	<title>Jaringan Ulama, Wali, dan Pesantren - Santri Online</title>
</svelte:head>

<div class="space-y-8">
	<section class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-950 via-cyan-950 to-slate-950 px-6 py-10 text-white shadow-xl md:px-8">
		<div class="absolute -left-20 top-10 h-48 w-48 rounded-full bg-teal-300/10 blur-3xl"></div>
		<div class="absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl"></div>
		<div class="relative max-w-4xl">
			<p class="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Jaringan Ulama</p>
			<h1 class="mt-3 text-3xl font-bold md:text-5xl">Dari imam mazhab sampai pesantren Nusantara</h1>
			<p class="mt-4 max-w-3xl text-sm leading-7 text-white/75 md:text-base">
				Halaman ini sekarang mengikuti graph sanad yang sama dengan halaman tokoh. Jalurnya
				tidak berhenti di Baghdad, Damaskus, atau Makkah, tetapi diteruskan ke Walisongo,
				habaib Hadramaut, dan ulama pesantren Nusantara.
			</p>
			<div class="mt-6 flex flex-wrap gap-3">
				<a href="/tokoh" class="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
					Buka peta sanad
				</a>
				<a href="/dinasti" class="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
					Lihat konteks dinasti
				</a>
			</div>
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
		<div class="grid gap-4 lg:grid-cols-2">
			<div class="rounded-3xl bg-slate-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Cara Membaca</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">
					Setiap kartu di bawah terhubung ke node sanad yang menampilkan guru sebelumnya,
					penerus sesudahnya, konteks politik, serta backlink antarjalur.
				</p>
			</div>
			<div class="rounded-3xl bg-slate-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Ruang Perluasan</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">
					Graph ini sekarang sudah memuat empat klaster besar: imam mazhab klasik, Walisongo,
					habaib Hadramaut, dan ulama pesantren Nusantara. Struktur yang sama bisa diteruskan
					lagi ke jalur-jalur regional lain.
				</p>
			</div>
		</div>
	</section>

	{#each sections as section}
		<section class={`rounded-[1.75rem] border p-6 shadow-sm ${section.style.panel}`}>
			<div class="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Klaster Sanad</p>
					<h2 class="mt-2 text-2xl font-semibold text-slate-900">{section.label}</h2>
					<p class="mt-3 max-w-3xl text-sm leading-7 text-slate-700">{section.note}</p>
				</div>
				<p class="text-sm text-slate-500">{section.figures.length} tokoh</p>
			</div>

			<div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each section.figures as figure}
					<article class="rounded-3xl border border-white/70 bg-white p-5 shadow-sm">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<span class={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${section.style.badge}`}>
								{figure.periodLabel}
							</span>
							{#if figure.legacyPath}
								<a href={figure.legacyPath} class="text-xs font-semibold text-slate-500 transition hover:text-slate-700">
									Halaman tematik
								</a>
							{/if}
						</div>
						<h3 class="mt-4 text-xl font-semibold text-slate-900">{figure.name}</h3>
						<p class="mt-2 text-sm font-medium text-slate-700">{figure.title}</p>
						<p class="mt-3 text-sm leading-7 text-slate-600">{figure.summary}</p>
						<p class="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Wilayah</p>
						<p class="mt-2 text-sm leading-7 text-slate-600">{figure.region}</p>
						<div class="mt-5 flex flex-wrap gap-3">
							<a href={`/tokoh/${figure.slug}`} class={`rounded-full px-4 py-2 text-sm font-semibold transition ${section.style.button}`}>
								Buka sanad
							</a>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/each}
</div>
