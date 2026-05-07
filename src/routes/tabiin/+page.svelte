<script lang="ts">
	import { tabiinFigures } from '$lib/data/tabiin';

	const centers = Array.from(new Set(tabiinFigures.map((figure) => figure.center)));
	const tabiinTimeline = [
		{
			period: '11-40 H',
			title: 'Murid langsung para sahabat senior',
			desc: 'Generasi awal tabi\'in tumbuh ketika Abu Bakar, Umar, Utsman, Ali, Aisyah, Ibn Abbas, Ibn Umar, Abu Hurairah, Anas, dan sahabat besar lain masih menjadi rujukan umat.'
		},
		{
			period: '40-73 H',
			title: 'Masa fitnah dan penguatan sanad',
			desc: 'Peristiwa politik besar membuat ulama tabi\'in makin berhati-hati dalam menerima riwayat. Dari sinilah kesadaran bertanya tentang sanad menjadi lebih kuat.'
		},
		{
			period: '60-100 H',
			title: 'Munculnya madrasah kota',
			desc: 'Madinah, Makkah, Kufah, Basrah, Syam, dan Yaman menjadi pusat fatwa. Setiap kota punya corak sesuai sahabat yang tinggal dan mengajar di sana.'
		},
		{
			period: '90-120 H',
			title: 'Peralihan menuju kodifikasi',
			desc: 'Murid-murid tabi\'in mulai menulis, mengumpulkan atsar, dan menyusun bahan yang kelak menjadi pondasi kitab hadis, tafsir, fiqih, serta sirah.'
		}
	];
	const centerProfiles = [
		{
			name: 'Madinah',
			focus: 'Fiqih sahabat, hadis keluarga Nabi, amal penduduk Madinah',
			desc: 'Madinah menjaga memori paling dekat dengan kehidupan Rasulullah SAW. Banyak tabi\'in Madinah belajar dari Aisyah, Abu Hurairah, Ibn Umar, dan sahabat senior lain.'
		},
		{
			name: 'Makkah',
			focus: 'Tafsir, manasik haji, riwayat Ibn Abbas',
			desc: 'Makkah kuat dalam tafsir dan manasik. Jalur Ibn Abbas, Ata\', Tawus, dan Amr ibn Dinar menjadi poros penting bagi generasi setelahnya.'
		},
		{
			name: 'Kufah',
			focus: 'Qadha, fiqih masyarakat, riwayat Ali dan Ibn Mas\'ud',
			desc: 'Kufah menjadi kota ilmu yang hidup dengan persoalan hukum, qadha, dan debat sosial. Corak Irak kelak berpengaruh besar pada fiqih ra\'y dan mazhab Hanafi.'
		},
		{
			name: 'Basrah',
			focus: 'Hadis, zuhud, nasihat, bahasa Arab',
			desc: 'Basrah melahirkan tradisi nasihat, tazkiyah, dan ketelitian riwayat. Hasan al-Basri dan Ibn Sirin menjadi dua wajah penting ilmu dan akhlak kota ini.'
		},
		{
			name: 'Yaman - Makkah',
			focus: 'Tafsir Ibn Abbas, zuhud, dan jaringan selatan Arab',
			desc: 'Yaman terhubung dengan Makkah melalui murid Ibn Abbas seperti Tawus. Jaringan ini membawa tafsir dan adab ibadah ke wilayah selatan.'
		}
	];
	const disciplineCards = [
		{
			title: 'Hadis dan sanad',
			desc: 'Tabi\'in belajar langsung dari sahabat, lalu mengajarkan riwayat dengan mulai menekankan identitas perawi dan kesinambungan sanad.'
		},
		{
			title: 'Fiqih dan fatwa',
			desc: 'Mereka menjawab masalah baru di kota-kota Islam dengan merujuk Al-Qur\'an, sunnah, fatwa sahabat, dan praktik masyarakat ilmu.'
		},
		{
			title: 'Tafsir Al-Qur\'an',
			desc: 'Jalur Ibn Abbas, Ibn Mas\'ud, Ubay bin Ka\'ab, dan Ali bin Abi Thalib diteruskan oleh murid-murid tabi\'in di berbagai kota.'
		},
		{
			title: 'Zuhud dan tazkiyah',
			desc: 'Kehidupan generasi ini menekankan takut kepada Allah, adab lisan, kesederhanaan, dan kritik moral terhadap ketidakadilan.'
		},
		{
			title: 'Sirah dan maghazi',
			desc: 'Sebagian tabi\'in menjaga detail kehidupan Nabi, perang, hijrah, dan riwayat keluarga Rasulullah SAW dari para saksi pertama.'
		},
		{
			title: 'Bahasa dan qira\'ah',
			desc: 'Mereka hidup dekat dengan fase awal pembacaan Al-Qur\'an, pengajaran bahasa Arab, dan kebutuhan menjaga makna wahyu.'
		}
	];
	const adabNotes = [
		'Membaca tabi\'in sebagai jembatan, bukan pengganti sahabat. Mereka kuat karena belajar dari generasi sahabat.',
		'Melihat perbedaan fatwa sebagai hasil kota, guru, riwayat, dan persoalan masyarakat yang berbeda.',
		'Mengambil teladan wara, adab fatwa, ketelitian sanad, dan keberanian menasihati penguasa.',
		'Tidak memaksakan satu tokoh mewakili seluruh generasi, karena setiap pusat ilmu punya corak sendiri.'
	];
