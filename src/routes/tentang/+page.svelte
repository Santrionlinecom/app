<script lang="ts">
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import BookOpenText from '@lucide/svelte/icons/book-open-text';
	import BrainCircuit from '@lucide/svelte/icons/brain-circuit';
	import Building2 from '@lucide/svelte/icons/building-2';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import HeartHandshake from '@lucide/svelte/icons/heart-handshake';
	import School from '@lucide/svelte/icons/school';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Users from '@lucide/svelte/icons/users';
	import WalletCards from '@lucide/svelte/icons/wallet-cards';
	import Printer from '@lucide/svelte/icons/printer';
	import ScanText from '@lucide/svelte/icons/scan-text';

	const lastUpdated = '25 Juli 2026';

	const pillars = [
		{
			icon: ShieldCheck,
			title: 'Aqidah kuat',
			desc: 'Aswaja bertahap, ringan, jelas, membentuk keyakinan sadar.'
		},
		{
			icon: HeartHandshake,
			title: 'Adab & syariat',
			desc: 'Shalat, Qur’an, birrul walidain, adab guru, adab digital jadi kebiasaan.'
		},
		{
			icon: ClipboardCheck,
			title: 'Amal & habit',
			desc: 'Misi harian, streak, dan badge agar anak menang kecil setiap hari.'
		},
		{
			icon: BookOpenText,
			title: 'Ilmu hidup',
			desc: 'Sirah, sahabat, fiqih praktis, akhlak, kitab, dan Qur’an dekat dengan anak.'
		},
		{
			icon: BrainCircuit,
			title: 'Skill masa depan',
			desc: 'Literasi digital, AI, menulis, desain, komunikasi, dan problem solving halal.'
		},
		{
			icon: Users,
			title: 'Komunitas & mentor',
			desc: 'Orang tua, guru, musyrif, dan lembaga dalam satu alur pembinaan.'
		}
	];

	const audiences = [
		{ icon: School, title: 'TPQ', desc: 'Setoran, review, santri, rapor, dan progres hafalan.' },
		{ icon: GraduationCap, title: 'Pondok', desc: 'Data santri, jadwal, kas, aset, dan pembinaan harian.' },
		{
			icon: BookOpenText,
			title: 'Rumah Tahfidz',
			desc: 'Tahfidz, murojaah, ujian, sertifikat, dan monitoring.'
		},
		{
			icon: Building2,
			title: 'Masjid / Musholla',
			desc: 'Jamaah, agenda, takmir, kas, dan administrasi ringan.'
		}
	];

	const productLines = [
		{
			icon: Building2,
			title: 'Dashboard lembaga',
			desc: 'Operasional multi-peran: santri, jadwal, addon, kas, kalender, laporan.',
			href: '/dashboard'
		},
		{
			icon: ClipboardCheck,
			title: 'Habit system',
			desc: 'Misi, streak, dan badge untuk melawan dopamin game & scrolling.',
			href: '/habit'
		},
		{
			icon: BookOpenText,
			title: 'Kitab & Qur’an',
			desc: 'Mushaf, kitab, dan rujukan Aswaja sebagai fondasi ilmu.',
			href: '/kitab'
		},
		{
			icon: WalletCards,
			title: 'Digital Store',
			desc: 'Produk digital & aplikasi desktop berlisensi, dibeli dengan Coin.',
			href: '/digital-store'
		},
		{
			icon: Printer,
			title: 'SantriPrint',
			desc: 'Aplikasi desktop layout cetak & PDF ukuran fisik untuk Windows.',
			href: '/digital-store/santriprint-pro'
		},
		{
			icon: ScanText,
			title: 'SantriOCR',
			desc: 'Arah produk: kitab/modul/scan Arab–Indonesia menjadi teks editable.',
			href: '/digital-store/santri-ocr-pro'
		}
	];

	const principles = [
		'AI membantu tarbiyah, bukan mengganti murabbi atau mengeluarkan fatwa otonom.',
		'Sosial dan habit dirancang adab-first — bukan reels, doomscroll, atau piety leaderboard.',
		'Monetisasi (coin, addon, lisensi) mendukung misi pembinaan, bukan menggantikannya.',
		'Tidak memakai Google AdSense; fokus nilai manfaat untuk lembaga dan keluarga muslim.',
		'Keputusan lembaga sensitif tetap human-in-the-loop oleh pengurus / Super Admin.'
	];

	const socials = [
		{ name: 'Instagram', url: 'https://instagram.com/idsantrionline', label: '@idsantrionline' },
		{ name: 'YouTube', url: 'https://www.youtube.com/@websantrionline', label: '@websantrionline' },
		{ name: 'TikTok', url: 'https://tiktok.com/@santrionline.com', label: '@santrionline.com' },
		{
			name: 'Facebook',
			url: 'https://facebook.com/yogikpratamaisabuzaid',
			label: 'Yogik Pratama'
		}
	];
