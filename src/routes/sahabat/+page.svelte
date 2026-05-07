<script lang="ts">
	const historyTimeline = [
		{
			period: '610-615 M',
			title: 'Dakwah awal di Makkah',
			desc: 'Sahabat pertama menerima Islam dalam tekanan Quraisy. Dari rumah al-Arqam, mereka belajar tauhid, Al-Qur\'an, sabar, dan keberanian menyampaikan kebenaran.'
		},
		{
			period: '615-622 M',
			title: 'Hijrah ke Habasyah dan Madinah',
			desc: 'Sebagian sahabat berhijrah ke Habasyah untuk menjaga iman. Setelah Baiat Aqabah, kaum Anshar membuka Madinah sebagai tempat tumbuhnya masyarakat Islam.'
		},
		{
			period: '2 H',
			title: 'Badar',
			desc: 'Sekitar 313 sahabat ikut perang Badar dengan persiapan terbatas. Peristiwa ini menjadi tanda kokohnya iman generasi awal dan pertolongan Allah kepada kaum Muslimin.'
		},
		{
			period: '3-5 H',
			title: 'Uhud dan Khandaq',
			desc: 'Sahabat belajar tentang disiplin, ketaatan, strategi, luka kekalahan, serta kesabaran menjaga Madinah dari koalisi besar Quraisy dan sekutunya.'
		},
		{
			period: '6 H',
			title: 'Hudaibiyah dan Baiat Ridwan',
			desc: 'Perjanjian Hudaibiyah tampak berat di awal, tetapi membuka jalan dakwah lebih luas. Para sahabat yang berbaiat di bawah pohon mendapat kedudukan khusus dalam riwayat.'
		},
		{
			period: '8-10 H',
			title: 'Fathu Makkah dan Haji Wada',
			desc: 'Makkah kembali ke tauhid tanpa pembalasan massal. Pada Haji Wada, sahabat menerima pesan akhir tentang darah, harta, amanah, perempuan, dan pegangan kepada wahyu.'
		},
		{
			period: '11-40 H',
			title: 'Masa Khulafaur Rasyidin',
			desc: 'Sahabat menata negara, menjaga mushaf, mengirim guru ke wilayah baru, membangun administrasi, dan menghadapi masa fitnah dengan ijtihad masing-masing.'
		}
	];

	const companionGroups = [
		{
			name: 'Muhajirin',
			desc: 'Sahabat yang hijrah dari Makkah, meninggalkan harta dan kampung halaman demi menjaga iman dan mengikuti Rasulullah SAW.'
		},
		{
			name: 'Anshar',
			desc: 'Penduduk Madinah yang menolong Nabi dan kaum Muhajirin. Mereka menjadi contoh itsar, persaudaraan, dan pembelaan terhadap dakwah.'
		},
		{
			name: 'Ahlul Badr',
			desc: 'Sahabat yang ikut Badar. Jumlah mereka masyhur sekitar 313 orang, meski rincian angka dalam kitab sirah bisa berbeda karena cara menghitung.'
		},
		{
			name: 'Ahlu Baiat Ridwan',
			desc: 'Sahabat yang berbaiat di Hudaibiyah. Mereka dikenal karena keteguhan membela Rasulullah SAW saat kabar Utsman tertahan di Makkah.'
		},
		{
			name: 'Ashab Suffah',
			desc: 'Sahabat yang tinggal di serambi Masjid Nabawi untuk fokus belajar, beribadah, dan menerima pendidikan langsung dari Nabi.'
		},
		{
			name: 'Ummahatul Mukminin',
			desc: 'Para istri Nabi yang menjadi ibu kaum mukminin dan sumber penting hadis, fiqih keluarga, adab, serta kehidupan pribadi Rasulullah SAW.'
		}
	];

	const notableCompanions = [
		{ name: 'Khadijah binti Khuwailid', role: 'Pendukung pertama dakwah dan istri Nabi yang paling awal beriman.' },
		{ name: 'Hamzah bin Abdul Muthalib', role: 'Paman Nabi, syahid Uhud, dan simbol keberanian membela Islam.' },
		{ name: 'Bilal bin Rabah', role: 'Muadzin Rasulullah dan teladan keteguhan tauhid saat disiksa di Makkah.' },
		{ name: 'Mus\'ab bin Umair', role: 'Duta dakwah pertama ke Madinah dan syahid Uhud.' },
		{ name: 'Abu Ubaidah bin Jarrah', role: 'Aminul ummah, panglima terpercaya dalam ekspedisi Syam.' },
		{ name: 'Salman al-Farisi', role: 'Pencari kebenaran dari Persia dan pengusul strategi parit pada Khandaq.' },
		{ name: 'Abdullah bin Mas\'ud', role: 'Ahli Al-Qur\'an, fiqih, dan guru besar jalur ilmu Kufah.' },
		{ name: 'Aisyah binti Abu Bakar', role: 'Ummul Mukminin, perawi besar, dan rujukan fiqih rumah tangga Nabi.' },
		{ name: 'Zaid bin Tsabit', role: 'Penulis wahyu dan tokoh penting pengumpulan mushaf.' },
		{ name: 'Mu\'adz bin Jabal', role: 'Ahli halal-haram dan guru yang diutus Nabi ke Yaman.' },
		{ name: 'Abu Hurairah', role: 'Perawi hadis terbanyak dan penjaga banyak riwayat harian Nabi.' },
		{ name: 'Sa\'d bin Mu\'adz', role: 'Pemimpin Anshar Aus yang besar jasanya dalam pembelaan Madinah.' }
	];

	const knowledgeRoles = [
		'Menjaga bacaan dan hafalan Al-Qur\'an dari Rasulullah SAW.',
		'Meriwayatkan hadis, sunnah amaliyah, keputusan hukum, dan adab Nabi.',
		'Mengajarkan fiqih ke pusat ilmu seperti Madinah, Makkah, Kufah, Basrah, Syam, Mesir, dan Yaman.',
		'Menjadi teladan ijtihad, musyawarah, kepemimpinan, zuhud, keberanian, dan kepedulian sosial.',
		'Menghubungkan generasi tabi\'in dengan sumber pertama wahyu dan sunnah.'
	];

	const adabNotes = [
		'Membaca sejarah sahabat dengan ilmu, bukan dengan kebencian.',
		'Membedakan antara kemuliaan generasi sahabat dan fakta bahwa mereka tetap manusia yang berijtihad.',
		'Menghindari cercaan kepada sahabat, Ahlul Bait, dan generasi awal Islam.',
		'Menyerahkan perkara fitnah besar kepada kajian ulama yang adil, teliti, dan menjaga lisan.',
		'Mengambil pelajaran akhlak: sidik, amanah, itsar, sabar, syura, dan pengorbanan.'
	];
