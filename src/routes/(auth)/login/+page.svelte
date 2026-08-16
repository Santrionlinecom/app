<!--
	Halaman ini tidak pernah tampil: `+page.server.ts` selalu mengalihkan
	`/login` ke `/auth`, baik pada load maupun submit.

	Rute tetap dipertahankan karena masih ada penaut internal
	(`/promosi` dan penjaga `admin/tools/scraper`).

	Sebelumnya berkas ini berisi salinan form masuk yang tidak berfungsi:
	form itu POST ke action yang hanya melakukan redirect, sehingga tidak
	pernah memverifikasi Turnstile maupun memeriksa password. Menyimpan form
	mati seperti itu berisiko menyesatkan bila suatu saat redirect dilepas.
-->
<svelte:head>
	<title>Masuk | SantriOnline</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<noscript>
	<p>
		Halaman masuk telah dipindahkan. Silakan lanjut ke
		<a href="/auth">halaman masuk SantriOnline</a>.
	</p>
</noscript>
