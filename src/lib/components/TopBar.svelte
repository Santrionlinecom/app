<script lang="ts">
	import { page } from '$app/stores';
	import LembagaSwitcher from './LembagaSwitcher.svelte';
	import type { LembagaAktif } from '$lib/stores/lembagaAktif';

	export let title = 'Dashboard';
	export let subtitle = '';

	type SwitcherPageData = {
		lembagaList?: LembagaAktif[];
		org?: LembagaAktif | null;
		user?: {
			id?: string | null;
			username?: string | null;
			email?: string | null;
			role?: string | null;
			avatarUrl?: string | null;
		} | null;
	};

	const roleLabelMap: Record<string, string> = {
		SUPER_ADMIN: 'Super Admin',
		super_admin: 'Super Admin',
		admin: 'Admin',
		kepala_tpq: 'Kepala TPQ',
		kepala_tahfidz: 'Kepala Tahfidz',
		koordinator: 'Koordinator',
		wali_kelas: 'Wali Kelas',
		pengasuh: 'Pengasuh',
		musyrif: 'Musyrif',
		ustadz: 'Guru',
		ustadzah: 'Guru',
		santri: 'Santri',
		alumni: 'Alumni',
		wali: 'Wali',
		jamaah: 'Jamaah',
		operator: 'Operator',
		bendahara: 'Bendahara'
	};

	$: switcherData = $page.data as SwitcherPageData;
	$: currentUser = switcherData?.user ?? null;

	// Identitas diambil dari sesi aktif. Sebelumnya nilai ini ditulis mati
	// sebagai "MY / Admin / Superadmin" sehingga salah untuk setiap pengguna lain.
	$: displayName = currentUser?.username || currentUser?.email || 'Pengguna';
	$: roleLabel = roleLabelMap[currentUser?.role ?? ''] ?? 'Pengguna';
	$: avatarUrl = currentUser?.avatarUrl?.trim() || '';
	$: initials =
		displayName
			.split(/[\s@._-]+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part: string) => part[0]?.toUpperCase())
			.join('') || 'SO';
</script>

<header
	class="sticky top-0 z-30 border-b border-so-border/70 bg-so-cream/86 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8"
>
	<div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
		<div>
			<div class="flex items-center gap-3">
				<button
					class="grid h-10 w-10 place-items-center rounded-xl border border-so-border bg-white text-so-green lg:hidden"
					aria-label="Menu">☰</button
				>
				<div>
					<h1 class="font-display text-2xl font-bold tracking-tight text-so-green md:text-3xl">
						{title}
					</h1>
					{#if subtitle}<p class="mt-1 text-sm text-so-muted">{subtitle}</p>{/if}
				</div>
			</div>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<LembagaSwitcher
				lembagaList={switcherData?.lembagaList ?? []}
				fallbackLembaga={switcherData?.org ?? null}
				currentUser={switcherData?.user ?? null}
			/>
			<label class="relative min-w-[240px] flex-1 sm:min-w-[320px] xl:w-[360px] xl:flex-none">
				<span class="sr-only">Cari</span>
				<span class="absolute left-3 top-1/2 -translate-y-1/2 text-so-muted" aria-hidden="true"
					>⌕</span
				>
				<input
					class="so-focus h-11 w-full rounded-xl border border-so-border bg-white/80 pl-9 pr-4 text-sm shadow-sm"
					placeholder="Cari santri, setoran, laporan..."
				/>
			</label>
			<button
				class="grid h-11 w-11 place-items-center rounded-xl border border-so-border bg-white text-so-green shadow-sm"
				aria-label="Notifikasi">🔔</button
			>
			<div
				class="flex items-center gap-3 rounded-xl border border-so-border bg-white px-3 py-2 shadow-sm"
			>
				{#if avatarUrl}
					<img
						src={avatarUrl}
						alt=""
						class="h-9 w-9 rounded-full object-cover"
						width="36"
						height="36"
					/>
				{:else}
					<div
						class="grid h-9 w-9 place-items-center rounded-full bg-so-green text-sm font-black text-white"
						aria-hidden="true"
					>
						{initials}
					</div>
				{/if}
				<div class="hidden sm:block">
					<p class="max-w-[10rem] truncate text-sm font-bold text-so-ink">{displayName}</p>
					<p class="text-xs text-so-muted">{roleLabel}</p>
				</div>
			</div>
		</div>
	</div>
</header>
