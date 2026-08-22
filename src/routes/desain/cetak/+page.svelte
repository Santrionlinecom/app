<script lang="ts">
	import { page } from '$app/stores';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Printer from '@lucide/svelte/icons/printer';
	import UploadCloud from '@lucide/svelte/icons/upload-cloud';
	import { getDesignTemplate, printProducts } from '$lib/data/desain';

	$: templateSlug = $page.url.searchParams.get('template') ?? '';
	$: selectedTemplate = templateSlug ? getDesignTemplate(templateSlug) : null;
	$: whatsappText = encodeURIComponent(`Assalamu'alaikum, saya ingin cetak/edit desain SantriOnline${selectedTemplate ? `: ${selectedTemplate.title}` : ''}. Mohon info harga dan alurnya.`);
	$: whatsappUrl = `https://wa.me/6287854545274?text=${whatsappText}`;
</script>

<svelte:head>
	<title>Cetak Desain SantriOnline - Banner, Poster, Sertifikat, Stiker, Undangan</title>
	<meta name="description" content="Pesan cetak desain SantriOnline untuk banner event Islam, poster sekolah, sertifikat TPQ, stiker santri, undangan pengajian, dan kebutuhan lembaga Islam." />
</svelte:head>

<div class="min-h-screen bg-slate-950 text-white">
	<section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
		<a href="/desain" class="text-sm font-bold text-white/70 hover:text-white">← Kembali ke desain</a>
		<div class="mt-8 grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
			<div>
				<p class="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-200"><Printer class="h-4 w-4" /> Funnel cetak SantriOnline</p>
				<h1 class="mt-6 text-4xl font-black tracking-tight sm:text-6xl">Cetak file desain untuk event Islam dan sekolah.</h1>
				<p class="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Pilih template, kirim data lembaga, lalu SantriOnline bantu edit dan arahkan ke file/cetak: banner, poster, piagam, stiker, kartu, undangan, dan kebutuhan promosi lembaga.</p>
				{#if selectedTemplate}
					<div class="mt-6 rounded-3xl border border-emerald-300/30 bg-emerald-400/10 p-5">
						<p class="text-sm font-bold text-emerald-100">Template dipilih:</p>
						<p class="mt-1 text-xl font-black">{selectedTemplate.title}</p>
					</div>
				{/if}
				<a href={whatsappUrl} class="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-4 font-black text-slate-950 shadow-xl shadow-emerald-500/20">
					<MessageCircle class="h-5 w-5" /> Konsultasi & pesan via WhatsApp
				</a>
			</div>
			<div class="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
				<div class="rounded-3xl bg-white p-6 text-slate-950">
					<UploadCloud class="h-10 w-10 text-emerald-600" />
					<h2 class="mt-4 text-2xl font-black">Data yang perlu dikirim</h2>
					<ul class="mt-5 space-y-3 text-sm font-semibold text-slate-700">
						<li>1. Nama lembaga / panitia</li>
						<li>2. Judul acara dan tema</li>
						<li>3. Tanggal, tempat, dan narasumber</li>
						<li>4. Logo/foto jika ada</li>
						<li>5. Ukuran cetak dan jumlah</li>
						<li>6. Alamat kirim / ambil file digital</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<section class="bg-white py-14 text-slate-950">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<p class="text-sm font-black uppercase tracking-[0.3em] text-emerald-600">Produk cetak</p>
			<h2 class="mt-3 text-3xl font-black">Paket yang bisa dijadikan funnel dari template</h2>
			<div class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each printProducts as product}
					<div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
						<p class="text-xl font-black">{product.name}</p>
						<p class="mt-2 text-sm font-black text-emerald-600">{product.price}</p>
						<p class="mt-3 text-sm leading-6 text-slate-600">{product.note}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>
</div>
