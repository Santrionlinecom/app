<script lang="ts">
const articles = [
	{
		slug: 'keutamaan-alquran-akhir-zaman',
		title: 'Keutamaan Al-Qur’an di Akhir Zaman: Dalil Shahih & Kalam Ulama',
		excerpt:
			'Pengingat agar tetap berpegang pada Al-Qur’an di masa fitnah, disertai dalil shahih dan penjelasan ulama.',
		date: '2025-12-01',
		category: 'Tazkiyah'
	},
	{
		slug: 'keutamaan-surat-quran',
		title: 'Keutamaan Membaca Surat-Surat Penting dalam Al-Quran Secara Istiqomah',
		excerpt: 'Dalil dan hadits shahih tentang keutamaan membaca surat Al-Mulk, Al-Waqiah, As-Sajadah, Yasin, Muawwidzatain, dan surat-surat penting lainnya dalam Al-Quran.',
		date: '2025-11-28',
		category: 'Kajian Hadits'
	},
	{
		slug: 'keutamaan-santri',
		title: '5 Keutamaan Menjadi Santri di Era Digital',
		excerpt: 'Di era digital yang serba cepat ini, kita sering terjebak dalam pusaran konten tanpa henti. Yuk, kita bahas 5 keutamaan jadi santri yang bikin hidup kamu lebih bermakna!',
		date: '2025-11-27',
		category: 'Inspirasi'
	}
];
</script>

<svelte:head>
	<title>Blog - Santri Online</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<h1 class="text-4xl font-bold text-gray-900 mb-2">Blog</h1>
	<p class="text-gray-600 mb-8">Artikel inspiratif seputar dunia santri dan pesantren</p>

	<div class="grid gap-6">
		{#each articles as article}
			<a href="/blog/{article.slug}" class="block p-6 bg-white border rounded-lg hover:shadow-lg transition">
				<div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
					<span class="px-2 py-1 bg-blue-100 text-blue-600 rounded">{article.category}</span>
					<span>•</span>
					<time>{new Date(article.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
				</div>
				<h2 class="text-2xl font-bold text-gray-900 mb-2">{article.title}</h2>
				<p class="text-gray-600">{article.excerpt}</p>
			</a>
		{/each}
	</div>
</div>