</script>

<SeoHead
	title="Tentang SantriOnline — Sistem Pembinaan Generasi Muslim"
	description="SantriOnline adalah sistem pembinaan generasi muslim: aqidah, adab, amal, ilmu, skill, komunitas, dan habit untuk TPQ, pondok, rumah tahfidz, masjid, dan musholla."
	keywords="tentang santrionline, visi santrionline, pembinaan generasi muslim, aswaja, tpq digital"
	canonical="/tentang"
/>

<div class="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/50 to-white py-10 md:py-14">
	<div class="mx-auto max-w-6xl space-y-8 px-4">
		<header
			class="relative overflow-hidden rounded-[1.85rem] border border-emerald-100 bg-gradient-to-br from-emerald-800 via-teal-700 to-cyan-700 p-8 text-white shadow-xl md:p-12"
		>
			<div class="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl"></div>
			<div class="relative z-10 max-w-3xl">
				<p class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-50">
					<Sparkles class="h-3.5 w-3.5" />
					Aqidah · Adab · Amal · Ilmu · Skill · Habit
				</p>
				<h1 class="mt-5 text-3xl font-black tracking-tight md:text-5xl">Tentang SantriOnline</h1>
				<p class="mt-4 text-base font-medium leading-8 text-white/90 md:text-lg">
					Sistem pembinaan generasi muslim — bukan sekadar aplikasi lembaga, bukan sekadar platform konten, dan
					bukan sekadar proyek AI Islami.
				</p>
				<p class="mt-3 text-sm leading-7 text-emerald-50/90">
					Kami membantu TPQ, pondok, rumah tahfidz, masjid, dan musholla membentuk santri yang kuat aqidahnya,
					rapi ibadahnya, tinggi adabnya, hidup ilmunya, berkomunitas, dan siap bersaing dengan skill masa depan.
				</p>
				<p class="mt-5 text-xs text-emerald-100/80">Diperbarui: {lastUpdated}</p>
			</div>
		</header>

		<section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
			<p class="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Assalamualaikum</p>
			<div class="mt-4 space-y-4 text-sm leading-7 text-slate-700 md:text-base">
				<p>
					Di tengah dopamin cepat dari game, scrolling, dan tren kosong, anak muda butuh lebih dari sekadar materi
					agama di layar. Mereka butuh <strong>identitas, adab, amal, ilmu, skill, dan lingkungan</strong> yang
					menjaga pertumbuhan.
				</p>
				<p>
					<strong class="text-emerald-800">SantriOnline</strong> dibangun sebagai mesin pembinaan:
					<strong>Aqidah + Adab + Amal + Ilmu + Skill + Komunitas + Habit System</strong>. Landasan aqidah kami
					adalah <strong>Ahlussunnah wal Jama’ah (Aswaja)</strong> — empat mazhab dan warisan adab pesantren —
					disampaikan bertahap, jelas, dan membentuk keyakinan sadar.
				</p>
				<p>
					Teknologi (dashboard, habit, kitab digital, coin, lisensi desktop, AI bantu) hanyalah sarana. Ruhnya
					tetap tarbiyah: mencetak generasi muslim yang berilmu, beradab, disiplin, dan kompeten di dunia nyata.
				</p>
			</div>
		</section>

		<section class="grid gap-5 md:grid-cols-2">
			<div class="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm md:p-8">
				<h2 class="text-2xl font-bold text-emerald-900">Visi</h2>
				<p class="mt-4 text-sm leading-7 text-slate-700 md:text-base">
					Menjadi sistem digital pembinaan generasi muslim yang membentuk identitas, adab, aqidah, amal, ilmu,
					dan skill — sehingga santri siap hidup di zaman AI tanpa kehilangan arah syariat dan akhlak.
				</p>
			</div>
			<div class="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm md:p-8">
				<h2 class="text-2xl font-bold text-teal-900">Misi</h2>
				<ul class="mt-4 space-y-2.5 text-sm leading-7 text-slate-700">
					<li>• Membangun kurikulum & habit yang menolong anak lebih tertarik daripada game biasa.</li>
					<li>• Menguatkan aqidah Aswaja, adab, sirah, fiqih praktis, dan skill masa depan.</li>
					<li>• Menghubungkan orang tua, guru, mentor, dan lembaga dalam satu alur.</li>
					<li>• Menyediakan tools operasional & produk digital yang hemat, aman, dan bermanfaat.</li>
					<li>• Menjaga AI sebagai pembantu tarbiyah — bukan pengganti murabbi atau fatwa otonom.</li>
				</ul>
			</div>
		</section>

		<section>
			<div class="mb-5 text-center">
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Fondasi</p>
				<h2 class="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Enam pilar SantriOnline</h2>
			</div>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each pillars as item}
					<article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
						<div class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
							<svelte:component this={item.icon} class="h-5 w-5" strokeWidth={2.3} />
						</div>
						<h3 class="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
						<p class="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
					</article>
				{/each}
			</div>
		</section>

		<section>
			<div class="mb-5 text-center">
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Untuk siapa</p>
				<h2 class="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Lembaga yang kami dampingi</h2>
			</div>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each audiences as item}
					<article class="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
						<div class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
							<svelte:component this={item.icon} class="h-5 w-5" strokeWidth={2.3} />
						</div>
						<h3 class="mt-3 font-semibold text-slate-900">{item.title}</h3>
						<p class="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
					</article>
				{/each}
			</div>
		</section>

		<section>
			<div class="mb-5 text-center">
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Produk</p>
				<h2 class="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Yang sedang dibangun</h2>
				<p class="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
					Fitur dibuat bertahap agar lembaga menjaga biaya, fokus, dan kualitas pembinaan.
				</p>
			</div>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each productLines as item}
					<a
						href={item.href}
						class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
					>
						<div class="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-emerald-700">
							<svelte:component this={item.icon} class="h-5 w-5" strokeWidth={2.3} />
						</div>
						<h3 class="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
						<p class="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
						<span class="mt-3 inline-block text-xs font-semibold uppercase tracking-wide text-emerald-700"
							>Lihat →</span
						>
					</a>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm md:p-8">
			<h2 class="text-2xl font-bold text-amber-900">Prinsip di era AI</h2>
			<ul class="mt-4 space-y-2.5 text-sm leading-7 text-slate-700">
				{#each principles as line}
					<li class="flex gap-2">
						<span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></span>
						<span>{line}</span>
					</li>
				{/each}
			</ul>
		</section>

		<section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
			<h2 class="text-2xl font-bold text-slate-900">Di balik layar</h2>
			<p class="mt-4 text-sm leading-7 text-slate-700 md:text-base">
				SantriOnline dikembangkan oleh
				<a
					href="https://www.facebook.com/yogikpratamaisabuzaid/"
					target="_blank"
					rel="noreferrer"
					class="font-semibold text-emerald-700 hover:underline">Yogik Pratama Aprilian</a
				>
				bersama arah pembinaan Aswaja dari Batu, Jawa Timur — dengan pengalaman sebagai pengajar TPQ, pengurus
				masjid, dan praktisi web/AI. Tim berupaya menjaga produk tetap ringan, hemat, dan bermanfaat untuk umat.
			</p>
			<p class="mt-3 text-sm leading-7 text-slate-600">
				Pembaruan arah terbaru: homepage & visi pembinaan generasi, habit system, digital store + lisensi desktop
				(SantriPrint/SantriOCR), kebijakan privasi & syarat yang selaras fitur terkini, serta penegasan AI sebagai
				pembantu — bukan pengganti tarbiyah.
			</p>
			<div class="mt-6 flex flex-wrap gap-3">
				<a href="/register" class="btn border-none bg-emerald-700 text-white hover:bg-emerald-800">Daftar lembaga</a>
				<a href="/digital-store" class="btn btn-outline border-emerald-200 text-emerald-800">Lihat Digital Store</a>
				<a href="/kontak" class="btn btn-ghost text-slate-700">Kontak</a>
				<a href="/privacy" class="btn btn-ghost text-slate-700">Privasi</a>
			</div>
		</section>

		<section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
			<h2 class="text-center text-2xl font-bold text-slate-900">Jejak digital</h2>
			<div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{#each socials as social}
					<a
						href={social.url}
						target="_blank"
						rel="noreferrer"
						class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center transition hover:border-emerald-200 hover:bg-emerald-50"
					>
						<p class="font-semibold text-slate-900">{social.name}</p>
						<p class="mt-1 text-xs text-slate-500">{social.label}</p>
					</a>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-teal-100 bg-teal-50/60 p-6 text-sm leading-7 text-slate-700 md:p-8">
			<h2 class="text-xl font-bold text-teal-900">Dakwah digital yang beradab</h2>
			<p class="mt-3">
				Santri hari ini berdakwah di layar yang sama dengan tren rusak. SantriOnline mengajak hadir di ruang digital
				dengan bekal sanad, adab, dan skill — merujuk
				<a href="/kitab" class="font-semibold text-teal-800 hover:underline">kitab</a>, menjaga
				<a href="/habit" class="font-semibold text-teal-800 hover:underline">habit</a>, dan menata lembaga lewat
				<a href="/dashboard" class="font-semibold text-teal-800 hover:underline">dashboard</a>.
			</p>
			<p class="mt-3">
				Keutamaan ilmu bersanad menuntut niat dan verifikasi. Kebiasaan merujuk guru dan sumber adalah vaksin
				terhadap misinformasi — termasuk keluaran AI yang “kelihatan benar” tetapi bisa salah di titik kritis.
			</p>
		</section>
	</div>
</div>
