<script lang="ts">
	import { ulama } from '$lib/data/ulama';

	const walisongo = [
		{
			slug: 'sunan-gresik',
			num: '1️⃣',
			name: 'Sunan Gresik',
			desc: 'Maulana Malik Ibrahim — Gresik',
			classes: {
				border: 'border-emerald-300',
				text: 'text-emerald-700',
				hover: 'group-hover:text-emerald-800'
			}
		},
		{
			slug: 'sunan-ampel',
			num: '2️⃣',
			name: 'Sunan Ampel',
			desc: 'Raden Rahmat — Surabaya',
			classes: {
				border: 'border-blue-300',
				text: 'text-blue-700',
				hover: 'group-hover:text-blue-800'
			}
		},
		{
			slug: 'sunan-bonang',
			num: '3️⃣',
			name: 'Sunan Bonang',
			desc: 'Makhdum Ibrahim — Tuban',
			classes: {
				border: 'border-purple-300',
				text: 'text-purple-700',
				hover: 'group-hover:text-purple-800'
			}
		},
		{
			slug: 'sunan-drajat',
			num: '4️⃣',
			name: 'Sunan Drajat',
			desc: 'Raden Qasim — Lamongan',
			classes: {
				border: 'border-amber-300',
				text: 'text-amber-700',
				hover: 'group-hover:text-amber-800'
			}
		},
		{
			slug: 'sunan-kudus',
			num: '5️⃣',
			name: 'Sunan Kudus',
			desc: "Ja'far Shadiq — Kudus",
			classes: {
				border: 'border-rose-300',
				text: 'text-rose-700',
				hover: 'group-hover:text-rose-800'
			}
		},
		{
			slug: 'sunan-kalijaga',
			num: '6️⃣',
			name: 'Sunan Kalijaga',
			desc: 'Raden Said — Demak',
			classes: {
				border: 'border-indigo-300',
				text: 'text-indigo-700',
				hover: 'group-hover:text-indigo-800'
			}
		},
		{
			slug: 'sunan-muria',
			num: '7️⃣',
			name: 'Sunan Muria',
			desc: 'Raden Umar Said — Muria',
			classes: {
				border: 'border-teal-300',
				text: 'text-teal-700',
				hover: 'group-hover:text-teal-800'
			}
		},
		{
			slug: 'sunan-giri',
			num: '8️⃣',
			name: 'Sunan Giri',
			desc: 'Raden Paku — Giri',
			classes: {
				border: 'border-green-300',
				text: 'text-green-700',
				hover: 'group-hover:text-green-800'
			}
		},
		{
			slug: 'sunan-gunung-jati',
			num: '9️⃣',
			name: 'Sunan Gunung Jati',
			desc: 'Syarif Hidayatullah — Cirebon',
			classes: {
				border: 'border-cyan-300',
				text: 'text-cyan-700',
				hover: 'group-hover:text-cyan-800'
			}
		}
	];
</script>

