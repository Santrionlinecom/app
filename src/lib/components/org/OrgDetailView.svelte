<script lang="ts">
	import OrgMediaSlider from '$lib/components/org/OrgMediaSlider.svelte';

	export let org;
	export let typePath = '';
	export let media: Array<{ id: string; url: string }> = [];
	export let members: Array<{
		id: string;
		username: string | null;
		role: string | null;
		orgStatus?: string | null;
	}> = [];

	const formatOrgType = (value?: string) => {
		if (!value) return '-';
		if (value === 'tpq') return 'TPQ';
		if (value === 'rumah-tahfidz') return 'Rumah Tahfidz';
		return value.charAt(0).toUpperCase() + value.slice(1);
	};

	const memberRoleByType: Record<string, string> = {
		pondok: 'santri',
		masjid: 'jamaah',
		musholla: 'jamaah',
		tpq: 'santri',
		'rumah-tahfidz': 'santri'
	};
	const orgType = org?.type ?? typePath;
	const memberRole = memberRoleByType[orgType] || 'anggota';
	const memberLabel = memberRole === 'jamaah' ? 'Jamaah' : memberRole === 'santri' ? 'Santri' : 'Anggota';
	const memberRefLink = org?.slug ? `/${typePath}/${org.slug}/daftar?ref=anggota` : '';

	const roleLabels: Record<string, string> = {
		admin: 'Admin',
		ustadz: 'Ustadz',
		ustadzah: 'Ustadzah',
		tamir: "Ta'mir",
		bendahara: 'Bendahara',
		santri: 'Santri',
		jamaah: 'Jamaah',
		alumni: 'Alumni'
	};
	const roleOrder = ['admin', 'ustadz', 'ustadzah', 'tamir', 'bendahara', 'santri', 'jamaah', 'alumni'];
	const normalizeRole = (value?: string | null) => (value ?? '').toLowerCase();
	const displayMemberName = (member: { id: string; username: string | null }) => member.username || member.id;
	let groupedMembers: Array<{ role: string; label: string; items: typeof members }> = [];

	$: groupedMembers = (() => {
		const buckets = new Map<string, typeof members>();
		for (const member of members ?? []) {
			const roleKey = normalizeRole(member.role);
			if (!roleKey) continue;
			const list = buckets.get(roleKey) ?? [];
			list.push(member);
			buckets.set(roleKey, list);
		}

		const ordered: Array<{ role: string; label: string; items: typeof members }> = [];
		for (const role of roleOrder) {
			const list = buckets.get(role);
			if (list?.length) {
				ordered.push({ role, label: roleLabels[role] ?? role, items: list });
				buckets.delete(role);
			}
		}
		for (const [role, list] of buckets.entries()) {
			if (list?.length) {
				ordered.push({ role, label: roleLabels[role] ?? role, items: list });
			}
		}
		return ordered;
	})();
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

	<OrgMediaSlider media={media} orgName={org?.name ?? ''} />

	<div class="rounded-2xl border bg-white p-6 shadow-sm space-y-3">
		<h2 class="text-lg font-semibold text-slate-800">Informasi</h2>
		<ul class="text-sm text-slate-600 space-y-2">
			<li>Jenis: {formatOrgType(org?.type)}</li>
			{#if org?.contactPhone}
				<li>Kontak: {org.contactPhone}</li>
			{/if}
			<li>Slug: {org?.slug}</li>
		</ul>
		{#if org?.status === 'active'}
			<div class="flex flex-wrap justify-center gap-2">
				<a href={`/${typePath}/${org.slug}/daftar`} class="btn btn-primary">Daftar Anggota</a>
				{#if memberRefLink}
					<a href={memberRefLink} class="btn btn-outline">Link Pendaftaran {memberLabel}</a>
				{/if}
			</div>
		{:else}
			<p class="text-sm text-slate-500">Lembaga belum aktif, pendaftaran anggota belum dibuka.</p>
		{/if}
	</div>

	{#if groupedMembers.length}
		<div class="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
			<h2 class="text-lg font-semibold text-slate-800">Struktur & Link Bio</h2>
			{#each groupedMembers as group}
				<div class="space-y-2">
					<div class="flex items-center justify-between gap-2">
						<p class="text-sm font-semibold text-slate-700">{group.label}</p>
						<span class="text-xs text-slate-500">{group.items.length} orang</span>
					</div>
					<div class="flex flex-wrap gap-2">
						{#each group.items as member}
							<a
								href={`/u/${member.id}`}
								class="badge badge-outline text-xs transition hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
							>
								{displayMemberName(member)}
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="rounded-2xl border border-dashed bg-white p-6 text-sm text-slate-500">
			Belum ada data struktur lembaga.
		</div>
	{/if}
</section>
