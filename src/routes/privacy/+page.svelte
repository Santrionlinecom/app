<script lang="ts">
	import SeoHead from '$lib/components/seo/SeoHead.svelte';

	const lastUpdated = '21 Agustus 2026';
	const sections = [
		{ id: 'dasar-hukum', label: 'Dasar hukum' },
		{ id: 'ringkasan', label: 'Ringkasan' },
		{ id: 'data', label: 'Data yang dikumpulkan' },
		{ id: 'penggunaan', label: 'Penggunaan data' },
		{ id: 'dasar', label: 'Dasar pemrosesan' },
		{ id: 'pihak-ketiga', label: 'Layanan pihak ketiga' },
		{ id: 'cookie', label: 'Cookie & analitik' },
		{ id: 'pembayaran', label: 'Pembayaran & coin' },
		{ id: 'lisensi', label: 'Lisensi & unduhan' },
		{ id: 'ai', label: 'AI & konten agama' },
		{ id: 'anak', label: 'Anak & lembaga' },
		{ id: 'keamanan', label: 'Keamanan' },
		{ id: 'hak', label: 'Hak Anda' },
		{ id: 'retensi', label: 'Retensi' },
		{ id: 'perubahan', label: 'Perubahan' },
		{ id: 'kontak', label: 'Kontak' }
	];
</script>

<SeoHead
	title="Kebijakan Privasi SantriOnline"
	description="Kebijakan privasi SantriOnline: data akun, lembaga, coin, pembayaran, lisensi aplikasi desktop, cookie, analitik, dan penggunaan AI untuk pembinaan generasi muslim."
	keywords="kebijakan privasi santrionline, privacy policy, data santri, lisensi desktop"
	canonical="/privacy"
/>