</script>

<svelte:head>
	<title>Sahabat Rasulullah ﷺ</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12">
	<div class="max-w-6xl mx-auto px-4">
		<!-- Hero -->
		<div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 p-8 md:p-12 text-white shadow-2xl mb-12">
			<div class="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10">
				<span class="text-6xl mb-4 block">⭐</span>
				<h1 class="text-4xl md:text-5xl font-bold mb-4">Sahabat Rasulullah ﷺ</h1>
				<p class="text-xl md:text-2xl opacity-90 mb-6">Generasi Emas Penjaga Risalah</p>
				<p class="text-lg opacity-80 max-w-3xl">Sahabat adalah saksi wahyu, pembawa amanah dakwah, dan penjaga sanad ilmu. Dari Mekah, Madinah, sampai gelanggang Badar, mereka menyiarkan Islam ke penjuru dunia.</p>
			</div>
		</div>

		<!-- Definisi dan Kedudukan -->
		<div class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] mb-12">
			<section class="rounded-3xl border-2 border-amber-200 bg-white p-8 shadow-xl">
				<p class="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600 mb-3">Definisi</p>
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Siapa yang disebut sahabat?</h2>
				<div class="space-y-4 text-gray-700 leading-relaxed">
					<p>
						Dalam istilah ilmu hadis, sahabat adalah orang yang bertemu Nabi Muhammad SAW dalam keadaan
						beriman kepada beliau dan wafat di atas Islam. Mereka bukan hanya tokoh sejarah, tetapi
						mata rantai pertama yang membawa Al-Qur'an, sunnah, adab ibadah, dan praktik dakwah.
					</p>
					<p>
						Kedudukan sahabat berbeda-beda sesuai keutamaan, ilmu, pengorbanan, dan kedekatan mereka
						dengan Rasulullah SAW. Ada yang masuk Islam sejak awal, ikut hijrah, ikut Badar, ikut
						Baiat Ridwan, menjadi penulis wahyu, perawi hadis, panglima, qadhi, guru Al-Qur'an, dan
						pendidik generasi tabi'in.
					</p>
				</div>
			</section>

			<section class="rounded-3xl border-2 border-orange-200 bg-white p-8 shadow-xl">
				<p class="text-sm font-semibold uppercase tracking-[0.25em] text-orange-600 mb-3">Peran Utama</p>
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Mengapa mereka penting?</h2>
				<ul class="space-y-3 text-gray-700">
					{#each knowledgeRoles as role}
						<li class="flex items-start gap-3">
							<span class="mt-2 h-2 w-2 rounded-full bg-orange-500"></span>
							<span>{role}</span>
						</li>
					{/each}
				</ul>
			</section>
		</div>

		<!-- Khulafaur Rasyidin -->
		<div class="mb-12">
			<div class="flex items-center gap-3 mb-6">
				<span class="text-4xl">👑</span>
				<div>
					<h2 class="text-3xl font-bold text-gray-900">Khulafaur Rasyidin</h2>
					<p class="text-gray-600">Empat khalifah teladan yang menjaga kemurnian syariat</p>
				</div>
			</div>

			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				<a href="/sahabat/abu-bakar" class="group relative overflow-hidden rounded-2xl border-2 border-blue-200 bg-white p-6 shadow-lg transition hover:scale-105 hover:shadow-2xl">
					<div class="absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 opacity-50 blur-2xl"></div>
					<div class="relative">
						<span class="text-4xl mb-3 block">1️⃣</span>
						<h3 class="text-xl font-bold text-blue-700 mb-2">Abu Bakar Ash-Shiddiq</h3>
						<p class="text-sm text-gray-600 mb-3">573–634 M</p>
						<p class="text-gray-700 mb-4 text-sm">Menghimpun Mushaf, menegakkan zakat, memadamkan riddah.</p>
						<span class="inline-flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
							Baca Kisah →
						</span>
					</div>
				</a>

				<a href="/sahabat/umar" class="group relative overflow-hidden rounded-2xl border-2 border-green-200 bg-white p-6 shadow-lg transition hover:scale-105 hover:shadow-2xl">
					<div class="absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 opacity-50 blur-2xl"></div>
					<div class="relative">
						<span class="text-4xl mb-3 block">2️⃣</span>
						<h3 class="text-xl font-bold text-green-700 mb-2">Umar bin Khattab</h3>
						<p class="text-sm text-gray-600 mb-3">584–644 M</p>
						<p class="text-gray-700 mb-4 text-sm">Reformasi administrasi, perluasan Syam & Persia.</p>
						<span class="inline-flex items-center gap-2 text-green-600 font-semibold group-hover:gap-3 transition-all">
							Baca Kisah →
						</span>
					</div>
				</a>

				<a href="/sahabat/utsman" class="group relative overflow-hidden rounded-2xl border-2 border-purple-200 bg-white p-6 shadow-lg transition hover:scale-105 hover:shadow-2xl">
					<div class="absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 opacity-50 blur-2xl"></div>
					<div class="relative">
						<span class="text-4xl mb-3 block">3️⃣</span>
						<h3 class="text-xl font-bold text-purple-700 mb-2">Utsman bin Affan</h3>
						<p class="text-sm text-gray-600 mb-3">576–656 M</p>
						<p class="text-gray-700 mb-4 text-sm">Standarisasi Mushaf Utsmani, dakwah ke Afrika Utara.</p>
						<span class="inline-flex items-center gap-2 text-purple-600 font-semibold group-hover:gap-3 transition-all">
							Baca Kisah →
						</span>
					</div>
				</a>

				<a href="/sahabat/ali" class="group relative overflow-hidden rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-lg transition hover:scale-105 hover:shadow-2xl">
					<div class="absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 opacity-50 blur-2xl"></div>
					<div class="relative">
						<span class="text-4xl mb-3 block">4️⃣</span>
						<h3 class="text-xl font-bold text-amber-700 mb-2">Ali bin Abi Thalib</h3>
						<p class="text-sm text-gray-600 mb-3">600–661 M</p>
						<p class="text-gray-700 mb-4 text-sm">Ilmu, hikmah, dan konsolidasi umat di masa fitnah.</p>
						<span class="inline-flex items-center gap-2 text-amber-600 font-semibold group-hover:gap-3 transition-all">
							Baca Kisah →
						</span>
					</div>
				</a>
			</div>
		</div>

		<!-- Garis Sejarah -->
		<section class="rounded-3xl border-2 border-yellow-200 bg-white p-8 shadow-xl mb-12">
			<div class="flex items-center gap-3 mb-6">
				<span class="text-4xl">📜</span>
				<div>
					<h2 class="text-3xl font-bold text-gray-900">Garis Sejarah Sahabat</h2>
					<p class="text-gray-600">Dari rumah al-Arqam sampai masa Khulafaur Rasyidin</p>
				</div>
			</div>

			<div class="grid gap-4">
				{#each historyTimeline as item}
					<article class="grid gap-3 rounded-2xl border-2 border-yellow-100 bg-yellow-50/70 p-5 md:grid-cols-[8rem_1fr]">
						<p class="text-sm font-bold uppercase tracking-[0.18em] text-amber-700">{item.period}</p>
						<div>
							<h3 class="text-xl font-bold text-gray-900">{item.title}</h3>
							<p class="mt-2 text-gray-700 leading-relaxed">{item.desc}</p>
						</div>
					</article>
				{/each}
			</div>
		</section>

		<!-- Kelompok Sahabat -->
		<section class="rounded-3xl border-2 border-amber-200 bg-white p-8 shadow-xl mb-12">
			<div class="flex items-center gap-3 mb-6">
				<span class="text-4xl">🧭</span>
				<div>
					<h2 class="text-3xl font-bold text-gray-900">Kelompok-Kelompok Sahabat</h2>
					<p class="text-gray-600">Cara ulama membaca kedudukan dan peran generasi awal</p>
				</div>
			</div>

			<div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
				{#each companionGroups as group}
					<article class="rounded-2xl border-2 border-amber-100 bg-gradient-to-br from-white to-amber-50 p-6">
						<h3 class="text-xl font-bold text-gray-900 mb-3">{group.name}</h3>
						<p class="text-gray-700 leading-relaxed">{group.desc}</p>
					</article>
				{/each}
			</div>
		</section>

		<!-- Ahlul Badar -->
		<div class="rounded-3xl border-2 border-amber-200 bg-white p-8 shadow-xl mb-12">
			<div class="flex items-center gap-3 mb-6">
				<span class="text-4xl">⚔️</span>
				<div>
					<h2 class="text-3xl font-bold text-gray-900">313 Ahlul Badr</h2>
					<p class="text-gray-600">Pejuang yang mempertaruhkan jiwa raga melindungi Rasulullah ﷺ</p>
				</div>
			</div>

			<div class="grid gap-6 md:grid-cols-2 mb-6">
				<div class="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 border-2 border-amber-200">
					<h3 class="text-xl font-bold text-gray-900 mb-4">🎯 Garis Besar Perjuangan</h3>
					<ul class="space-y-3 text-gray-700">
						<li class="flex items-start gap-2">
							<span class="text-amber-600">•</span>
							<span>Meninggalkan harta dan keluarga demi hijrah serta membela dakwah</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-amber-600">•</span>
							<span>Bertahan dengan persenjataan terbatas menghadapi pasukan Quraisy</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-amber-600">•</span>
							<span>Berjaga melindungi Rasulullah ﷺ di garis depan dan belakang</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-amber-600">•</span>
							<span>Menjadi pendiri generasi awal guru Al-Qur'an dan pendakwah</span>
						</li>
					</ul>
				</div>

				<div class="rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50 p-6 border-2 border-orange-200">
					<h3 class="text-xl font-bold text-gray-900 mb-4">👥 Nama-Nama Utama</h3>
					<p class="text-gray-700 leading-relaxed">
						Di antara Ahlul Badr: Abu Bakar, Umar, Utsman, Ali, Talhah, Zubair, Abdurrahman bin Auf, Sa'd bin Abi Waqqash, Sa'id bin Zaid, Mus'ab bin Umair, Hamzah bin Abdul Muthalib, Abu Ubaidah bin Jarrah, Bilal bin Rabah, Miqdad bin Amr, dan banyak sahabat Anshar seperti Sa'd bin Mu'adz, Sa'd bin Ubadah, serta As'ad bin Zurarah.
					</p>
				</div>
			</div>

			<div class="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl">
				<p class="text-amber-900">
					<strong>📜 Catatan Sejarah:</strong> Tradisi keilmuan menempatkan Ahlul Badar pada derajat khusus; riwayat menyebut pahala dan doa kemenangan di Badar sebagai bukti ridha Allah atas kesungguhan mereka.
				</p>
			</div>
		</div>

		<!-- Tokoh Sahabat Lain -->
		<section class="rounded-3xl border-2 border-orange-200 bg-white p-8 shadow-xl mb-12">
			<div class="flex items-center gap-3 mb-6">
				<span class="text-4xl">🌿</span>
				<div>
					<h2 class="text-3xl font-bold text-gray-900">Tokoh Sahabat Lain yang Perlu Dikenal</h2>
					<p class="text-gray-600">Ragam peran: keluarga Nabi, perawi, guru, panglima, dan pendakwah</p>
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each notableCompanions as companion}
					<article class="rounded-2xl border-2 border-orange-100 bg-orange-50/60 p-5">
						<h3 class="text-lg font-bold text-gray-900">{companion.name}</h3>
						<p class="mt-2 text-sm leading-7 text-gray-700">{companion.role}</p>
					</article>
				{/each}
			</div>
		</section>

		<!-- Asharah Mubasyarah dan Ilmu -->
		<section class="grid gap-6 lg:grid-cols-2 mb-12">
			<div class="rounded-3xl border-2 border-yellow-200 bg-white p-8 shadow-xl">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Sepuluh yang Dijanjikan Surga</h2>
				<p class="text-gray-700 leading-relaxed mb-4">
					Dalam riwayat masyhur, sepuluh sahabat dikenal dengan sebutan al-asyarah al-mubasyarah:
					Abu Bakar, Umar, Utsman, Ali, Talhah, Zubair, Abdurrahman bin Auf, Sa'd bin Abi Waqqash,
					Sa'id bin Zaid, dan Abu Ubaidah bin Jarrah.
				</p>
				<p class="text-gray-700 leading-relaxed">
					Penyebutan ini tidak berarti hanya mereka yang mulia, tetapi menunjukkan kabar gembira khusus
					kepada tokoh-tokoh yang sangat besar jasanya dalam fase awal Islam.
				</p>
			</div>

			<div class="rounded-3xl border-2 border-amber-200 bg-white p-8 shadow-xl">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Pusat Ilmu Sahabat</h2>
				<p class="text-gray-700 leading-relaxed mb-4">
					Setelah wilayah Islam meluas, para sahabat menyebar sebagai guru. Abdullah bin Umar dan Aisyah
					menjadi rujukan besar di Madinah, Abdullah bin Abbas di Makkah, Abdullah bin Mas'ud di Kufah,
					Abu Musa al-Asy'ari di Basrah, Mu'adz bin Jabal di Yaman, dan banyak sahabat lain di Syam serta Mesir.
				</p>
				<p class="text-gray-700 leading-relaxed">
					Dari majelis mereka lahir generasi tabi'in yang kemudian menjadi fondasi mazhab, tafsir, qira'ah,
					hadis, fiqih, dan adab pesantren.
				</p>
			</div>
		</section>

		<!-- Adab -->
		<section class="rounded-3xl border-2 border-amber-200 bg-white p-8 shadow-xl mb-12">
			<h2 class="text-3xl font-bold text-gray-900 mb-4">Adab Membaca Sejarah Sahabat</h2>
			<div class="grid gap-3 md:grid-cols-2">
				{#each adabNotes as note}
					<div class="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-gray-700">
						{note}
					</div>
				{/each}
			</div>
		</section>

		<!-- Pelajaran -->
		<div class="rounded-3xl border-2 border-amber-200 bg-white p-8 shadow-xl">
			<h3 class="text-2xl font-bold text-gray-900 mb-4">💡 Pelajaran untuk Santri</h3>
			<p class="text-gray-700 leading-relaxed">
				Sahabat Nabi mengajarkan kejujuran, amanah, kesiapan berkorban, dan ilmu yang bersanad. Mereka juga menjadi rujukan adab: mendahulukan ridha Allah, menghormati Rasul, serta menjaga persatuan umat.
			</p>
		</div>
	</div>
</div>
