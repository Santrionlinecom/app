<script lang="ts">
	const features = [
		{
			icon: '⚖️',
			title: 'Bahtsul Masail AI',
			description:
				'Simulasi musyawarah ilmiah dengan beberapa sudut pandang fikih, lalu diringkas menjadi bahan kajian yang mudah diverifikasi.'
		},
		{
			icon: '📚',
			title: 'Asisten Kitab Digital',
			description:
				'Bantu cari rujukan, kutipan, terjemah, dan konteks pembahasan dari kitab klasik untuk mempercepat riset santri dan asatidz.'
		},
		{
			icon: '🎙️',
			title: 'Naskah Dakwah Cepat',
			description:
				'Buat draft kultum, khutbah, sambutan, dan materi kajian dengan susunan yang rapi tanpa menggantikan bimbingan guru.'
		},
		{
			icon: '🌐',
			title: 'Riset Web Terarah',
			description:
				'Gabungkan konteks keislaman, berita, dan referensi kontemporer agar materi dakwah tetap relevan dengan zaman.'
		},
		{
			icon: '🧑‍🏫',
			title: 'Persona Pembelajaran',
			description:
				'Bangun asisten sesuai kebutuhan: TPQ, pondok, sekolah, masjid, penulis, atau admin lembaga.'
		},
		{
			icon: '🔗',
			title: 'Bagikan Hasil Kajian',
			description:
				'Simpan dan bagikan hasil diskusi penting ke grup belajar agar manfaat ilmu tidak berhenti di satu chat.'
		}
	];

	const stats = [
		{ value: '7K+', label: 'Kitab & sumber rujukan' },
		{ value: '24/7', label: 'Asisten belajar aktif' },
		{ value: 'Aswaja', label: 'Framing dakwah' },
		{ value: 'AI ≠ Fatwa', label: 'Tetap talaqqi ke guru' }
	];

	const testimonials = [
		{
			quote:
				'SantriOnline membantu saya menyiapkan bahan kajian lebih cepat, tapi tetap ada ruang verifikasi dan arahan guru.',
			name: 'Ustadz Ahmad',
			role: 'Pengajar TPQ'
		},
		{
			quote:
				'Yang saya suka, anak-anak tidak hanya disuruh belajar, tapi diarahkan membangun kebiasaan dan adab digital.',
			name: 'Bu Rini',
			role: 'Wali santri'
		},
		{
			quote:
				'Konsep AI-nya tidak liar. Ada pengingat jelas bahwa keputusan agama tetap kembali ke ulama dan guru.',
			name: 'Kang Hasan',
			role: 'Aktivis masjid'
		}
	];

	const plans = [
		{
			name: 'Santri',
			price: 'Gratis',
			description: 'Untuk mulai mencoba habit, materi dasar, dan asisten belajar ringan.',
			items: ['Akses materi pilihan', 'Habit harian', 'Komunitas belajar', 'Cocok untuk santri baru']
		},
		{
			name: 'Ustadz',
			price: 'Rp50rb',
			description: 'Untuk pengajar yang ingin menyiapkan materi, naskah, dan rujukan lebih cepat.',
			featured: true,
			items: ['Asisten kitab digital', 'Draft kultum & khutbah', 'Riset tema kajian', 'Template bahan ajar']
		},
		{
			name: 'Lembaga',
			price: 'Custom',
			description: 'Untuk TPQ, madrasah, pondok, atau masjid yang ingin punya sistem pembinaan digital.',
			items: ['Dashboard lembaga', 'Tracking santri', 'Program habit', 'Pendampingan implementasi']
		}
	];
</script>

<svelte:head>
	<title>Promosi SantriOnline — AI Islami untuk Pembinaan Generasi</title>
	<meta
		name="description"
		content="Landing promosi SantriOnline: AI Islami, kitab digital, habit system, dan pembinaan generasi muslim berbasis aqidah, adab, ilmu, amal, skill, dan komunitas."
	/>
</svelte:head>