<div class="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/50 to-white py-10 md:py-14">
	<div class="mx-auto max-w-5xl space-y-6 px-4">
		<header class="overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 p-6 text-white shadow-xl md:p-8">
			<p class="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100/80">Legal · Privasi</p>
			<h1 class="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Kebijakan Privasi</h1>
			<p class="mt-3 max-w-3xl text-sm leading-7 text-white/90 md:text-base">
				Kebijakan ini menjelaskan bagaimana SantriOnline mengumpulkan, memakai, menyimpan, dan melindungi data
				pada platform web, dashboard lembaga, toko digital, serta layanan terkait (termasuk aktivasi lisensi
				aplikasi desktop). Dengan memakai layanan, Anda memahami praktik di bawah ini.
			</p>
			<p class="mt-4 text-xs text-emerald-100/90">Terakhir diperbarui: {lastUpdated}</p>
		</header>

		<nav class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Daftar isi</p>
			<div class="mt-3 flex flex-wrap gap-2">
				{#each sections as item}
					<a
						href={`#${item.id}`}
						class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
					>
						{item.label}
					</a>
				{/each}
			</div>
		</nav>

		<section id="dasar-hukum" class="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
			<h2 class="text-xl font-bold text-emerald-900">0. Dasar Hukum & Pengendali Data</h2>
			<p class="mt-3 text-sm leading-7 text-slate-700">
				Kebijakan ini disusun mengacu pada
				<strong>Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data
				Pribadi</strong> (UU PDP), yang berlaku sejak 17 Oktober 2022.
			</p>
			<div class="mt-4 grid gap-4 md:grid-cols-2">
				<div class="rounded-xl border border-emerald-100 bg-white p-4">
					<h3 class="font-semibold text-slate-900">Pengendali Data Pribadi</h3>
					<p class="mt-2 text-sm leading-6 text-slate-700">
						SantriOnline bertindak sebagai <strong>Pengendali Data Pribadi</strong> atas data akun
						pengguna platform.
					</p>
					<p class="mt-2 text-sm leading-6 text-slate-700">
						Penanggung jawab pelindungan data:
						<a class="font-semibold text-emerald-700 hover:underline" href="mailto:masyogik@santrionline.com">masyogik@santrionline.com</a>
					</p>
				</div>
				<div class="rounded-xl border border-emerald-100 bg-white p-4">
					<h3 class="font-semibold text-slate-900">Lembaga sebagai Pengendali Bersama</h3>
					<p class="mt-2 text-sm leading-6 text-slate-700">
						Untuk data santri yang dikelola lewat dashboard lembaga (TPQ, masjid, musholla, pondok,
						rumah tahfidz), <strong>lembaga bertindak sebagai pengendali atas data santrinya</strong>,
						dan SantriOnline menyediakan sarana pemrosesannya.
					</p>
					<p class="mt-2 text-sm leading-6 text-slate-700">
						Pengurus lembaga bertanggung jawab memastikan pengumpulan data santri dilakukan dengan
						dasar yang sah.
					</p>
				</div>
			</div>

			<h3 class="mt-5 font-semibold text-slate-900">Prinsip yang kami pegang</h3>
			<ul class="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
				<li>• <strong>Minimal data</strong> — kami tidak mengumpulkan NIK, nomor KK, foto KTP/KK, tanggal lahir, atau alamat rumah perorangan.</li>
				<li>• <strong>Persetujuan tercatat</strong> — saat mendaftar, Anda menyetujui kebijakan ini secara eksplisit, dan waktu serta versi persetujuan itu kami simpan.</li>
				<li>• <strong>Seperlunya</strong> — data dipakai untuk menjalankan layanan yang Anda minta, bukan diperjualbelikan.</li>
			</ul>

			<p class="mt-4 rounded-xl bg-white/70 p-3 text-xs leading-6 text-slate-600">
				Rujukan resmi UU PDP dapat dibaca di
				<a class="font-semibold text-emerald-700 hover:underline" href="https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022" target="_blank" rel="noopener noreferrer">peraturan.bpk.go.id</a>.
			</p>
		</section>

		<section id="ringkasan" class="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-emerald-800">1. Ringkasan</h2>
			<ul class="mt-4 space-y-2 text-sm leading-7 text-slate-700">
				<li>• SantriOnline adalah sistem pembinaan generasi muslim (aqidah, adab, amal, ilmu, skill, komunitas, habit), bukan sekadar aplikasi konten.</li>
				<li>• Kami <strong>tidak menjual</strong> data pribadi untuk iklan pihak ketiga dan <strong>tidak memakai Google AdSense</strong>.</li>
				<li>• Data dipakai untuk menjalankan akun, lembaga, pembelajaran, pembayaran, lisensi, keamanan, dan peningkatan layanan.</li>
				<li>• Keputusan syariat/fatwa final tetap pada manusia dan rujukan; AI (jika dipakai) bersifat bantu, bukan mufti otonom.</li>
			</ul>
		</section>

		<section id="data" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">2. Data yang Kami Kumpulkan</h2>
			<div class="mt-4 grid gap-4 md:grid-cols-2">
				<div class="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
					<h3 class="font-semibold text-slate-900">Akun & identitas</h3>
					<ul class="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
						<li>• Email, nama, username/handle publik (jika diisi)</li>
						<li>• Login email/password (password disimpan terlindungi, bukan teks asli)</li>
						<li>• Login Google: ID Google, nama, email (token sementara tidak disimpan setelah sesi valid)</li>
						<li>• Foto profil / avatar (opsional)</li>
						<li>• Peran: santri, orang tua, guru, admin lembaga, super admin, dll.</li>
					</ul>
				</div>
				<div class="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
					<h3 class="font-semibold text-slate-900">Lembaga & pembinaan</h3>
					<ul class="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
						<li>• Data lembaga/TPQ/pondok (nama, slug, kontak, alamat, koordinat bila diisi)</li>
						<li>• Data santri, kelas, jadwal, setoran, rapor, sertifikat</li>
						<li>• Habit/misi/streak/badge (jika fitur aktif)</li>
						<li>• Konten sosial internal lembaga (jika dipakai)</li>
						<li>• Addon lembaga dan status berlangganan/trial</li>
					</ul>
				</div>
				<div class="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
					<h3 class="font-semibold text-slate-900">Transaksi & digital store</h3>
					<ul class="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
						<li>• Saldo coin, riwayat top-up, pembelian digital</li>
						<li>• Referensi pesanan, metode bayar, status pembayaran</li>
						<li>• Bukti transfer (jika unggah manual)</li>
						<li>• Metadata unduhan produk digital (bukan menyimpan ulang file pribadi Anda di luar layanan)</li>
					</ul>
				</div>
				<div class="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
					<h3 class="font-semibold text-slate-900">Lisensi aplikasi desktop</h3>
					<ul class="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
						<li>• Product slug (contoh: SantriPrint Pro, SantriOCR Pro)</li>
						<li>• Hash kunci lisensi (bukan menampilkan ulang plaintext key setelah generate)</li>
						<li>• Device hash/nama perangkat, status aktivasi, batas perangkat, last seen</li>
						<li>• Catatan admin terkait lisensi (jika ada)</li>
					</ul>
				</div>
				<div class="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
					<h3 class="font-semibold text-slate-900">Teknis & keamanan</h3>
					<ul class="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
						<li>• Sesi login / cookie yang diperlukan</li>
						<li>• Log teknis terbatas untuk keamanan, error, dan antispam (mis. Turnstile)</li>
						<li>• File media yang Anda unggah (avatar, bukti bayar, aset lembaga) di penyimpanan objek</li>
					</ul>
				</div>
				<div class="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
					<h3 class="font-semibold text-slate-900">Analitik (opsional)</h3>
					<ul class="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
						<li>• Hanya jika Anda menyetujui cookie analitik</li>
						<li>• Statistik kunjungan agregat (mis. Umami / Microsoft Clarity) untuk perbaikan UX</li>
						<li>• Bukan untuk menjual profil iklan</li>
					</ul>
				</div>
			</div>
		</section>

		<section id="penggunaan" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">3. Cara Kami Menggunakan Data</h2>
			<ul class="mt-4 space-y-2 text-sm leading-7 text-slate-700">
				<li>• Autentikasi, otorisasi peran, dan menjaga sesi aman</li>
				<li>• Menjalankan fitur pembinaan: setoran, habit, kitab, buku, dashboard lembaga, komunitas internal</li>
				<li>• Memproses coin, top-up, pesanan digital store, dan aktivasi lisensi desktop</li>
				<li>• Mengirim notifikasi transaksi yang relevan (email; WhatsApp hanya jika diaktifkan dan diizinkan secara operasional)</li>
				<li>• Mencegah penipuan, abuse, dan menjaga stabilitas layanan</li>
				<li>• Meningkatkan produk berdasarkan umpan balik dan metrik agregat</li>
			</ul>
		</section>

		<section id="dasar" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">4. Dasar Pemrosesan</h2>
			<ul class="mt-4 space-y-2 text-sm leading-7 text-slate-700">
				<li>• <strong>Kontrak/layanan:</strong> agar akun, lembaga, pembelian, dan lisensi berfungsi</li>
				<li>• <strong>Kepentingan sah:</strong> keamanan, pencegahan fraud, perbaikan platform</li>
				<li>• <strong>Persetujuan:</strong> cookie analitik opsional; fitur yang meminta izin khusus</li>
				<li>• <strong>Kewajiban operasional:</strong> pencatatan transaksi dan dukungan pelanggan</li>
			</ul>
		</section>

		<section id="pihak-ketiga" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">5. Layanan Pihak Ketiga</h2>
			<p class="mt-3 text-sm leading-7 text-slate-700">
				Kami memakai penyedia infrastruktur dan layanan sebatas yang diperlukan. Mereka memproses data sesuai
				peran masing-masing (bukan untuk dijual sebagai data iklan SantriOnline):
			</p>
			<ul class="mt-3 space-y-2 text-sm leading-7 text-slate-700">
				<li>• <strong>Cloudflare</strong> — hosting aplikasi, database, penyimpanan file, keamanan edge</li>
				<li>• <strong>Google</strong> — opsi login (OAuth) jika Anda memilihnya</li>
				<li>• <strong>Midtrans</strong> — gerbang pembayaran resmi status transaksi (bila dipakai)</li>
				<li>• <strong>Cloudflare Turnstile</strong> — proteksi bot/spam pada form sensitif</li>
				<li>• <strong>Email transaksional</strong> (bila dikonfigurasi) — notifikasi akun/pembayaran best-effort</li>
				<li>• <strong>Umami / Microsoft Clarity</strong> — analitik hanya jika cookie analitik disetujui</li>
				<li>• <strong>Model AI pihak ketiga</strong> (jika fitur AI diaktifkan) — untuk bantu ringkas/cari/otomasi terbatas; jangan kirim data sangat sensitif tanpa kebutuhan</li>
			</ul>
		</section>

		<section id="cookie" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">6. Cookie & Analitik</h2>
			<ul class="mt-4 space-y-2 text-sm leading-7 text-slate-700">
				<li>• <strong>Cookie diperlukan:</strong> sesi login, keamanan, preferensi dasar agar situs berfungsi</li>
				<li>• <strong>Cookie analitik:</strong> opsional; Anda bisa terima, tolak, atau atur lewat banner Privasi dan Cookie</li>
				<li>• Preferensi disimpan di peramban Anda (local storage consent)</li>
				<li>• Menolak analitik tidak menghalangi fitur inti login dan dashboard</li>
			</ul>
		</section>

		<section id="pembayaran" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">7. Pembayaran, Coin & Notifikasi</h2>
			<ul class="mt-4 space-y-2 text-sm leading-7 text-slate-700">
				<li>• Status pembayaran resmi merujuk pada gerbang pembayaran / verifikasi admin yang berlaku</li>
				<li>• Kredit coin dan akses digital dicatat secara idempotent; kegagalan notifikasi email/WA tidak membatalkan status bayar yang sudah sah</li>
				<li>• Notifikasi WhatsApp bersifat opsional dan dapat dimatikan secara default karena biaya/operasional</li>
				<li>• Bukti transfer yang diunggah hanya untuk verifikasi dan audit internal</li>
			</ul>
		</section>

		<section id="lisensi" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">8. Lisensi Desktop & Unduhan</h2>
			<ul class="mt-4 space-y-2 text-sm leading-7 text-slate-700">
				<li>• Produk seperti SantriPrint, SantriOCR, dan aplikasi desktop lain dapat memakai aktivasi lisensi online</li>
				<li>• Kami menyimpan hash kunci dan data perangkat sebatas penegakan batas device, status aktif/revoked/expired, serta dukungan</li>
				<li>• File installer/unduhan disediakan lewat toko digital atau tautan resmi; unduh hanya dari sumber SantriOnline</li>
				<li>• Aplikasi desktop dapat memverifikasi lisensi berkala; mode offline grace (jika ada) mengikuti kebijakan produk masing-masing</li>
				<li>• Jangan bagikan kunci lisensi; pelanggaran dapat berujung pencabutan</li>
			</ul>
		</section>

		<section id="ai" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">9. AI, Kitab Digital & Konten Agama</h2>
			<ul class="mt-4 space-y-2 text-sm leading-7 text-slate-700">
				<li>• Fitur AI (jika ada) membantu pencarian, ringkasan, atau otomasi operasional — <strong>bukan fatwa otonom</strong></li>
				<li>• Keputusan aqidah, hukum, dan tarbiyah yang bersifat final tetap pada manusia, guru, dan rujukan Aswaja</li>
				<li>• Konten kitab/buku/materi untuk edukasi; jangan menganggap keluaran AI sebagai dalil final tanpa verifikasi</li>
				<li>• Kami mengarahkan produk menjauh dari doomscroll dan “piety leaderboard”; habit/sosial dirancang adab-first</li>
			</ul>
		</section>

		<section id="anak" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">10. Anak, Orang Tua & Lembaga</h2>
			<ul class="mt-4 space-y-2 text-sm leading-7 text-slate-700">
				<li>• Data santri anak biasanya dikelola lewat akun orang tua/guru/lembaga yang berwenang</li>
				<li>• Pengurus lembaga wajib menjaga kerahasiaan data santri dan membatasi akses sesuai peran</li>
				<li>• Persetujuan lembaga/admin penting dapat tetap human-in-the-loop oleh Super Admin</li>
				<li>• Orang tua/wali diharapkan mendampingi penggunaan fitur digital anak</li>
			</ul>
		</section>

		<section id="keamanan" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">11. Penyimpanan & Keamanan</h2>
			<ul class="mt-4 space-y-2 text-sm leading-7 text-slate-700">
				<li>• Data diproses pada infrastruktur cloud yang dikonfigurasi untuk produksi (termasuk proteksi edge)</li>
				<li>• Akses internal dibatasi peran; password dilindungi dengan praktik modern</li>
				<li>• Tidak ada sistem yang 100% bebas risiko; segera hubungi kami jika menduga kebocoran akun</li>
				<li>• Anda bertanggung jawab menjaga kerahasiaan password, OTP, dan kunci lisensi</li>
			</ul>
		</section>

		<section id="hak" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">12. Hak dan Kontrol Anda</h2>
			<ul class="mt-4 space-y-2 text-sm leading-7 text-slate-700">
				<li>• Melihat/memperbarui profil lewat akun (bila fitur tersedia)</li>
				<li>• Logout untuk mengakhiri sesi</li>
				<li>• Mengatur consent cookie analitik</li>
				<li>• Meminta koreksi, penutupan akun, atau penghapusan data yang wajar secara hukum/operasional</li>
				<li>• Untuk data lembaga/santri, permintaan dapat memerlukan verifikasi peran (admin lembaga / wali)</li>
			</ul>
		</section>

		<section id="retensi" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">13. Retensi Data</h2>
			<ul class="mt-4 space-y-2 text-sm leading-7 text-slate-700">
				<li>• Data akun disimpan selama akun aktif atau selama diperlukan untuk layanan</li>
				<li>• Catatan transaksi/lisensi dapat disimpan lebih lama untuk audit, sengketa, dan kewajiban operasional</li>
				<li>• Log teknis disimpan terbatas sesuai kebutuhan keamanan</li>
				<li>• Setelah penutupan akun, penghapusan/anonimisasi dilakukan dalam waktu wajar kecuali ada kewajiban menyimpan</li>
			</ul>
		</section>

		<section id="perubahan" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">14. Perubahan Kebijakan</h2>
			<p class="mt-3 text-sm leading-7 text-slate-700">
				Kami dapat memperbarui kebijakan ini seiring fitur baru (coin, addon, digital store, lisensi desktop, AI,
				sosial lembaga, dll.). Versi terbaru berlaku setelah dipublikasikan di halaman ini. Perubahan material
				diupayakan diinformasikan lewat situs/app.
			</p>
		</section>

		<section id="kontak" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h2 class="text-xl font-bold text-slate-900">15. Kontak Privasi</h2>
			<p class="mt-3 text-sm leading-7 text-slate-700">
				Pertanyaan, koreksi data, atau permintaan penutupan akun:
			</p>
			<ul class="mt-3 space-y-2 text-sm text-slate-700">
				<li>
					• Email utama:
					<a class="font-semibold text-emerald-700 hover:underline" href="mailto:masyogik@santrionline.com"
						>masyogik@santrionline.com</a
					>
				</li>
				<li>
					• Halaman kontak:
					<a class="font-semibold text-emerald-700 hover:underline" href="/kontak">/kontak</a>
				</li>
				<li>
					• Syarat layanan terkait:
					<a class="font-semibold text-emerald-700 hover:underline" href="/syarat">/syarat</a>
				</li>
			</ul>
			<p class="mt-4 text-xs leading-6 text-slate-500">
				SantriOnline dioperasikan untuk mendukung pembinaan generasi muslim. Kebijakan ini bukan nasihat hukum
				eksternal; untuk kebutuhan compliance khusus lembaga, hubungi admin Anda.
			</p>
		</section>
	</div>
</div>
