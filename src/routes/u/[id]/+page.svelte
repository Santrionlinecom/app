<script lang="ts">
	export let data;

	const profile = data.profile;
	const org = data.org;

	const roleLabels: Record<string, string> = {
		SUPER_ADMIN: 'Super Admin',
		admin: 'Admin',
		ustadz: 'Ustadz',
		ustadzah: 'Ustadzah',
		santri: 'Santri',
		alumni: 'Alumni',
		jamaah: 'Jamaah',
		tamir: "Ta'mir",
		bendahara: 'Bendahara'
	};

	const formatOrgType = (value?: string | null) => {
		if (!value) return '-';
		if (value === 'tpq') return 'TPQ';
		if (value === 'rumah-tahfidz') return 'Rumah Tahfidz';
		return value.charAt(0).toUpperCase() + value.slice(1);
	};

	const displayName = profile?.username || profile?.id || 'Profil';
	const roleLabel = roleLabels[profile?.role ?? ''] ?? profile?.role ?? 'Pengguna';
	const orgLink = org?.slug && org?.type ? `/${org.type}/${org.slug}` : null;
	const avatarEmoji = profile?.gender === 'wanita' ? '👩' : profile?.gender === 'pria' ? '👨' : '👤';

	const pageTitle = `${displayName} - ${roleLabel} | SantriOnline`;
	const description = org
		? `${displayName} adalah ${roleLabel} di ${org.name}.`
		: `${displayName} adalah ${roleLabel} di SantriOnline.`;
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={description} />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-blue-50/40 py-10">
	<div class="mx-auto flex max-w-3xl flex-col gap-6 px-4">
		<section class="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl">
			<div class="flex flex-wrap items-center gap-4">
				<div class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
					{avatarEmoji}
				</div>
				<div class="space-y-1">
					<h1 class="text-2xl font-bold text-slate-900">{displayName}</h1>
					<div class="flex flex-wrap items-center gap-2 text-sm text-slate-600">
						<span class="badge badge-outline">{roleLabel}</span>
						{#if org}
							<span class="badge badge-ghost">{formatOrgType(org.type)}</span>
						{/if}
					</div>
				</div>
			</div>
		</section>

		<section class="grid gap-4 md:grid-cols-2">
			<div class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
				<h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Peran</h2>
				<p class="mt-2 text-lg font-semibold text-slate-900">{roleLabel}</p>
				{#if profile?.orgStatus}
					<p class="mt-1 text-sm text-slate-500">Status lembaga: {profile.orgStatus}</p>
				{/if}
			</div>
			<div class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
				<h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Lembaga</h2>
				{#if org}
					<p class="mt-2 text-lg font-semibold text-slate-900">{org.name}</p>
					<p class="text-sm text-slate-500">{formatOrgType(org.type)}</p>
					{#if orgLink}
						<a class="mt-3 inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800" href={orgLink}>
							Kunjungi profil lembaga >
						</a>
					{/if}
				{:else}
					<p class="mt-2 text-sm text-slate-500">Belum terhubung ke lembaga.</p>
				{/if}
			</div>
		</section>

		<section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Tentang Lembaga</h2>
			{#if org}
				<p class="mt-2 text-sm text-slate-600">
					{org.address || ''} {org.city || ''}
				</p>
				{#if org.contactPhone}
					<p class="mt-1 text-sm text-slate-600">Kontak: {org.contactPhone}</p>
				{/if}
			{:else}
				<p class="mt-2 text-sm text-slate-500">
					Data lembaga akan tampil setelah akun terhubung ke salah satu lembaga di SantriOnline.
				</p>
			{/if}
		</section>
	</div>
</div>
