<svelte:head>
	<title>Kebijakan Privasi - Santri Online</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/60 to-white py-12">
	<div class="max-w-5xl mx-auto px-4 space-y-8">
		<div class="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-8 shadow-xl">
			<div class="flex items-center gap-3 mb-3">
				<span class="text-3xl">🛡️</span>
				<h1 class="text-3xl md:text-4xl font-bold">Kebijakan Privasi</h1>
			</div>
			<p class="opacity-90 leading-relaxed">
				Kebijakan ini menjelaskan bagaimana Santri Online mengumpulkan, menyimpan, dan melindungi data
				Anda di aplikasi (web dan mobile). Dengan menggunakan layanan kami, Anda menyetujui praktik di bawah ini.
			</p>
		</div>

		<section class="grid md:grid-cols-2 gap-6">
			<div class="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
				<h2 class="text-xl font-bold text-emerald-800 mb-3">Data yang Kami Simpan</h2>
				<ul class="space-y-2 text-gray-700">
					<li>• Akun dasar: email, nama/username, serta metode login (email atau Google).</li>
					<li>• Kata sandi disimpan sebagai hash <code>Scrypt</code> (bukan teks asli).</li>
					<li>• Login Google: ID Google, nama, dan email; token akses tidak disimpan setelah sesi dibuat.</li>
					<li>• Progres hafalan santri: setoran ayat/surah dan statistik terkait.</li>
					<li>• Referensi konten Aswaja: data surah/kitab/riwayat yang tampil di aplikasi.</li>
					<li>• Sesi login dan cookie untuk menjaga Anda tetap masuk.</li>
				</ul>
			</div>

			<div class="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
				<h2 class="text-xl font-bold text-teal-800 mb-3">Cara Kami Menggunakan Data</h2>
				<ul class="space-y-2 text-gray-700">
					<li>• Autentikasi dan menjaga sesi login.</li>
					<li>• Menampilkan progres hafalan santri dan konten Aswaja yang relevan.</li>
					<li>• Memberi akses sesuai peran (admin, asisten, ustadz, santri) secukupnya.</li>
					<li>• Dukungan teknis dan peningkatan layanan.</li>
					<li>• Tidak menjual atau membagikan data ke pihak ketiga untuk iklan.</li>
				</ul>
			</div>
		</section>

		<section class="grid md:grid-cols-2 gap-6">
			<div class="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
				<h2 class="text-xl font-bold text-cyan-800 mb-3">Penyimpanan & Keamanan</h2>
				<ul class="space-y-2 text-gray-700">
					<li>• Data disimpan di basis data SQL.</li>
					<li>• Password di-hash dengan <code>Scrypt</code>; token Google dibuang setelah validasi.</li>
					<li>• Cookie sesi memakai pengaturan aman (httpOnly, sameSite) dan <code>secure</code> di produksi.</li>
					<li>• Akses dibatasi sesuai peran pengguna.</li>
				</ul>
			</div>

			<div class="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
				<h2 class="text-xl font-bold text-amber-800 mb-3">Hak dan Kontrol Anda</h2>
				<ul class="space-y-2 text-gray-700">
					<li>• Anda dapat meminta koreksi atau penghapusan data akun.</li>
					<li>• Anda bisa logout kapan saja untuk menghentikan sesi aktif.</li>
					<li>• Untuk menutup akun atau menghapus data hafalan, hubungi kami.</li>
				</ul>
			</div>
		</section>

		<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
			<h2 class="text-xl font-bold text-slate-900">Kontak</h2>
			<div class="text-gray-700 space-y-2">
				<p>Jika ada pertanyaan atau permintaan terkait privasi, silakan hubungi:</p>
				<ul class="space-y-1">
					<li>• <a class="text-emerald-700 font-semibold hover:underline" href="mailto:masyogik@santrionline.com">masyogik@santrionline.com</a></li>
					<li>• <a class="text-emerald-700 font-semibold hover:underline" href="mailto:hanifah@santrionline.com">hanifah@santrionline.com</a></li>
					<li>• <a class="text-emerald-700 font-semibold hover:underline" href="mailto:sarah@santrionline.com">sarah@santrionline.com</a></li>
				</ul>
			</div>
			<p class="text-sm text-gray-600">
				Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan signifikan akan diinformasikan melalui situs/app.
			</p>
		</section>
	</div>
</div>
