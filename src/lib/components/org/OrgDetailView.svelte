<script lang="ts">
	export let org;
	export let typePath = '';
</script>

<section class="max-w-4xl mx-auto py-10 px-4 space-y-6">
	<header class="space-y-2 text-center">
		<p class="text-sm uppercase tracking-[0.3em] text-emerald-500">Profil Lembaga</p>
		<h1 class="text-3xl md:text-4xl font-bold text-slate-900">{org?.name}</h1>
		{#if org?.city || org?.address}
			<p class="text-slate-600">{org?.address || ''} {org?.city || ''}</p>
		{/if}
		<div class="flex justify-center gap-2">
			<span class="badge {org?.status === 'active' ? 'badge-success' : 'badge-warning'}">
				{org?.status === 'active' ? 'Aktif' : 'Menunggu'}
			</span>
		</div>
	</header>

	<div class="rounded-2xl border bg-white p-6 shadow-sm space-y-3">
		<h2 class="text-lg font-semibold text-slate-800">Informasi</h2>
		<ul class="text-sm text-slate-600 space-y-2">
			<li>Jenis: {org?.type}</li>
			{#if org?.contactPhone}
				<li>Kontak: {org.contactPhone}</li>
			{/if}
			<li>Slug: {org?.slug}</li>
		</ul>
		{#if org?.status === 'active'}
			<a href={`/${typePath}/${org.slug}/daftar`} class="btn btn-primary">Daftar Anggota</a>
		{:else}
			<p class="text-sm text-slate-500">Lembaga belum aktif, pendaftaran anggota belum dibuka.</p>
		{/if}
	</div>
</section>