</script>

<svelte:head>
	<title>Tabi'in - Santri Online</title>
</svelte:head>

<div class="space-y-8">
	<section class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-950 via-orange-900 to-rose-900 px-6 py-10 text-white shadow-xl md:px-8">
		<div class="absolute -left-16 top-8 h-44 w-44 rounded-full bg-amber-300/10 blur-3xl"></div>
		<div class="absolute -right-20 bottom-0 h-52 w-52 rounded-full bg-rose-300/10 blur-3xl"></div>
		<div class="relative max-w-4xl">
			<p class="text-xs uppercase tracking-[0.35em] text-amber-200/70">Generasi Tabi'in</p>
			<h1 class="mt-3 text-3xl font-bold md:text-5xl">Murid para sahabat dan penguat fondasi ilmu</h1>
			<p class="mt-4 text-sm leading-7 text-white/75 md:text-base">
				Tabi'in adalah generasi yang bertemu sahabat Nabi dan belajar langsung dari mereka. Dari Madinah,
				Makkah, Kufah, hingga Basrah, mereka menyalurkan hadis, fiqih, tafsir, dan adab ke generasi sesudahnya.
			</p>
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-amber-200 bg-white p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Struktur sejarah</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-3">
			<div class="rounded-3xl bg-amber-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">Posisi</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">Generasi setelah sahabat dan sebelum tabi'ut tabi'in.</p>
			</div>
			<div class="rounded-3xl bg-orange-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-orange-700">Pusat</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">Madinah, Makkah, Kufah, Basrah, dan Yaman menjadi simpul utama.</p>
			</div>
			<div class="rounded-3xl bg-rose-50 p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.25em] text-rose-700">Warisan</p>
				<p class="mt-3 text-sm leading-7 text-slate-700">Menjaga sanad, memperkuat fatwa, dan memulai pemetaan disiplin ilmu Islam.</p>
			</div>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
		<div class="rounded-[1.75rem] border border-orange-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.28em] text-orange-700">Definisi</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">Siapa yang disebut tabi'in?</h2>
			<div class="mt-4 space-y-3 text-sm leading-7 text-slate-700">
				<p>
					Tabi'in adalah generasi Muslim yang bertemu sahabat Nabi dalam keadaan beriman dan wafat
					di atas Islam. Mereka tidak bertemu Rasulullah SAW secara langsung, tetapi menerima Al-Qur'an,
					sunnah, fatwa, dan adab dari para sahabat.
				</p>
				<p>
					Keutamaan generasi ini terletak pada kedekatan sanad. Mereka masih menyaksikan jejak masyarakat
					Madinah, Makkah, Kufah, Basrah, Syam, dan Yaman yang dibentuk langsung oleh para sahabat.
				</p>
			</div>
		</div>

		<div class="rounded-[1.75rem] border border-rose-200 bg-white p-6 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.28em] text-rose-700">Tugas Sejarah</p>
			<h2 class="mt-3 text-2xl font-semibold text-slate-900">Jembatan dari saksi wahyu ke kitab</h2>
			<p class="mt-4 text-sm leading-7 text-slate-700">
				Pada generasi sahabat, ilmu banyak hidup dalam hafalan, majelis, dan praktik langsung. Pada generasi
				tabi'in, ilmu mulai dipetakan menurut guru, kota, bab ibadah, riwayat hukum, dan persoalan masyarakat.
				Dari sini lahir bahan mentah bagi kitab-kitab hadis, tafsir, fiqih, sirah, dan tazkiyah.
			</p>
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-amber-200 bg-white p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Garis waktu generasi tabi'in</h2>
		<div class="mt-4 grid gap-4">
			{#each tabiinTimeline as item}
				<article class="grid gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-5 md:grid-cols-[8rem_1fr]">
					<p class="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">{item.period}</p>
					<div>
						<h3 class="text-lg font-semibold text-slate-900">{item.title}</h3>
						<p class="mt-2 text-sm leading-7 text-slate-700">{item.desc}</p>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-orange-200 bg-white p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Peta pusat ilmu tabi'in</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each centerProfiles as center}
				<article class="rounded-2xl border border-orange-100 bg-gradient-to-br from-white to-orange-50 p-5">
					<p class="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">{center.name}</p>
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
					{tabiinFigures.filter((figure) => figure.center === center).length} tokoh utama
				</p>
			</div>

			<div class="grid gap-6 lg:grid-cols-2">
				{#each tabiinFigures.filter((figure) => figure.center === center) as figure}
					<article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
						<div class="flex flex-wrap items-center gap-2">
							<span class="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
								{figure.era}
							</span>
							<span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
								{figure.focus}
							</span>
						</div>
						<h3 class="mt-4 text-2xl font-semibold text-slate-900">{figure.name}</h3>
						<p class="mt-2 text-sm font-medium text-amber-700">{figure.role}</p>
						<p class="mt-4 text-sm leading-7 text-slate-600">{figure.summary}</p>

						<div class="mt-5 grid gap-4 md:grid-cols-2">
							<div class="rounded-2xl bg-slate-50 p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Guru Sahabat</p>
								<p class="mt-3 text-sm leading-7 text-slate-700">{figure.teachers.join(', ')}</p>
							</div>
							<div class="rounded-2xl bg-slate-50 p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Murid Utama</p>
								<p class="mt-3 text-sm leading-7 text-slate-700">{figure.students.join(', ')}</p>
							</div>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/each}

	<section class="rounded-[1.75rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Kenapa generasi ini penting</h2>
		<p class="mt-4 text-sm leading-7 text-slate-700">
			Dalam sejarah Islam, tabi'in adalah generasi yang paling awal merapikan transfer ilmu setelah
			wafatnya para sahabat. Dari mereka lahir pusat-pusat fatwa lokal, jalur sanad hadis yang kuat,
			serta tradisi adab dan zuhud yang kemudian diwarisi generasi tabi'ut tabi'in dan para imam mazhab.
		</p>
	</section>

	<section class="rounded-[1.75rem] border border-orange-200 bg-white p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Warisan ilmu yang mereka kuatkan</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each disciplineCards as card}
				<article class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
					<h3 class="text-lg font-semibold text-slate-900">{card.title}</h3>
					<p class="mt-3 text-sm leading-7 text-slate-600">{card.desc}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-6 shadow-sm">
		<h2 class="text-2xl font-semibold text-slate-900">Adab membaca generasi tabi'in</h2>
		<div class="mt-4 grid gap-3 md:grid-cols-2">
			{#each adabNotes as note}
				<div class="rounded-2xl border border-rose-100 bg-white p-4 text-sm leading-7 text-slate-700">
					{note}
				</div>
			{/each}
		</div>
	</section>
</div>
