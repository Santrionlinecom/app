<svelte:head>
	<title>Tentang Kami - Santri Online</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12">
	<div class="max-w-6xl mx-auto px-4">
		<!-- Hero -->
		<div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 md:p-16 text-white shadow-2xl mb-12">
			<div class="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10 text-center">
				<span class="text-6xl mb-4 block">🕌</span>
				<h1 class="text-4xl md:text-5xl font-bold mb-4">Tentang Santri Online</h1>
				<p class="text-xl md:text-2xl opacity-90 italic max-w-3xl mx-auto">
					"Menghubungkan Tradisi Pesantren dengan Masa Depan Digital"
				</p>
			</div>
		</div>

		<!-- Intro -->
		<div class="rounded-3xl border-2 border-emerald-200 bg-white p-8 shadow-xl mb-12">
			<p class="text-lg text-gray-700 leading-relaxed mb-4">
				<strong>Assalamualaikum Warahmatullahi Wabarakatuh.</strong>
			</p>
			<p class="text-gray-700 leading-relaxed mb-4">
				Selamat datang di <strong class="text-emerald-600">SantriOnline.com</strong>. Di era di mana informasi bergerak sangat cepat, santri tidak boleh tertinggal. Kami hadir sebagai inisiatif baru untuk menjembatani tradisi keilmuan pesantren dengan kemajuan teknologi modern.
			</p>
			<p class="text-gray-700 leading-relaxed">
				Kami bercita-cita menjadi sebuah <strong>Super App</strong> (aplikasi serba ada) khusus untuk ekosistem santri berlandaskan pemahaman <strong>Ahlussunnah wal Jama'ah</strong>.
			</p>
		</div>

		<!-- Visi Misi -->
		<div class="grid gap-8 md:grid-cols-2 mb-12">
			<div class="rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-8 shadow-xl">
				<div class="flex items-center gap-3 mb-6">
					<span class="text-5xl">🎯</span>
					<h2 class="text-3xl font-bold text-blue-800">Visi Kami</h2>
				</div>
				<p class="text-gray-700 leading-relaxed italic">
					"Menjadi ekosistem digital rujukan utama bagi generasi santri yang berwawasan global, melek teknologi, namun tetap teguh berpegang pada akhlak karimah dan akidah Ahlussunnah wal Jama'ah."
				</p>
			</div>

			<div class="rounded-3xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-8 shadow-xl">
				<div class="flex items-center gap-3 mb-6">
					<span class="text-5xl">🚀</span>
					<h2 class="text-3xl font-bold text-purple-800">Misi Kami</h2>
				</div>
				<ul class="space-y-3 text-gray-700">
					<li class="flex items-start gap-2">
						<span class="text-purple-600 font-bold">•</span>
						<span><strong>Edukasi Bersanad:</strong> Konten valid dari ulama mu'tabar</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-purple-600 font-bold">•</span>
						<span><strong>Benteng Digital:</strong> Islam Wasathiyah anti-radikalisme</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-purple-600 font-bold">•</span>
						<span><strong>Teknologi Terdepan:</strong> Akses cepat dan mudah</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-purple-600 font-bold">•</span>
						<span><strong>Kemandirian Umat:</strong> Ekonomi santri digital</span>
					</li>
				</ul>
			</div>
		</div>

		<!-- Features Grid -->
		<div class="mb-12">
			<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">✨ Fitur Unggulan</h2>
			<div class="grid gap-6 md:grid-cols-3">
				{#each [
					{ icon: '📖', title: 'Kisah 25 Nabi', desc: 'Pelajari perjalanan para nabi dengan dalil Al-Quran', link: '/nabi' },
					{ icon: '⭐', title: 'Sahabat Rasul', desc: 'Khulafaur Rasyidin dan Ahlul Badar', link: '/sahabat' },
					{ icon: '🎓', title: 'Jaringan Ulama', desc: 'Dari Baghdad, Damaskus, Mesir hingga Walisongo', link: '/ulama' },
					{ icon: '🕌', title: 'Walisongo', desc: '9 Wali penyebar Islam di Tanah Jawa', link: '/walisongo' },
					{ icon: '📚', title: 'Kitab Turats', desc: 'Kitab dasar pesantren Ahlussunnah', link: '/kitab' },
					{ icon: '📅', title: 'Kalender Pasaran', desc: 'Kalender Hijriyah dengan pasaran Jawa', link: '/kalender' }
				] as feature}
					<a href={feature.link} class="group rounded-2xl border-2 border-emerald-200 bg-white p-6 shadow-lg transition hover:scale-105 hover:shadow-2xl">
						<span class="text-5xl mb-3 block">{feature.icon}</span>
						<h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600">{feature.title}</h3>
						<p class="text-gray-600">{feature.desc}</p>
					</a>
				{/each}
			</div>
		</div>

		<!-- Developer -->
		<div class="rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8 shadow-xl mb-12">
			<div class="flex items-center gap-3 mb-6">
				<span class="text-5xl">👨‍💻</span>
				<h2 class="text-3xl font-bold text-amber-800">Di Balik Layar</h2>
			</div>
			<p class="text-gray-700 leading-relaxed mb-4">
				Platform ini dikembangkan oleh <a href="https://www.facebook.com/yogikpratamaisabuzaid/" target="_blank" rel="noreferrer" class="font-bold text-amber-700 hover:underline">Yogik Pratama</a>. Berlandaskan nilai Aswaja dan didukung teknologi modern yang aman dan ringan, kami berupaya memberikan yang terbaik untuk umat.
			</p>
			<p class="text-sm text-gray-600">
				Pembaruan terbaru: halaman Sahabat Rasul, perluasan kajian ulama (Baghdad, Damaskus, Mesir, Hadramaut, Walisongo), serta penambahan tema harian di kalender pasaran.
			</p>
		</div>

		<!-- Social Media -->
		<div class="rounded-3xl border-2 border-rose-200 bg-white p-8 shadow-xl mb-12">
			<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">📱 Ikuti Jejak Digital Kami</h2>
			<div class="grid gap-4 md:grid-cols-4">
				{#each [
					{ icon: '📸', name: 'Instagram', url: 'https://instagram.com/idsantrionline', color: 'from-pink-500 to-purple-500' },
					{ icon: '▶️', name: 'YouTube', url: 'https://www.youtube.com/@websantrionline', color: 'from-red-500 to-rose-500' },
					{ icon: '🎵', name: 'TikTok', url: 'https://tiktok.com/@santrionline.com', color: 'from-cyan-500 to-blue-500' },
					{ icon: '📘', name: 'Facebook', url: 'https://facebook.com/yogikpratamaisabuzaid', color: 'from-blue-600 to-indigo-600' }
				] as social}
					<a href={social.url} target="_blank" rel="noreferrer" class="group relative overflow-hidden rounded-2xl bg-gradient-to-r {social.color} p-6 text-white shadow-lg transition hover:scale-105">
						<div class="absolute top-0 right-0 h-20 w-20 rounded-full bg-white/10 blur-2xl"></div>
						<div class="relative text-center">
							<span class="text-4xl mb-2 block">{social.icon}</span>
							<p class="font-bold">{social.name}</p>
						</div>
					</a>
				{/each}
			</div>
		</div>

		<!-- Dakwah Digital -->
		<div class="rounded-3xl border-2 border-teal-200 bg-white p-8 shadow-xl">
			<div class="flex items-center gap-3 mb-6">
				<span class="text-5xl">💡</span>
				<h2 class="text-3xl font-bold text-teal-800">Peran Santri dalam Dakwah Digital</h2>
			</div>
			<div class="space-y-4 text-gray-700 leading-relaxed">
				<p>
					Ekosistem <strong>santri online</strong> kami terhubung dengan kajian <a href="/ulama" class="text-teal-600 hover:underline font-semibold">ulama</a>, riwayat <a href="/sahabat" class="text-teal-600 hover:underline font-semibold">sahabat</a>, rujukan <a href="/kitab" class="text-teal-600 hover:underline font-semibold">kitab</a>, hingga agenda <a href="/kalender" class="text-teal-600 hover:underline font-semibold">kalender pasaran</a> dan progres hafalan di dashboard.
				</p>
				<p>
					Santri hari ini menghadapi lanskap dakwah yang sangat berbeda. Jika dulu keilmuan berputar di serambi pesantren, kini pesan kebaikan melaju melalui layar ponsel dan jejaring sosial. Inilah alasan mengapa penting bagi santri untuk hadir, berdaya, dan memimpin di ruang digital.
				</p>
				<p>
					Keutamaan ilmu yang bersanad menuntut penjagaan niat dan disiplin verifikasi. Santri terbiasa menelusuri sumber, merujuk guru, dan mengecek kesahihan. Kebiasaan ini adalah vaksin terhadap misinformasi yang kerap beredar di internet.
				</p>
			</div>
		</div>
	</div>
</div>
