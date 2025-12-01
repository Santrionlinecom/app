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
					<li>• Akun: email, username, role, gender (opsional), timestamp pendaftaran.</li>
					<li>• Login email/password: password disimpan sebagai hash <code>Scrypt</code> (tidak dalam bentuk asli).</li>
					<li>• Login Google: ID Google, email, nama; kami tidak menyimpan token akses setelah sesi dibuat.</li>
					<li>• Sesi: ID sesi dan cookie untuk autentikasi.</li>
					<li>• Progres hafalan & murojaah: catatan ayat/surah yang Anda setorkan.</li>
					<li>• Kalender/notes: catatan agenda yang Anda buat.</li>
					<li>• Sertifikat: data santri/ustadz terkait sertifikat dan statistiknya.</li>
					<li>• Permintaan akses asisten & riwayat perubahan role.</li>
					<li>• Data referensi surah/kitab/konten yang tampil di aplikasi.</li>
					<li class="text-emerald-700 font-semibold">• Tidak ada data kanban yang disimpan (fitur sudah dihapus).</li>
				</ul>
			</div>

			<div class="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
				<h2 class="text-xl font-bold text-teal-800 mb-3">Cara Kami Menggunakan Data</h2>
				<ul class="space-y-2 text-gray-700">
					<li>• Autentikasi dan sesi login (email/password atau Google OAuth).</li>
					<li>• Menampilkan progres hafalan, kalender, sertifikat, dan statistik dashboard sesuai role.</li>
					<li>• Mengelola peran pengguna (admin, asisten, ustadz, santri).</li>
					<li>• Pengelolaan akses asisten dan riwayat perubahan role.</li>
					<li>• Dukungan dan perbaikan layanan jika terjadi kendala teknis.</li>
					<li>• Kami tidak menjual atau membagikan data ke pihak ketiga untuk iklan.</li>
				</ul>
			</div>
		</section>

		<section class="grid md:grid-cols-2 gap-6">
			<div class="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
				<h2 class="text-xl font-bold text-cyan-800 mb-3">Tempat Penyimpanan & Keamanan</h2>
				<ul class="space-y-2 text-gray-700">
					<li>• Basis data menggunakan <strong>Cloudflare D1</strong> (SQL) baik untuk produksi maupun pengembangan.</li>
					<li>• Password di-hash dengan <code>Scrypt</code>; token Google tidak disimpan setelah validasi.</li>
					<li>• Cookie sesi menggunakan atribut aman (httpOnly, sameSite) dan secure di produksi.</li>
					<li>• Akses dashboard dan data dibatasi berdasarkan role.</li>
				</ul>
			</div>

			<div class="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
				<h2 class="text-xl font-bold text-amber-800 mb-3">Hak dan Kontrol Anda</h2>
				<ul class="space-y-2 text-gray-700">
					<li>• Anda dapat meminta koreksi atau penghapusan data akun.</li>
					<li>• Anda dapat keluar (logout) kapan saja untuk menghentikan sesi aktif.</li>
					<li>• Jika ingin menutup akun atau menghapus data hafalan/sertifikat, hubungi kami.</li>
				</ul>
			</div>
		</section>

		<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
			<h2 class="text-xl font-bold text-slate-900">Kontak</h2>
			<p class="text-gray-700">
				Jika ada pertanyaan atau permintaan terkait privasi, silakan email:
				<a class="text-emerald-700 font-semibold hover:underline" href="mailto:websantrionline@gmail.com">websantrionline@gmail.com</a>.
			</p>
			<p class="text-sm text-gray-600">
				Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan signifikan akan diinformasikan melalui situs/app.
			</p>
		</section>
	</div>
</div>
