<script lang="ts">
	import { getSanadFiguresByCluster, type SanadFigure } from '$lib/data/sanad';

	type WaliCard = SanadFigure & {
		classes: {
			border: string;
			text: string;
			button: string;
		};
	};

	const cardClasses = [
		{
			border: 'border-emerald-200',
			text: 'text-emerald-700',
			button: 'bg-emerald-700 text-white hover:bg-emerald-800'
		},
		{
			border: 'border-sky-200',
			text: 'text-sky-700',
			button: 'bg-sky-700 text-white hover:bg-sky-800'
		},
		{
			border: 'border-fuchsia-200',
			text: 'text-fuchsia-700',
			button: 'bg-fuchsia-700 text-white hover:bg-fuchsia-800'
		},
		{
			border: 'border-amber-200',
			text: 'text-amber-700',
			button: 'bg-amber-700 text-white hover:bg-amber-800'
		},
		{
			border: 'border-rose-200',
			text: 'text-rose-700',
			button: 'bg-rose-700 text-white hover:bg-rose-800'
		},
		{
			border: 'border-indigo-200',
			text: 'text-indigo-700',
			button: 'bg-indigo-700 text-white hover:bg-indigo-800'
		},
		{
			border: 'border-teal-200',
			text: 'text-teal-700',
			button: 'bg-teal-700 text-white hover:bg-teal-800'
		},
		{
			border: 'border-lime-200',
			text: 'text-lime-700',
			button: 'bg-lime-700 text-white hover:bg-lime-800'
		},
		{
			border: 'border-cyan-200',
			text: 'text-cyan-700',
			button: 'bg-cyan-700 text-white hover:bg-cyan-800'
		}
	];

	const walisongo: WaliCard[] = getSanadFiguresByCluster('Walisongo dan Dakwah Jawa').map(
		(figure, index) => ({
			...figure,
			classes: cardClasses[index] ?? cardClasses[0]
		})
	);
</script>

<svelte:head>
	<title>Walisongo - Jejak Sanad Dakwah Jawa</title>
</svelte:head>

<div class="space-y-8">
	<section class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-teal-950 to-cyan-950 px-6 py-10 text-white shadow-xl md:px-8">
		<div class="absolute -left-20 top-10 h-48 w-48 rounded-full bg-emerald-300/10 blur-3xl"></div>
		<div class="absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl"></div>
		<div class="relative max-w-4xl">
			<p class="text-xs uppercase tracking-[0.35em] text-emerald-200/70">Walisongo</p>
			<h1 class="mt-3 text-3xl font-bold md:text-5xl">Jejak sanad dakwah di tanah Jawa</h1>
			<p class="mt-4 max-w-3xl text-sm leading-7 text-white/75 md:text-base">
				Halaman ini sekarang menjadi pintu masuk ke jalur sanad Walisongo. Setiap wali terhubung
				ke graph tokoh utama sehingga hubungan mereka dengan imam mazhab, Demak, Cirebon,
				Banten, dan pesantren Nusantara bisa dibaca sebagai rantai yang tersambung.
			</p>
			<div class="mt-6 flex flex-wrap gap-3">
				<a href="/tokoh" class="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
					Buka peta sanad
				</a>
				<a href="/dinasti#kesultanan-demak" class="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
					Konteks Demak
				</a>
				<a href="/dinasti#kesultanan-cirebon" class="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
					Konteks Cirebon
				</a>
				<a href="/dinasti#kesultanan-banten" class="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
					Konteks Banten
				</a>
			</div>
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
		<div class="grid gap-4 lg:grid-cols-2">
			<div class="rounded-3xl bg-slate-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Karakter Dakwah</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">
					Walisongo tidak hanya mengajar fiqih, tetapi juga mengubah budaya, perdagangan,
					pesantren, seni, dan pelayanan sosial menjadi sarana islamisasi yang damai.
				</p>
			</div>
			<div class="rounded-3xl bg-slate-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Arah Graph</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">
					Kartu di bawah mengarah ke node sanad. Dari sana, jalur sebelum dan sesudah setiap wali
					bisa dibaca sebagai backlink ilmu dan dakwah, bukan sekadar biografi terpisah.
				</p>
			</div>
		</div>
	</section>

	<section class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
		{#each walisongo as wali, index}
			<article class={`rounded-[1.75rem] border bg-white p-6 shadow-sm ${wali.classes.border}`}>
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Wali {index + 1}</p>
				<h2 class={`mt-3 text-2xl font-semibold ${wali.classes.text}`}>{wali.name}</h2>
				<p class="mt-2 text-sm font-medium text-slate-700">{wali.periodLabel}</p>
				<p class="mt-4 text-sm leading-7 text-slate-600">{wali.summary}</p>
				<p class="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Wilayah</p>
				<p class="mt-2 text-sm leading-7 text-slate-600">{wali.region}</p>
				<div class="mt-5 flex flex-wrap gap-3">
					<a href={`/tokoh/${wali.slug}`} class={`rounded-full px-4 py-2 text-sm font-semibold transition ${wali.classes.button}`}>
						Buka sanad
					</a>
					{#if wali.legacyPath}
						<a href={wali.legacyPath} class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
							Halaman lama
						</a>
					{/if}
				</div>
			</article>
		{/each}
	</section>

	<section class="rounded-[1.75rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Catatan jalur Walisongo</h2>
		<div class="mt-4 space-y-3 text-sm leading-7 text-slate-700">
			<p>
				Di graph sanad ini, hubungan antarwali ditulis dengan bahasa yang hati-hati. Yang
				ditonjolkan adalah jalur pendidikan, jaringan dakwah, dan kesinambungan peran, bukan
				memaksakan semua riwayat populer sebagai fakta tunggal yang pasti.
			</p>
			<p>
				Pusat-pusat seperti Demak, Cirebon, dan Banten ikut ditampilkan sebagai konteks politik
				supaya peran Walisongo terbaca tidak hanya di ruang masjid dan pesantren, tetapi juga dalam
				pembentukan masyarakat Islam pesisir Jawa.
			</p>
		</div>
	</section>
</div>
