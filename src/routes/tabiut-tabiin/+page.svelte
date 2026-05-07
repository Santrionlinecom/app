<script lang="ts">
	import { tabiutTabiinFigures } from '$lib/data/tabiut-tabiin';

	const centers = Array.from(new Set(tabiutTabiinFigures.map((figure) => figure.center)));
	const timeline = [
		{
			period: '80-120 H',
			title: 'Murid besar tabi\'in mulai menonjol',
			desc: 'Generasi ini menerima ilmu dari tokoh seperti al-Zuhri, Nafi\', Ata\', Qatadah, Hasan al-Basri, dan al-Sha\'bi. Mereka menjadi penghubung langsung antara majelis tabi\'in dan imam abad kedua.'
		},
		{
			period: '120-150 H',
			title: 'Rihlah ilmu makin luas',
			desc: 'Para penuntut ilmu berpindah antar kota: Madinah, Makkah, Kufah, Basrah, Syam, Mesir, Yaman, dan Khurasan. Perbandingan riwayat antar daerah membuat kritik sanad semakin tajam.'
		},
		{
			period: '130-180 H',
			title: 'Kitab dan metode mulai tersusun',
			desc: 'Hadis, atsar, fatwa, dan bab fiqih mulai dihimpun lebih sistematis. Al-Muwatta, mushannaf awal, dan catatan fatwa kota menjadi tanda kuatnya fase kodifikasi.'
		},
		{
			period: '150-200 H',
			title: 'Jalan menuju imam mazhab dan hadis',
			desc: 'Murid generasi ini melahirkan fase Imam Syafi\'i, Ahmad bin Hanbal, Ali ibn al-Madini, Yahya ibn Ma\'in, dan para penyusun kitab hadis abad ketiga.'
		}
	];
	const centerProfiles = [
		{
			name: 'Madinah',
			focus: 'Al-Muwatta, amal ahli Madinah, fiqih riwayat',
			desc: 'Madinah menjadi simbol kesinambungan amal masyarakat Nabi. Imam Malik menyusun fiqih dengan kuat berpijak pada hadis, atsar, dan praktik penduduk Madinah.'
		},
		{
			name: 'Makkah',
			focus: 'Fiqih Haramayn, tafsir, dan sanad haji',
			desc: 'Makkah menghubungkan jalur Ata\', Ibn Jurayj, Sufyan ibn Uyaynah, dan murid-murid besar yang kelak menjadi guru para imam abad ketiga.'
		},
		{
			name: 'Kufah',
			focus: 'Hadis Irak, fiqih atsar, dan wara',
			desc: 'Kufah kuat dalam riwayat Ibn Mas\'ud, Ali, dan ulama Irak. Sufyan al-Thawri dan Waki\' menjadi penghubung penting ke tradisi musnad dan kritik hadis.'
		},
		{
			name: 'Basrah',
			focus: 'Kritik sanad, jarh wa ta\'dil, dan ketelitian perawi',
			desc: 'Basrah melahirkan tokoh seperti Shu\'bah dan Yahya al-Qattan. Dari kota ini disiplin menilai perawi dan menguji riwayat menjadi semakin tegas.'
		},
		{
			name: 'Syam - Beirut',
			focus: 'Fiqih Syam, jihad, dan tata masyarakat perbatasan',
			desc: 'Al-Awza\'i menjadi poros fiqih Syam. Pandangannya berpengaruh di wilayah Syam dan Andalus awal sebelum peta mazhab terkonsolidasi.'
		},
		{
			name: 'Mesir dan Khurasan',
			focus: 'Mujtahid kota, rihlah ilmu, dan jaringan hadis timur-barat',
			desc: 'Layth ibn Sa\'d di Mesir dan Abdullah ibn al-Mubarak di Khurasan menunjukkan keluasan jaringan ilmu lintas wilayah pada abad kedua Hijriyah.'
		}
	];
	const codificationCards = [
		{
			title: 'Hadis dan atsar',
			desc: 'Riwayat mulai dikumpulkan menurut guru, bab, dan tema. Disiplin membandingkan sanad semakin diperlukan karena wilayah Islam makin luas.'
		},
		{
			title: 'Fiqih kota',
			desc: 'Fatwa Madinah, Makkah, Kufah, Basrah, Syam, dan Mesir mulai terlihat sebagai tradisi hukum lokal yang kelak memberi bahan bagi mazhab.'
		},
		{
			title: 'Jarh wa ta\'dil',
			desc: 'Penilaian terhadap hafalan, kejujuran, ketelitian, dan pertemuan antar perawi mulai menjadi ilmu tersendiri.'
		},
		{
			title: 'Rihlah ilmiah',
			desc: 'Ulama bepergian jauh untuk mendengar hadis langsung, menguji riwayat, dan membandingkan fatwa antar pusat ilmu.'
		},
		{
			title: 'Zuhud dan adab',
			desc: 'Generasi ini menjaga kesederhanaan, takut kepada kedudukan, serta memperingatkan bahaya ilmu yang tidak membuahkan amal.'
		},
		{
			title: 'Jalan ke kitab klasik',
			desc: 'Karya dan sanad mereka menjadi bahan utama bagi musnad, sahih, sunan, kitab rijal, tafsir, dan karya fiqih setelahnya.'
		}
	];
	const bridgeNotes = [
		'Imam Malik menghubungkan tradisi Madinah dengan murid seperti Imam Syafi\'i dan Ibn Wahb.',
		'Sufyan al-Thawri, Waki\', Shu\'bah, dan Yahya al-Qattan memperkuat jalur hadis Irak menuju Ahmad bin Hanbal dan para kritikus hadis.',
		'Ibn Jurayj dan Sufyan ibn Uyaynah menjaga jaringan Makkah yang memengaruhi Syafi\'i, Ahmad, dan ahli hadis setelahnya.',
		'Al-Awza\'i, Layth, dan Ibn al-Mubarak memperlihatkan bahwa sebelum empat mazhab mapan, banyak mujtahid besar berpengaruh di wilayahnya.'
	];
	const adabNotes = [
		'Melihat generasi ini sebagai fase kerja ilmiah yang berat: menghafal, menguji, bepergian, menulis, dan menyaring riwayat.',
		'Tidak menyederhanakan sejarah mazhab seolah langsung jadi. Banyak metode matang melalui dialog panjang antar kota.',
		'Menghormati imam yang mazhabnya tidak bertahan formal, karena jasa ilmu mereka tetap masuk ke kitab-kitab besar.',
		'Mengambil teladan ketelitian sanad, kehati-hatian fatwa, dan keteguhan adab terhadap guru.'
	];
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

	<section class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
		<div class="rounded-[1.75rem] border border-teal-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">Definisi</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">Siapa tabi'ut tabi'in?</h2>
			<div class="mt-4 space-y-3 text-sm leading-7 text-slate-700">
				<p>
					Tabi'ut tabi'in adalah generasi yang bertemu dan belajar kepada tabi'in. Mereka berada satu
					tingkat setelah murid sahabat, sehingga banyak sanad penting melewati mereka sebelum masuk
					ke kitab-kitab hadis, fiqih, tafsir, dan rijal.
				</p>
				<p>
					Fase ini penting karena ilmu Islam mulai bergerak dari majelis lisan menuju susunan bab,
					catatan kitab, pemetaan perawi, dan metode istinbat yang lebih mudah diwariskan.
				</p>
			</div>
		</div>

		<div class="rounded-[1.75rem] border border-cyan-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Tugas Sejarah</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">Fase penyaringan dan penyusunan</h2>
			<p class="mt-4 text-sm leading-7 text-slate-700">
				Jumlah riwayat makin banyak, wilayah makin luas, dan persoalan masyarakat makin kompleks. Karena itu
				generasi tabi'ut tabi'in memperkuat cara menilai perawi, membandingkan jalur, mengelompokkan bab,
				dan merumuskan jawaban fiqih dengan lebih sistematis.
			</p>
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-emerald-200 bg-white p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Garis waktu fase tabi'ut tabi'in</h2>
		<div class="mt-4 grid gap-4">
			{#each timeline as item}
				<article class="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 md:grid-cols-[8rem_1fr]">
					<p class="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">{item.period}</p>
					<div>
						<h3 class="text-lg font-semibold text-slate-900">{item.title}</h3>
						<p class="mt-2 text-sm leading-7 text-slate-700">{item.desc}</p>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-teal-200 bg-white p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Peta pusat ilmu abad kedua Hijriyah</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each centerProfiles as center}
				<article class="rounded-2xl border border-teal-100 bg-gradient-to-br from-white to-teal-50 p-5">
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">{center.name}</p>
					<h3 class="mt-3 text-lg font-semibold text-slate-900">{center.focus}</h3>
					<p class="mt-3 text-sm leading-7 text-slate-600">{center.desc}</p>
				</article>
			{/each}
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

	<section class="rounded-[1.75rem] border border-teal-200 bg-white p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Bidang yang mulai matang</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each codificationCards as card}
				<article class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
					<h3 class="text-lg font-semibold text-slate-900">{card.title}</h3>
					<p class="mt-3 text-sm leading-7 text-slate-600">{card.desc}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Jalur menuju mazhab dan kitab besar</h2>
		<div class="mt-4 grid gap-3 md:grid-cols-2">
			{#each bridgeNotes as note}
				<div class="rounded-2xl border border-cyan-100 bg-white p-4 text-sm leading-7 text-slate-700">
					{note}
				</div>
			{/each}
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Adab membaca generasi tabi'ut tabi'in</h2>
		<div class="mt-4 grid gap-3 md:grid-cols-2">
			{#each adabNotes as note}
				<div class="rounded-2xl border border-emerald-100 bg-white p-4 text-sm leading-7 text-slate-700">
					{note}
				</div>
			{/each}
		</div>
	</section>
</div>
