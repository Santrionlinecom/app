<script lang="ts">
	export let data;

	const org = data?.org;
	const memberPending = data?.memberPending;
	const orgPending = data?.orgPending;
	const orgRejected = data?.orgRejected;
</script>

<svelte:head>
	<title>Menunggu Persetujuan</title>
</svelte:head>

<section class="min-h-[70vh] flex items-center justify-center px-4 py-12">
	<div class="max-w-2xl w-full rounded-3xl border bg-white p-8 shadow-xl text-center space-y-4">
		<div class="text-5xl">⏳</div>
		<h1 class="text-2xl font-bold text-slate-800">Akun Menunggu Persetujuan</h1>
		{#if org}
			<p class="text-slate-600">
				Lembaga: <span class="font-semibold">{org.name}</span>
			</p>
		{/if}
		{#if orgPending}
			<p class="text-sm text-slate-500">
				Lembaga kamu masih dalam proses verifikasi admin sistem. Setelah aktif, profil akan tampil di halaman publik.
			</p>
		{/if}
		{#if orgRejected}
			<p class="text-sm text-red-600">
				Pendaftaran lembaga kamu ditolak. Silakan perbarui data dan daftar ulang atau hubungi admin sistem.
			</p>
		{/if}
		{#if memberPending}
			<p class="text-sm text-slate-500">
			Pendaftaranmu sudah masuk dan menunggu persetujuan admin lembaga. Silakan tunggu pemberitahuan.
			</p>
		{/if}
		<div class="pt-4">
			<form method="POST" action="/logout">
				<button type="submit" class="btn btn-outline">Keluar</button>
			</form>
		</div>
	</div>
</section>
