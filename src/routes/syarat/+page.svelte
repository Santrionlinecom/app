<script lang="ts">
	import SeoHead from '$lib/components/seo/SeoHead.svelte';

	const lastUpdated = '25 Juli 2026';
</script>

<SeoHead
	title="Syarat dan Ketentuan SantriOnline"
	description="Syarat dan ketentuan SantriOnline: akun, lembaga, konten, coin, digital store, lisensi aplikasi desktop, AI, dan tanggung jawab pengguna."
	keywords="syarat santrionline, ketentuan layanan, lisensi desktop, digital store"
	canonical="/syarat"
/>

<article class="mx-auto max-w-4xl space-y-5 px-4 py-10 md:py-12">
	<header class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
		<p class="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Legal</p>
		<h1 class="mt-2 text-3xl font-semibold text-slate-950">Syarat dan Ketentuan</h1>
		<p class="mt-3 text-sm leading-7 text-slate-600">
			Dengan membuat akun atau memakai SantriOnline (web, dashboard lembaga, toko digital, dan layanan terkait),
			Anda menyetujui ketentuan ini bersama
			<a href="/privacy" class="font-semibold text-emerald-700 hover:underline">Kebijakan Privasi</a>.
		</p>
		<p class="mt-2 text-xs text-slate-500">Terakhir diperbarui: {lastUpdated}</p>
	</header>

	<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-slate-950">1. Sifat Layanan</h2>
		<p class="mt-3 text-sm leading-7 text-slate-600">
			SantriOnline adalah platform pembinaan generasi muslim yang menggabungkan aqidah, adab, amal, ilmu, skill,
			komunitas, dan habit system untuk lembaga (TPQ, pondok, rumah tahfidz, masjid/musholla) serta pengguna
			individu. Fitur dapat berkembang bertahap; ketersediaan fitur bisa berbeda per peran, paket, atau addon.
		</p>
	</section>

	<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-slate-950">2. Akun & Keamanan</h2>
		<ul class="mt-3 space-y-2 text-sm leading-7 text-slate-600">
			<li>• Anda bertanggung jawab menjaga kerahasiaan password, sesi, dan akses perangkat.</li>
			<li>• Dilarang berbagi akun admin atau menyalahgunakan peran super admin/lembaga.</li>
			<li>• Aktivitas mencurigakan dapat berujung pembatasan atau penonaktifan akun.</li>
			<li>• Data yang Anda masukkan harus akurat sejauh wajar untuk operasional lembaga/pembelajaran.</li>
		</ul>
	</section>

	<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-slate-950">3. Lembaga, Santri & Peran</h2>
		<ul class="mt-3 space-y-2 text-sm leading-7 text-slate-600">
			<li>• Pengurus lembaga wajib mengelola data santri/orang tua sesuai wewenang dan adab privasi.</li>
			<li>• Batas fitur gratis/addon (mis. kuota santri/lembaga) mengikuti ketentuan paket yang berlaku.</li>
			<li>• Persetujuan aktivasi lembaga dapat memerlukan tinjauan Super Admin (human-in-the-loop).</li>
			<li>• Konten sosial internal (jika aktif) harus adab-first; dilarang spam, ujaran kebencian, atau konten haram.</li>
		</ul>
	</section>

	<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-slate-950">4. Konten, Buku & Kitab</h2>
		<ul class="mt-3 space-y-2 text-sm leading-7 text-slate-600">
			<li>• Materi dipakai untuk edukasi dan pembinaan; hak cipta konten dilindungi sesuai pemiliknya.</li>
			<li>• Bab buku/premium dapat memakai coin atau aturan akses tersendiri.</li>
			<li>• Dilarang menyalin massal, meretas paywall, atau mendistribusikan ulang konten berbayar tanpa izin.</li>
			<li>• Rujukan agama diarahkan pada kerangka Aswaja; AI bantu (jika ada) bukan pengganti ustadz/mufti.</li>
		</ul>
	</section>

	<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-slate-950">5. Coin, Pembayaran & Digital Store</h2>
		<ul class="mt-3 space-y-2 text-sm leading-7 text-slate-600">
			<li>• Coin adalah unit kredit di platform; nilai dan paket top-up dapat berubah.</li>
			<li>• Status pembayaran merujuk pada gerbang pembayaran resmi dan/atau verifikasi admin.</li>
			<li>• Setelah pesanan digital berstatus lunas/valid, unduhan mengikuti tautan resmi di riwayat pesanan.</li>
			<li>• Refund mengikuti kebijakan kasus per kasus (kesalahan sistem vs kesalahan pengguna).</li>
			<li>• Produk di katalog dapat berupa file digital, akses fitur, atau aplikasi desktop berlisensi.</li>
		</ul>
	</section>

	<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-slate-950">6. Lisensi Aplikasi Desktop</h2>
		<ul class="mt-3 space-y-2 text-sm leading-7 text-slate-600">
			<li>• Produk seperti SantriPrint Pro, SantriOCR Pro, dan sejenisnya dilisensikan, bukan dijual tanpa batas.</li>
			<li>• Kunci lisensi bersifat pribadi; dilarang dijual ulang, dishare publik, atau di-crack.</li>
			<li>• Batas perangkat, masa berlaku, dan fitur Pro mengikuti product slug masing-masing.</li>
			<li>• SantriOnline berhak mencabut (revoke) lisensi yang disalahgunakan atau diperoleh secara tidak sah.</li>
			<li>• Installer hanya diunduh dari sumber resmi SantriOnline / tautan yang kami berikan.</li>
			<li>• Beberapa produk mungkin dipublikasikan deskripsinya lebih dulu; kesiapan installer final mengikuti status rilis di halaman produk.</li>
		</ul>
	</section>

	<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-slate-950">7. AI & Otomasi</h2>
		<ul class="mt-3 space-y-2 text-sm leading-7 text-slate-600">
			<li>• Fitur AI bersifat bantu operasional/edukasi dan dapat keliru.</li>
			<li>• Jangan menjadikan keluaran AI sebagai fatwa, vonis, atau dalil final tanpa verifikasi manusia.</li>
			<li>• Anda dilarang memakai layanan untuk menghasilkan konten yang menyesatkan agama, penipuan, atau pelanggaran hukum.</li>
		</ul>
	</section>

	<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-slate-950">8. Larangan</h2>
		<ul class="mt-3 space-y-2 text-sm leading-7 text-slate-600">
			<li>• Meretas, scraping berlebihan, abuse API, atau mengganggu infrastruktur</li>
			<li>• Mengunggah malware, konten ilegal, atau data orang lain tanpa hak</li>
			<li>• Manipulasi pembayaran, chargeback curang, atau fraud coin/lisensi</li>
			<li>• Menjadikan platform sarana iklan haram, judi, riba eksplisit, atau eksploitasi anak</li>
		</ul>
	</section>

	<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-slate-950">9. Ketersediaan & Batasan Tanggung Jawab</h2>
		<p class="mt-3 text-sm leading-7 text-slate-600">
			Kami berupaya menjaga layanan stabil, namun tidak menjamin uptime 100%. Sepanjang diizinkan hukum yang
			berlaku, tanggung jawab SantriOnline atas kerugian dibatasi sejauh biaya yang Anda bayarkan untuk layanan
			terkait dalam periode wajar, kecuali ditentukan lain secara tertulis. Layanan disediakan “sebagaimana adanya”
			untuk tujuan pembinaan dan operasional lembaga.
		</p>
	</section>

	<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-slate-950">10. Perubahan & Hukum</h2>
		<p class="mt-3 text-sm leading-7 text-slate-600">
			Ketentuan dapat diperbarui seiring fitur baru. Versi terbaru berlaku setelah dipublikasikan di halaman ini.
			Untuk sengketa, diupayakan musyawarah terlebih dahulu. Hukum yang relevan adalah hukum Republik Indonesia,
			kecuali diatur lain secara wajib.
		</p>
	</section>

	<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
		<h2 class="text-lg font-semibold text-slate-950">11. Kontak</h2>
		<p class="mt-3 text-sm leading-7 text-slate-600">
			Pertanyaan layanan/legal:
			<a href="mailto:masyogik@santrionline.com" class="font-semibold text-emerald-700 hover:underline"
				>masyogik@santrionline.com</a
			>
			·
			<a href="/kontak" class="font-semibold text-emerald-700 hover:underline">Halaman kontak</a>
			·
			<a href="/privacy" class="font-semibold text-emerald-700 hover:underline">Kebijakan Privasi</a>
		</p>
	</section>
</article>