<main class="promo-page">
	<section class="hero" aria-labelledby="promo-title">
		<div class="hero-bg" aria-hidden="true"></div>
		<nav class="topbar" aria-label="Navigasi promosi">
			<a class="brand" href="/">
				<span class="brand-mark">SO</span>
				<span>SantriOnline</span>
			</a>
			<div class="nav-links">
				<a href="#fitur">Fitur</a>
				<a href="#harga">Harga</a>
				<a href="#faq">FAQ</a>
				<a href="/login">Login</a>
			</div>
		</nav>

		<div class="hero-grid">
			<div class="hero-copy">
				<p class="eyebrow">SantriOnline AI • Rilis Promosi</p>
				<h1 id="promo-title">AI yang membantu ngaji, membina habit, dan menjaga adab.</h1>
				<p class="lead">
					Platform pembinaan generasi muslim yang menggabungkan kitab digital, asisten dakwah,
					habit syariat, komunitas, dan skill masa depan — dengan pengingat jelas bahwa AI bukan
					pengganti guru, ustadz, dan ulama.
				</p>
				<div class="hero-actions">
					<a class="btn primary" href="/register">Daftar Gratis</a>
					<a class="btn secondary" href="#fitur">Lihat Fitur</a>
				</div>
				<div class="warning-note">AI bisa salah. Keputusan agama tetap melalui talaqqi, guru, dan ulama yang jelas sanadnya.</div>
			</div>

			<div class="chat-card" aria-label="Contoh tampilan chat SantriOnline AI">
				<div class="chat-header">
					<div>
						<strong>SantriOnline AI — Chat</strong>
						<span>Asisten kitab & dakwah</span>
					</div>
					<span class="status-dot"></span>
				</div>
				<div class="bubble user">Bagaimana menyiapkan kultum tentang adab kepada guru?</div>
				<div class="bubble bot">
					<p class="tag">📖 Bahan Kajian</p>
					<strong>Struktur kultum:</strong>
					<ol>
						<li>Pembukaan: keutamaan ilmu.</li>
						<li>Isi: adab sebelum, saat, dan setelah belajar.</li>
						<li>Penutup: ajakan praktik 1 adab hari ini.</li>
					</ol>
					<div class="source-box">Rujukan perlu diverifikasi ulang ke guru/kitab sebelum disampaikan.</div>
				</div>
				<div class="chat-tools">
					<span>Terjemah</span><span>Tarkib</span><span>Lacak rujukan</span>
				</div>
			</div>
		</div>
	</section>

	<section class="stats-strip" aria-label="Ringkasan SantriOnline">
		{#each stats as stat}
			<div>
				<strong>{stat.value}</strong>
				<span>{stat.label}</span>
			</div>
		{/each}
	</section>

	<section id="fitur" class="section">
		<div class="section-head">
			<p class="eyebrow">Revolusi Kajian & Pembinaan</p>
			<h2>Fitur yang dibuat untuk pesantren, TPQ, masjid, dan keluarga muslim.</h2>
			<p>
				Bukan sekadar chat AI. SantriOnline diarahkan menjadi mesin pembentuk identitas,
				adab, aqidah, amal, ilmu, skill, komunitas, dan habit.
			</p>
		</div>
		<div class="feature-grid">
			{#each features as feature}
				<article class="feature-card">
					<span class="feature-icon">{feature.icon}</span>
					<h3>{feature.title}</h3>
					<p>{feature.description}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="bahtsul">
		<div>
			<p class="eyebrow">Simulasi Musyawarah Ilmiah</p>
			<h2>Bahtsul Masail digital yang tetap rendah hati di hadapan ilmu.</h2>
			<p>
				AI membantu menyusun perspektif, bukan mengambil alih otoritas fatwa. Hasilnya cocok
				untuk bahan awal diskusi, riset, dan persiapan menghadap guru.
			</p>
		</div>
		<div class="discussion-card">
			<div class="message"><b>Moderator:</b> Bagaimana adab santri saat berbeda pendapat?</div>
			<div class="message"><b>Kang Fiqih:</b> Dahulukan husnuzan, tabayyun, dan menjaga lisan.</div>
			<div class="message"><b>Ustadz Adab:</b> Perbedaan tidak boleh memutus ukhuwah dan hormat kepada guru.</div>
			<div class="message conclusion"><b>Kesimpulan:</b> Bahas ilmu dengan dalil, hati tenang, dan adab terjaga.</div>
		</div>
	</section>

	<section class="section testimonials">
		<div class="section-head">
			<p class="eyebrow">Dipakai untuk Dakwah & Belajar</p>
			<h2>Apa kata pengguna?</h2>
		</div>
		<div class="testimonial-grid">
			{#each testimonials as item}
				<article class="testimonial-card">
					<div class="stars">★★★★★</div>
					<p>“{item.quote}”</p>
					<strong>{item.name}</strong>
					<span>{item.role}</span>
				</article>
			{/each}
		</div>
	</section>

	<section id="harga" class="section pricing">
		<div class="section-head">
			<p class="eyebrow">Paket Terjangkau</p>
			<h2>Mulai gratis, upgrade saat sudah jelas manfaatnya.</h2>
			<p>Paket bisa disesuaikan untuk individu, pengajar, maupun lembaga.</p>
		</div>
		<div class="pricing-grid">
			{#each plans as plan}
				<article class:featured={plan.featured} class="price-card">
					{#if plan.featured}<span class="badge">Paling cocok</span>{/if}
					<h3>{plan.name}</h3>
					<div class="price">{plan.price}</div>
					<p>{plan.description}</p>
					<ul>
						{#each plan.items as item}<li>✓ {item}</li>{/each}
					</ul>
					<a class="btn {plan.featured ? 'primary' : 'secondary'}" href="/register">Mulai Sekarang</a>
				</article>
			{/each}
		</div>
	</section>

	<section id="faq" class="faq-section">
		<div class="section-head">
			<p class="eyebrow">Pertanyaan Umum</p>
			<h2>Hal penting sebelum memakai AI Islami.</h2>
		</div>
		<div class="faq-list">
			<details open>
				<summary>Apakah SantriOnline menggantikan ustadz atau kiai?</summary>
				<p>Tidak. SantriOnline adalah asisten belajar dan riset. Kesimpulan agama tetap kembali kepada ulama, guru, dan talaqqi.</p>
			</details>
			<details>
				<summary>Apa bedanya dengan AI umum?</summary>
				<p>SantriOnline dibingkai untuk pendidikan Islam, adab, habit, dan rujukan yang perlu diverifikasi, bukan sekadar jawaban cepat.</p>
			</details>
			<details>
				<summary>Apakah bisa untuk lembaga?</summary>
				<p>Bisa. Lembaga dapat memakai dashboard, habit, program belajar, dan pendampingan implementasi sesuai kebutuhan.</p>
			</details>
		</div>
	</section>

	<section class="final-cta">
		<p class="eyebrow">Siap membina generasi?</p>
		<h2>Mulai dari satu habit baik hari ini.</h2>
		<p>Bangun generasi muslim yang beraqidah kuat, beradab, berilmu, beramal, dan punya skill dunia nyata.</p>
		<a class="btn primary" href="/register">Coba SantriOnline Gratis</a>
	</section>
</main>

<style>
	:global(body) {
		background: #f8f2e7;
	}

	.promo-page {
		min-height: 100vh;
		background:
			radial-gradient(circle at top left, rgba(234, 178, 80, 0.2), transparent 32rem),
			linear-gradient(180deg, #f8f2e7 0%, #fffaf1 42%, #f6efe2 100%);
		color: #153827;
		font-family: 'Plus Jakarta Sans', Inter, system-ui, sans-serif;
	}

	.hero {
		position: relative;
		overflow: hidden;
		padding: 1.25rem clamp(1rem, 3vw, 3rem) 5rem;
		background: linear-gradient(135deg, #0d3b29 0%, #12543a 48%, #0b241b 100%);
		color: white;
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(rgba(13, 59, 41, 0.74), rgba(13, 59, 41, 0.86)),
			url('https://santriai.com/landing/assets/hero-bg.jpeg') center/cover;
		opacity: 0.55;
	}

	.topbar,
	.hero-grid {
		position: relative;
		z-index: 1;
		max-width: 1180px;
		margin: 0 auto;
	}

	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0 3.75rem;
	}

	.brand,
	.nav-links a {
		color: inherit;
		text-decoration: none;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
		font-weight: 900;
		letter-spacing: -0.02em;
	}

	.brand-mark {
		display: grid;
		width: 2.6rem;
		height: 2.6rem;
		place-items: center;
		border-radius: 0.9rem;
		background: linear-gradient(135deg, #e8b253, #fff0b8);
		color: #173827;
		box-shadow: 0 14px 35px rgba(0, 0, 0, 0.24);
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.92rem;
		color: rgba(255, 255, 255, 0.82);
	}

	.nav-links a:hover {
		color: #ffe3a0;
	}

	.hero-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(320px, 0.82fr);
		align-items: center;
		gap: clamp(2rem, 6vw, 5rem);
	}

	.eyebrow {
		margin: 0 0 0.85rem;
		color: #c38b2e;
		font-size: 0.78rem;
		font-weight: 900;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.hero .eyebrow {
		color: #ffd886;
	}

	h1,
	h2,
	h3,
	p {
		margin-top: 0;
	}

	h1 {
		max-width: 11ch;
		font-family: Fraunces, Georgia, serif;
		font-size: clamp(3.2rem, 8vw, 6.6rem);
		line-height: 0.93;
		letter-spacing: -0.07em;
		margin-bottom: 1.4rem;
	}

	.lead {
		max-width: 45rem;
		color: rgba(255, 255, 255, 0.82);
		font-size: clamp(1.02rem, 1.35vw, 1.22rem);
		line-height: 1.8;
	}

	.hero-actions,
	.chat-tools {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
		align-items: center;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 3rem;
		border-radius: 999px;
		padding: 0.8rem 1.25rem;
		font-weight: 850;
		text-decoration: none;
		transition: transform 0.18s ease, box-shadow 0.18s ease;
	}

	.btn:hover {
		transform: translateY(-2px);
	}

	.btn.primary {
		background: linear-gradient(135deg, #e8b253, #f7d88c);
		color: #163827;
		box-shadow: 0 18px 45px rgba(232, 178, 83, 0.3);
	}

	.btn.secondary {
		border: 1px solid rgba(21, 56, 39, 0.16);
		background: rgba(255, 255, 255, 0.76);
		color: #153827;
	}

	.hero .btn.secondary {
		border-color: rgba(255, 255, 255, 0.22);
		background: rgba(255, 255, 255, 0.12);
		color: white;
	}

	.warning-note {
		margin-top: 1.1rem;
		max-width: 42rem;
		border: 1px solid rgba(255, 216, 134, 0.28);
		border-radius: 1rem;
		padding: 0.9rem 1rem;
		background: rgba(255, 248, 225, 0.08);
		color: rgba(255, 245, 220, 0.88);
		font-size: 0.92rem;
	}

	.chat-card,
	.feature-card,
	.testimonial-card,
	.price-card,
	.faq-list details,
	.discussion-card {
		border: 1px solid rgba(21, 56, 39, 0.11);
		background: rgba(255, 255, 255, 0.88);
		box-shadow: 0 24px 80px rgba(21, 56, 39, 0.1);
		backdrop-filter: blur(14px);
	}

	.chat-card {
		border-color: rgba(255, 255, 255, 0.18);
		border-radius: 2rem;
		padding: 1rem;
		background: rgba(255, 250, 241, 0.94);
		color: #153827;
		transform: rotate(1.2deg);
	}

	.chat-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-radius: 1.35rem;
		padding: 1rem;
		background: #123b2b;
		color: white;
	}

	.chat-header span:not(.status-dot) {
		display: block;
		margin-top: 0.2rem;
		color: rgba(255, 255, 255, 0.68);
		font-size: 0.82rem;
	}

	.status-dot {
		width: 0.8rem;
		height: 0.8rem;
		border-radius: 99px;
		background: #52e09d;
		box-shadow: 0 0 0 6px rgba(82, 224, 157, 0.18);
	}

	.bubble {
		margin-top: 1rem;
		border-radius: 1.2rem;
		padding: 1rem;
		line-height: 1.6;
	}

	.bubble.user {
		margin-left: 2rem;
		background: #dff7e9;
	}

	.bubble.bot {
		margin-right: 1rem;
		background: #fff7e7;
	}

	.bubble ol {
		padding-left: 1.2rem;
	}

	.tag {
		margin-bottom: 0.55rem;
		color: #a66c16;
		font-weight: 900;
		font-size: 0.78rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.source-box {
		border-radius: 0.9rem;
		padding: 0.8rem;
		background: white;
		color: #6f5c36;
		font-size: 0.88rem;
	}

	.chat-tools {
		padding: 1rem 0.25rem 0.25rem;
	}

	.chat-tools span {
		border-radius: 999px;
		background: #f1e2c6;
		padding: 0.45rem 0.7rem;
		font-size: 0.78rem;
		font-weight: 800;
		color: #795116;
	}

	.stats-strip,
	.section,
	.bahtsul,
	.faq-section,
	.final-cta {
		max-width: 1180px;
		margin: 0 auto;
		padding: 5rem clamp(1rem, 3vw, 3rem);
	}

	.stats-strip {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		margin-top: -3rem;
		position: relative;
		z-index: 2;
	}

	.stats-strip div {
		border: 1px solid rgba(21, 56, 39, 0.12);
		border-radius: 1.4rem;
		padding: 1.2rem;
		background: #fffaf1;
		box-shadow: 0 18px 55px rgba(21, 56, 39, 0.1);
	}

	.stats-strip strong {
		display: block;
		font-family: Fraunces, Georgia, serif;
		font-size: 2rem;
		color: #12543a;
	}

	.stats-strip span {
		color: #6a776e;
		font-size: 0.9rem;
	}

	.section-head {
		max-width: 760px;
		margin: 0 auto 2.2rem;
		text-align: center;
	}

	h2 {
		font-family: Fraunces, Georgia, serif;
		font-size: clamp(2.1rem, 4vw, 4rem);
		line-height: 1.04;
		letter-spacing: -0.045em;
		color: #143827;
	}

	.section-head p:not(.eyebrow),
	.bahtsul p {
		color: #64736a;
		line-height: 1.8;
	}

	.feature-grid,
	.testimonial-grid,
	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
	}

	.feature-card,
	.testimonial-card,
	.price-card {
		border-radius: 1.5rem;
		padding: 1.35rem;
	}

	.feature-icon {
		display: grid;
		width: 3rem;
		height: 3rem;
		place-items: center;
		border-radius: 1rem;
		background: #eaf6ee;
		font-size: 1.45rem;
	}

	h3 {
		margin: 1rem 0 0.55rem;
		font-size: 1.15rem;
		color: #173827;
	}

	.feature-card p,
	.testimonial-card p,
	.price-card p,
	.faq-list p {
		color: #65756b;
		line-height: 1.7;
	}

	.bahtsul {
		display: grid;
		grid-template-columns: 0.86fr 1fr;
		gap: 2rem;
		align-items: center;
	}

	.discussion-card {
		border-radius: 1.7rem;
		padding: 1rem;
		background: #153827;
	}

	.message {
		margin: 0.7rem 0;
		border-radius: 1rem;
		padding: 0.9rem 1rem;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.85);
	}

	.message.conclusion {
		background: #f4d58a;
		color: #153827;
	}

	.stars,
	.price {
		color: #c88a24;
		font-weight: 900;
	}

	.testimonial-card strong,
	.testimonial-card span {
		display: block;
	}

	.testimonial-card span {
		margin-top: 0.15rem;
		color: #7a897f;
		font-size: 0.88rem;
	}

	.pricing {
		max-width: 1220px;
	}

	.price-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.price-card.featured {
		border-color: #d79b35;
		background: linear-gradient(180deg, #fff8e8, #ffffff);
		transform: translateY(-0.5rem);
	}

	.badge {
		position: absolute;
		top: 1rem;
		right: 1rem;
		border-radius: 999px;
		background: #153827;
		color: white;
		padding: 0.35rem 0.65rem;
		font-size: 0.74rem;
		font-weight: 850;
	}

	.price {
		font-family: Fraunces, Georgia, serif;
		font-size: 2.35rem;
	}

	.price-card ul {
		margin: 0 0 0.5rem;
		padding: 0;
		list-style: none;
		color: #40584a;
		line-height: 1.9;
	}

	.price-card .btn {
		margin-top: auto;
	}

	.faq-section {
		max-width: 900px;
	}

	.faq-list {
		display: grid;
		gap: 0.85rem;
	}

	.faq-list details {
		border-radius: 1.1rem;
		padding: 1rem 1.15rem;
	}

	.faq-list summary {
		cursor: pointer;
		font-weight: 900;
		color: #153827;
	}

	.final-cta {
		margin-bottom: 4rem;
		border-radius: 2rem;
		background: linear-gradient(135deg, #153827, #0d2a20);
		color: white;
		text-align: center;
	}

	.final-cta h2 {
		color: white;
	}

	.final-cta p:not(.eyebrow) {
		max-width: 650px;
		margin-left: auto;
		margin-right: auto;
		color: rgba(255, 255, 255, 0.75);
		line-height: 1.8;
	}

	@media (max-width: 900px) {
		.nav-links {
			display: none;
		}

		.hero-grid,
		.bahtsul {
			grid-template-columns: 1fr;
		}

		.hero-copy {
			text-align: center;
		}

		h1 {
			max-width: 12ch;
			margin-left: auto;
			margin-right: auto;
		}

		.lead,
		.warning-note {
			margin-left: auto;
			margin-right: auto;
		}

		.hero-actions {
			justify-content: center;
		}

		.chat-card {
			transform: none;
		}

		.stats-strip,
		.feature-grid,
		.testimonial-grid,
		.pricing-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 620px) {
		.hero {
			padding-bottom: 4rem;
		}

		.topbar {
			padding-bottom: 2.25rem;
		}

		h1 {
			max-width: 10.5ch;
			font-size: clamp(3rem, 16vw, 4.4rem);
		}

		.hero-actions .btn,
		.final-cta .btn,
		.price-card .btn {
			width: 100%;
		}

		.stats-strip,
		.feature-grid,
		.testimonial-grid,
		.pricing-grid {
			grid-template-columns: 1fr;
		}

		.stats-strip {
			margin-top: -2rem;
		}

		.section,
		.bahtsul,
		.faq-section,
		.final-cta {
			padding-top: 4rem;
			padding-bottom: 4rem;
		}

		.price-card.featured {
			transform: none;
		}
	}
</style>