<svelte:head>
	<title>Jaringan Ulama & Wali</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 py-12">
	<div class="max-w-6xl mx-auto px-4">
		<!-- Hero -->
		<div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-8 md:p-12 text-white shadow-2xl mb-12">
			<div class="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10">
				<span class="text-6xl mb-4 block">🎓</span>
				<h1 class="text-4xl md:text-5xl font-bold mb-4">Jaringan Ulama & Wali</h1>
				<p class="text-xl md:text-2xl opacity-90 mb-6">Rantai Sanad Ahlussunnah wal Jama'ah</p>
				<p class="text-lg opacity-80 max-w-3xl">
					Dari Madinah ke Baghdad, Damaskus, Mesir, Hadramaut, hingga Jawa melalui Walisongo, sanad dakwah Aswaja bersambung kepada para sahabat, tabi'in, tabi'ut tabi'in, dan ulama masa kini.
				</p>
			</div>
		</div>

		<!-- Ulama Grid -->
		<div class="mb-12">
			<h2 class="text-3xl font-bold text-gray-900 mb-6 text-center">Ulama Besar Ahlussunnah</h2>
			<div class="grid grid-cols-1 gap-6">
				{#each ulama as guru}
					<a href={`/ulama/${guru.slug}`} class="group relative overflow-hidden rounded-2xl border-2 border-teal-200 bg-white p-6 shadow-lg transition hover:scale-105 hover:shadow-2xl">
						<div class="absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 opacity-50 blur-2xl"></div>
						<div class="relative">
							<span class="inline-block bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
								{guru.era}
							</span>
							<h2 class="text-xl font-bold text-teal-700 mb-2 group-hover:text-teal-800">{guru.nama}</h2>
							<p class="text-sm text-gray-600 mb-3">📍 {guru.region}</p>
							<p class="text-gray-700 mb-4 line-clamp-3">{guru.legacy}</p>
							<span class="inline-flex items-center gap-2 text-teal-600 font-semibold group-hover:gap-3 transition-all">
								Baca Kisah →
							</span>
						</div>
					</a>
				{/each}
			</div>
		</div>

		<!-- Info Box -->
		<div class="rounded-3xl border-2 border-teal-200 bg-white p-8 shadow-xl mb-12">
			<h3 class="text-2xl font-bold text-gray-900 mb-4">🌟 Mengapa Mereka Panutan Aswaja?</h3>
			<div class="space-y-4 text-gray-700">
				<p>Para imam mazhab dan ulama besar ini menjaga sanad aqidah Asy'ari-Maturidi, fiqih empat mazhab, dan tasawuf Al-Ghazali. Kajian mereka menjadi fondasi kurikulum pesantren di Nusantara dan diakui di seluruh dunia Islam.</p>
				<p>Klik salah satu nama di atas untuk membaca kisah singkat dan kontribusi mereka bagi Ahlussunnah wal Jama'ah.</p>
			</div>
		</div>

		<!-- Walisongo Section -->
		<div class="rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 shadow-xl mb-12">
			<div class="flex items-center gap-3 mb-6">
				<span class="text-4xl">🕌</span>
				<div>
					<h2 class="text-3xl font-bold text-emerald-800">Jejak Walisongo di Tanah Jawa</h2>
					<p class="text-gray-700">9 Wali penyebar Islam dengan pendekatan budaya, seni, dan kearifan lokal</p>
				</div>
			</div>
			
			<div class="grid grid-cols-1 gap-4 mb-6">
				{#each walisongo as wali}
					<a href={`/walisongo/${wali.slug}`} class={`group rounded-2xl border-2 ${wali.classes.border} bg-white p-5 shadow-sm transition hover:scale-105 hover:shadow-xl`}>
						<span class="text-3xl mb-2 block">{wali.num}</span>
						<h3 class={`text-lg font-bold ${wali.classes.text} ${wali.classes.hover}`}>{wali.name}</h3>
						<p class="text-sm text-gray-600 mt-1">{wali.desc}</p>
					</a>
				{/each}
			</div>

			<div class="flex justify-center">
				<a href="/walisongo" class="btn bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg">
					📖 Lihat Pembahasan Lengkap Walisongo
				</a>
			</div>
		</div>

		<!-- Hadramaut Section -->
		<div class="rounded-3xl border-2 border-amber-200 bg-white p-8 shadow-xl mb-12">
			<div class="flex items-center gap-3 mb-6">
				<span class="text-4xl">🌙</span>
				<div>
					<h2 class="text-3xl font-bold text-amber-800">Habaib Hadramaut di Jawa</h2>
					<p class="text-gray-700">Ulama dari Yaman yang memperkuat dakwah di pesisir dan pesantren Nusantara</p>
				</div>
			</div>
			<div class="grid grid-cols-1 gap-4">
				{#each [
					{ name: 'Habib Husain bin Abu Bakar Alaydrus', desc: 'Luar Batang, Batavia (1797–1871). Ulama Hadramaut yang berdakwah di pelabuhan.' },
					{ name: 'Habib Ali bin Abdurrahman Al-Habsyi', desc: 'Jakarta (1870–1968). Mendirikan majelis ilmu rujukan ulama Jawa.' },
					{ name: 'Habib Abdullah bin Muhsin Al-Attas', desc: 'Bogor (1840–1914). Dzikir dan pengajaran tasawuf Alawiyyin.' },
					{ name: 'Habib Umar bin Hud Al-Attas', desc: 'Somalangu (abad 19). Menghidupkan pesantren Al-Kahfi.' },
					{ name: 'Habib Umar bin Hafidz', desc: 'Tarim (l. 1963). Dakwah manhaj Hadramaut ke Nusantara.' },
					{ name: 'Habib Luthfi bin Yahya', desc: 'Pekalongan (l. 1949). Trah Ba\'Alawi, rujukan dzikir dan kebangsaan.' }
				] as habib}
					<div class="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 border-2 border-amber-200">
						<h3 class="text-lg font-bold text-amber-800 mb-2">{habib.name}</h3>
						<p class="text-sm text-gray-700">{habib.desc}</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- Baghdad Section -->
		<div class="rounded-3xl border-2 border-purple-200 bg-white p-8 shadow-xl mb-12">
			<div class="flex items-center gap-3 mb-6">
				<span class="text-4xl">🏛️</span>
				<div>
					<h2 class="text-3xl font-bold text-purple-800">Ulama Baghdad</h2>
					<p class="text-gray-700">Poros ilmu fiqih, hadis, dan tasawuf di era Abbasiyah</p>
				</div>
			</div>
			<div class="grid grid-cols-1 gap-4">
				{#each [
					{ name: 'Imam Abu Hanifah', desc: '699–767 M. Pendiri mazhab Hanafi, Baghdad.' },
					{ name: 'Imam Ahmad bin Hanbal', desc: '780–855 M. Ulama hadis dan fiqih, Baghdad.' },
					{ name: 'Imam Al-Ghazali', desc: '1058–1111 M. Mengajar di Nizamiyyah Baghdad, hujjat al-Islam.' }
				] as imam}
					<div class="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-5 border-2 border-purple-200">
						<h3 class="text-lg font-bold text-purple-800 mb-2">{imam.name}</h3>
						<p class="text-sm text-gray-700">{imam.desc}</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- Damaskus Section -->
		<div class="rounded-3xl border-2 border-blue-200 bg-white p-8 shadow-xl mb-12">
			<div class="flex items-center gap-3 mb-6">
				<span class="text-4xl">🕌</span>
				<div>
					<h2 class="text-3xl font-bold text-blue-800">Ulama Damaskus</h2>
					<p class="text-gray-700">Kota madrasah Syafiiyah dan pusat periwayatan hadis</p>
				</div>
			</div>
			<div class="grid grid-cols-1 gap-4">
				{#each [
					{ name: 'Imam An-Nawawi', desc: '1230–1277 M. Damaskus, penulis Riyadhus Shalihin & Al-Majmu\'.' },
					{ name: 'Imam Ibnu Asakir', desc: '1105–1176 M. Damaskus, penulis Tarikh Dimasyq.' },
					{ name: 'Imam Al-Buthi', desc: '1929–2013 M. Damaskus, pengajar fiqih Syafi\'i & akidah Asy\'ariyah.' }
				] as imam}
					<div class="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-5 border-2 border-blue-200">
						<h3 class="text-lg font-bold text-blue-800 mb-2">{imam.name}</h3>
						<p class="text-sm text-gray-700">{imam.desc}</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- Mesir Section -->
		<div class="rounded-3xl border-2 border-green-200 bg-white p-8 shadow-xl">
			<div class="flex items-center gap-3 mb-6">
				<span class="text-4xl">🏺</span>
				<div>
					<h2 class="text-3xl font-bold text-green-800">Ulama Mesir</h2>
					<p class="text-gray-700">Tradisi Al-Azhar menguatkan Aswaja di Afrika–Asia</p>
				</div>
			</div>
			<div class="grid grid-cols-1 gap-4">
				{#each [
					{ name: 'Imam Jalaluddin As-Suyuthi', desc: '1445–1505 M. Kairo, pakar tafsir, hadis, dan fiqih Syafi\'i.' },
					{ name: 'Imam Ibnu Hajar Al-Haitami', desc: '1503–1566 M. Mesir/Makkah; rujukan fiqih Syafi\'i, Tuhfatul Muhtaj.' },
					{ name: 'Syekh Muhammad Abduh', desc: '1849–1905 M. Kairo, ulama Azhar yang membangkitkan reformasi pendidikan.' }
				] as imam}
					<div class="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-5 border-2 border-green-200">
						<h3 class="text-lg font-bold text-green-800 mb-2">{imam.name}</h3>
						<p class="text-sm text-gray-700">{imam.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
