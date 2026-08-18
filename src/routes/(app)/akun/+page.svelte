<script lang="ts">
	import { onMount } from 'svelte';
	import PushNotificationToggle from '$lib/components/PushNotificationToggle.svelte';
	import {
		ArrowRight,
		BadgeCheck,
		Building2,
		Camera,
		Copy,
		ExternalLink,
		ImageUp,
		KeyRound,
		MapPin,
		Plus,
		Share2,
		Smartphone,
		UserRound,
		X
	} from 'lucide-svelte';
	import KoordinatInput from '$lib/components/admin/KoordinatInput.svelte';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	type FormState = {
		success?: boolean;
		message?: string;
		type?: string;
	};

	type ManagedLembaga = {
		id: string;
		name: string;
		type: string;
		slug?: string | null;
		status?: string | null;
		address?: string | null;
		city?: string | null;
		isAktif?: number | null;
		createdAt?: number | null;
		activeAddonCount?: number | null;
	};

	type AddonAktif = {
		id: string;
		tipeAddon: string;
		status: string;
		berlakuHingga?: number | null;
	};

	type OrgMediaItem = {
		id: string;
		url: string;
		createdAt: number;
		createdBy: string | null;
	};

	const baseUrl = 'https://app.santrionline.com';

	const typeLabels: Record<string, string> = {
		tpq: 'TPQ',
		pondok: 'Pondok Pesantren',
		masjid: 'Masjid',
		musholla: 'Musholla',
		'rumah-tahfidz': 'Rumah Tahfidz',
		rumah_tahfidz: 'Rumah Tahfidz'
	};

	const roleLabels: Record<string, string> = {
		admin: 'Admin Lembaga',
		ustadz: 'Ustadz',
		ustadzah: 'Ustadzah',
		santri: 'Santri',
		wali: 'Wali Santri',
		jamaah: 'Jamaah',
		tamir: 'Takmir',
		bendahara: 'Bendahara',
		SUPER_ADMIN: 'Super Admin'
	};

	const addonLabels: Record<string, string> = {
		lembaga_tambahan: 'Lembaga Tambahan',
		modul_masjid: 'Modul Masjid',
		modul_tahfidz: 'Modul Rumah Tahfidz',
		modul_musholla: 'Modul Musholla',
		santri_unlimited: 'Santri Unlimited',
		raport_premium: 'Raport PDF Premium'
	};

	$: profile = data.profile;
	$: isSuperAdminAccount = ['SUPER_ADMIN', 'SUPERADMIN'].includes(
		`${profile?.role ?? ''}`.trim().replace(/[-\s]+/g, '_').toUpperCase()
	);
	$: org = data.org;
	$: managedLembaga = (data.managedLembaga ?? []) as ManagedLembaga[];
	$: addonAktif = (data.addonAktif ?? []) as AddonAktif[];
	$: orgMedia = (data.orgMedia ?? []) as OrgMediaItem[];
	$: formState = (form ?? {}) as FormState;
	$: displayName = profile?.username || profile?.email || 'Pengguna SantriOnline';
	$: avatarUrl = profile?.avatarUrl ?? '';
	$: publicHandle = profile?.publicHandle || profile?.id || '';
	$: bioLink = publicHandle ? `${baseUrl}/u/${publicHandle}` : '';
	$: activeOrgName = org?.name ?? managedLembaga[0]?.name ?? 'Belum memilih lembaga';
	$: activeLembagaCount = managedLembaga.filter((item) => item.isAktif !== 0).length;
	$: orgPublicUrl = org ? `${baseUrl}/${org.type}/${org.slug}` : '';
	$: memberLabel = org && (org.type === 'masjid' || org.type === 'musholla') ? 'jamaah' : 'santri';
	$: shareLink = org ? `${baseUrl}/${org.type}/${org.slug}/daftar?ref=anggota` : '';
	$: shareMessage =
		org && shareLink
			? `Assalamu'alaikum, silakan daftar sebagai ${memberLabel} ${org.name} melalui link ini: ${shareLink}`
			: '';
	$: waShareLink = shareMessage ? `https://wa.me/?text=${encodeURIComponent(shareMessage)}` : '';

	let locationOrgId = '';
	let orgAddress = '';
	let orgKota = '';
	let orgProvinsi = '';
	let orgLatitude: number | null = null;
	let orgLongitude: number | null = null;
	$: if (org?.id && locationOrgId !== org.id) {
		locationOrgId = org.id;
		orgAddress = org.address ?? '';
		orgKota = org.kota ?? org.city ?? '';
		orgProvinsi = org.provinsi ?? '';
		orgLatitude = org.latitude ?? null;
		orgLongitude = org.longitude ?? null;
	}

	let copyMessage = '';
	let canNativeShare = false;
	let activeSection = 'ringkasan';
	let accountSectionNav: HTMLElement | null = null;

	const accountNavItems = [
		{ id: 'ringkasan', label: 'Ringkasan', icon: UserRound, show: () => true },
		{ id: 'lembaga', label: 'Lembaga', icon: Building2, show: () => true },
		{ id: 'tautan', label: 'Tautan', icon: Share2, show: () => Boolean(bioLink || shareLink) },
		{ id: 'lokasi', label: 'Lokasi', icon: MapPin, show: () => Boolean(org && data.canManageOrgLocation) },
		{ id: 'profil', label: 'Profil', icon: Camera, show: () => true },
		{ id: 'keamanan', label: 'Keamanan', icon: KeyRound, show: () => true }
	];

	$: visibleAccountNavItems = accountNavItems.filter((item) => item.show());

	const revealActiveLink = (sectionId: string) => {
		requestAnimationFrame(() => {
			const scroller = accountSectionNav?.querySelector<HTMLElement>('.account-nav-scroll');
			const link = accountSectionNav?.querySelector<HTMLElement>(`[data-account-section="${sectionId}"]`);
			if (!scroller || !link) return;

			const scrollerRect = scroller.getBoundingClientRect();
			const linkRect = link.getBoundingClientRect();
			if (linkRect.left >= scrollerRect.left && linkRect.right <= scrollerRect.right) return;

			link.scrollIntoView({
				behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
				block: 'nearest',
				inline: 'center'
			});
		});
	};

	onMount(() => {
		canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
		const shellHeader = document.querySelector<HTMLElement>('[data-app-shell-header]');
		const syncNavigationMetrics = () => {
			const headerHeight = shellHeader?.getBoundingClientRect().height ?? 0;
			const navHeight = accountSectionNav?.getBoundingClientRect().height ?? 0;
			document.documentElement.style.setProperty('--account-shell-header-height', `${Math.ceil(headerHeight)}px`);
			document.documentElement.style.setProperty('--account-section-nav-height', `${Math.ceil(navHeight)}px`);
		};
		const metricsObserver = new ResizeObserver(syncNavigationMetrics);
		if (shellHeader) metricsObserver.observe(shellHeader);
		if (accountSectionNav) metricsObserver.observe(accountSectionNav);
		window.addEventListener('resize', syncNavigationMetrics);
		syncNavigationMetrics();

		const sections = visibleAccountNavItems
			.map((item) => document.getElementById(item.id))
			.filter((section): section is HTMLElement => Boolean(section));
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
				if (visible?.target.id) {
					activeSection = visible.target.id;
					revealActiveLink(activeSection);
				}
			},
			{ rootMargin: '-28% 0px -58% 0px', threshold: [0.05, 0.25, 0.55] }
		);

		sections.forEach((section) => observer.observe(section));
		return () => {
			observer.disconnect();
			metricsObserver.disconnect();
			window.removeEventListener('resize', syncNavigationMetrics);
			document.documentElement.style.removeProperty('--account-shell-header-height');
			document.documentElement.style.removeProperty('--account-section-nav-height');
		};
	});

	const flash = (message: string) => {
		copyMessage = message;
		setTimeout(() => {
			copyMessage = '';
		}, 2400);
	};

	const copyText = async (value: string, successMessage: string) => {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			flash(successMessage);
		} catch (err) {
			console.error('Copy text error:', err);
			flash('Gagal menyalin link.');
		}
	};

	const shareNative = async (title: string, text: string, url: string) => {
		if (!canNativeShare || !url || typeof navigator.share !== 'function') return;
		try {
			await navigator.share({ title, text, url });
		} catch (err) {
			if ((err as DOMException)?.name === 'AbortError') return;
			console.error('Native share error:', err);
			flash('Gagal membuka menu bagikan.');
		}
	};

	const formatType = (value?: string | null) => typeLabels[value ?? ''] ?? value ?? 'Lembaga';
	const formatRole = (value?: string | null) => roleLabels[value ?? ''] ?? value ?? 'Pengguna';
	const formatStatus = (value?: string | null) => {
		if (!value) return 'Belum aktif';
		if (value === 'active' || value === 'aktif') return 'Aktif';
		if (value === 'pending') return 'Menunggu verifikasi';
		if (value === 'rejected') return 'Ditolak';
		return value;
	};
	const formatAddon = (value: string) => addonLabels[value] ?? value.replace(/_/g, ' ');
	const formatLongDate = (value?: number | null) =>
		value
			? new Intl.DateTimeFormat('id-ID', {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				}).format(value)
			: '-';

	const getInitials = (value?: string | null) =>
		(value || 'SO')
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0])
			.join('')
			.toUpperCase();
</script>

<svelte:head>
	<title>Akun - SantriOnline App</title>
	<meta
		name="description"
		content="Kelola profil, lembaga, addon, dan keamanan akun SantriOnline."
	/>
</svelte:head>

<div class="min-h-screen bg-so-cream font-sans text-so-ink">
	<div class="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
		<section id="ringkasan" class="account-anchor rounded-so-lg border border-so-border bg-white p-5 shadow-card md:p-6">
			<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
				<div class="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
					{#if avatarUrl}
						<img
							src={avatarUrl}
							alt={`Foto profil ${displayName}`}
							class="h-20 w-20 shrink-0 rounded-xl border border-so-border object-cover shadow-card"
							loading="lazy"
						/>
					{:else}
						<div
							class="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-so-green text-2xl font-black text-white"
						>
							{getInitials(displayName)}
						</div>
					{/if}
					<div class="min-w-0">
						<p class="text-sm font-bold text-so-gold">Akun SantriOnline</p>
						<h2 class="mt-1 break-words text-2xl font-black text-so-green md:text-3xl">
							{displayName}
						</h2>
						<p class="mt-2 max-w-2xl text-sm leading-6 text-so-muted">
							Pilih bagian di bawah untuk mengatur profil, lembaga, tautan publik, dan keamanan akun dengan lebih cepat.
						</p>
						<div class="mt-4 flex flex-wrap gap-2">
							<span class="rounded-full border border-so-border bg-so-cream px-3 py-1 text-xs font-bold text-so-muted">
								{profile?.email}
							</span>
							<span class="rounded-full border border-so-green/20 bg-so-green/10 px-3 py-1 text-xs font-bold text-so-green">
								{formatRole(profile?.role)}
							</span>
							<span class="rounded-full border border-so-border bg-white px-3 py-1 text-xs font-bold text-so-muted">
								Bergabung {formatLongDate(profile?.createdAt)}
							</span>
						</div>
					</div>
				</div>

				<div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
					<div class="rounded-xl border border-so-border bg-so-cream p-4">
						<p class="text-xs font-bold text-so-muted">Lembaga dikelola</p>
						<p class="mt-2 text-2xl font-black text-so-green">{managedLembaga.length}</p>
						<p class="mt-1 text-xs text-so-muted">{activeLembagaCount} aktif</p>
					</div>
					<div class="rounded-xl border border-so-border bg-so-cream p-4">
						<p class="text-xs font-bold text-so-muted">Addon aktif</p>
						<p class="mt-2 text-2xl font-black text-so-green">{addonAktif.length}</p>
						<p class="mt-1 text-xs text-so-muted">Pada lembaga utama</p>
					</div>
					<div class="rounded-xl border border-so-border bg-so-cream p-4">
						<p class="text-xs font-bold text-so-muted">Lembaga utama</p>
						<p class="mt-2 truncate text-sm font-black text-so-green">{activeOrgName}</p>
						<p class="mt-1 text-xs text-so-muted">{org ? formatType(org.type) : 'Atur di halaman Lembaga'}</p>
					</div>
				</div>
			</div>
		</section>

		<PushNotificationToggle />

		<nav bind:this={accountSectionNav} class="account-section-nav" aria-label="Navigasi pengaturan akun">
			<div class="account-nav-scroll">
				{#each visibleAccountNavItems as item}
					<a
						class="account-nav-link"
						class:account-nav-link-active={activeSection === item.id}
						data-account-section={item.id}
						href={`#${item.id}`}
						aria-current={activeSection === item.id ? 'location' : undefined}
						on:click={() => (activeSection = item.id)}
					>
						<svelte:component this={item.icon} size={17} aria-hidden="true" />
						<span>{item.label}</span>
					</a>
				{/each}
				<a class="account-nav-link" href="/akun/perangkat">
					<Smartphone size={17} aria-hidden="true" />
					<span>Perangkat</span>
					<ArrowRight class="ml-0.5" size={14} aria-hidden="true" />
				</a>
			</div>
		</nav>

		<div id="lembaga" class="account-anchor grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
			<section class="rounded-so-lg border border-so-border bg-white p-5 shadow-card md:p-6">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p class="text-sm font-bold text-so-gold">Multi-Lembaga</p>
						<h2 class="mt-1 text-xl font-black text-so-green">Lembaga Yang Dikelola</h2>
						<p class="mt-2 text-sm leading-6 text-so-muted">
							Daftar ini mengikuti arsitektur baru: satu akun admin dapat memegang beberapa lembaga.
						</p>
					</div>
					<div class="flex flex-col gap-2 sm:flex-row">
						<a class="btn-secondary" href="/lembaga">Kelola</a>
						<a class="btn-primary" href="/lembaga/tambah">
							<Plus size={17} />
							Tambah
						</a>
					</div>
				</div>

				{#if managedLembaga.length > 0}
					<div class="mt-5 grid gap-4 md:grid-cols-2">
						{#each managedLembaga as lembaga}
							<article class="rounded-xl border border-so-border bg-so-cream p-4">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<h3 class="truncate text-base font-black text-so-green">{lembaga.name}</h3>
										<div class="mt-2 flex flex-wrap gap-2">
											<span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-so-green">
												{formatType(lembaga.type)}
											</span>
											<span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-so-muted">
												{formatStatus(lembaga.status)}
											</span>
										</div>
									</div>
									<div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-so-green text-xs font-black text-white">
										{getInitials(lembaga.name)}
									</div>
								</div>
								<div class="mt-4 grid gap-3 sm:grid-cols-2">
									<div class="rounded-lg bg-white p-3">
										<p class="text-xs font-bold text-so-muted">Addon aktif</p>
										<p class="mt-1 text-lg font-black text-so-green">{lembaga.activeAddonCount ?? 0}</p>
									</div>
									<div class="rounded-lg bg-white p-3">
										<p class="text-xs font-bold text-so-muted">Dibuat</p>
										<p class="mt-1 text-sm font-bold text-so-green">{formatLongDate(lembaga.createdAt)}</p>
									</div>
								</div>
							</article>
						{/each}
					</div>
				{:else}
					<div class="mt-5 rounded-xl border border-dashed border-so-border bg-so-cream p-6 text-center">
						<Building2 class="mx-auto text-so-green" size={30} />
						<h3 class="mt-3 text-lg font-black text-so-green">Belum ada lembaga</h3>
						<p class="mt-2 text-sm leading-6 text-so-muted">
							Buat lembaga pertama agar dashboard, santri/jamaah, dan addon bisa dipakai.
						</p>
						<a class="btn-primary mt-4" href="/lembaga/tambah">Buat Lembaga Pertama</a>
					</div>
				{/if}
			</section>

			<section class="rounded-so-lg border border-so-border bg-white p-5 shadow-card md:p-6">
				<p class="text-sm font-bold text-so-gold">Addon</p>
				<h2 class="mt-1 text-xl font-black text-so-green">Status Fitur Berbayar</h2>
				<p class="mt-2 text-sm leading-6 text-so-muted">
					Ringkasan addon aktif untuk lembaga utama akun ini.
				</p>

				<div class="mt-5 space-y-3">
					{#if addonAktif.length > 0}
						{#each addonAktif as addon}
							<div class="flex items-center gap-3 rounded-xl border border-so-green/20 bg-so-green/8 p-3">
								<BadgeCheck class="shrink-0 text-so-green" size={19} />
								<div class="min-w-0">
									<p class="truncate text-sm font-black text-so-green">{formatAddon(addon.tipeAddon)}</p>
									<p class="text-xs text-so-muted">Aktif</p>
								</div>
							</div>
						{/each}
					{:else}
						<div class="rounded-xl border border-so-border bg-so-cream p-4">
							<p class="text-sm font-bold text-so-green">Belum ada addon aktif</p>
							<p class="mt-1 text-sm leading-6 text-so-muted">
								Katalog addon sudah tersedia. Pembayaran akan dibuka bertahap.
							</p>
						</div>
					{/if}
				</div>

				<a class="btn-primary mt-5 w-full" href="/addon">
					Buka Katalog Addon
					<ArrowRight size={17} />
				</a>
			</section>
		</div>

		{#if bioLink || shareLink}
			<section id="tautan" class="account-anchor grid gap-6 xl:grid-cols-2">
				{#if bioLink}
					<div class="rounded-so-lg border border-so-border bg-white p-5 shadow-card md:p-6">
						<p class="text-sm font-bold text-so-gold">Link Publik</p>
						<h2 class="mt-1 text-xl font-black text-so-green">Bio Profil</h2>
						<p class="mt-2 text-sm leading-6 text-so-muted">
							Bagikan profil publik untuk memperkenalkan identitas akun.
						</p>
						<div class="mt-4 rounded-xl border border-so-border bg-so-cream p-4">
							<p class="break-all text-sm font-bold text-so-green">{bioLink}</p>
						</div>
						<div class="mt-4 flex flex-col gap-2 sm:flex-row">
							<a class="btn-secondary" href={bioLink} target="_blank" rel="noopener noreferrer">
								<ExternalLink size={17} />
								Buka
							</a>
							<button class="btn-primary" type="button" on:click={() => copyText(bioLink, 'Link bio disalin.')}>
								<Copy size={17} />
								Salin
							</button>
							{#if canNativeShare}
								<button
									class="btn-secondary"
									type="button"
									on:click={() => shareNative(`Profil ${displayName}`, 'Lihat profil publik saya di SantriOnline.', bioLink)}
								>
									<Share2 size={17} />
									Bagikan
								</button>
							{/if}
						</div>
					</div>
				{/if}

				{#if shareLink}
					<div class="rounded-so-lg border border-so-border bg-white p-5 shadow-card md:p-6">
						<p class="text-sm font-bold text-so-gold">Link Pendaftaran</p>
						<h2 class="mt-1 text-xl font-black text-so-green">Daftar {formatType(org?.type)}</h2>
						<p class="mt-2 text-sm leading-6 text-so-muted">
							Gunakan link ini untuk pendaftaran {memberLabel} ke lembaga utama.
						</p>
						<div class="mt-4 rounded-xl border border-so-border bg-so-cream p-4">
							<p class="break-all text-sm font-bold text-so-green">{shareLink}</p>
						</div>
						<div class="mt-4 flex flex-col gap-2 sm:flex-row">
							<a class="btn-secondary" href={shareLink} target="_blank" rel="noopener noreferrer">
								<ExternalLink size={17} />
								Buka
							</a>
							<button class="btn-primary" type="button" on:click={() => copyText(shareLink, 'Link pendaftaran disalin.')}>
								<Copy size={17} />
								Salin
							</button>
							{#if waShareLink}
								<a class="btn-secondary" href={waShareLink} target="_blank" rel="noopener noreferrer">
									WhatsApp
								</a>
							{/if}
						</div>
					</div>
				{/if}
			</section>
		{/if}

		{#if copyMessage}
			<p class="rounded-xl border border-so-green/20 bg-white px-4 py-3 text-sm font-bold text-so-green shadow-card">
				{copyMessage}
			</p>
		{/if}

		{#if org && data.canManageOrgLocation}
			<form id="lokasi" method="POST" action="?/updateOrgLocation" class="account-anchor rounded-so-lg border border-so-border bg-white p-5 shadow-card md:p-6">
				<input type="hidden" name="orgId" value={org.id} />
				<div class="flex items-start gap-3">
					<span class="settings-icon"><MapPin size={20} /></span>
					<div>
						<p class="text-sm font-bold text-so-gold">Lokasi Lembaga</p>
						<h2 class="mt-1 text-xl font-black text-so-green">Lokasi di Peta</h2>
						<p class="mt-1 text-sm leading-6 text-so-muted">
							Lengkapi kota, provinsi, dan koordinat agar lembaga tampil di Peta Sebaran Lembaga.
						</p>
					</div>
				</div>

				<div class="mt-5 grid gap-4 lg:grid-cols-2">
					<label class="field lg:col-span-2">
						<span>Alamat</span>
						<input class="input-so" name="address" bind:value={orgAddress} placeholder="Alamat lengkap lembaga" />
					</label>
					<label class="field">
						<span>Kota/Kabupaten</span>
						<input class="input-so" name="kota" bind:value={orgKota} placeholder="Contoh: Malang" />
					</label>
					<label class="field">
						<span>Provinsi</span>
						<input class="input-so" name="provinsi" bind:value={orgProvinsi} placeholder="Contoh: Jawa Timur" />
					</label>
					<div class="lg:col-span-2">
						<KoordinatInput
							latitude={orgLatitude}
							longitude={orgLongitude}
							kota={orgKota}
							provinsi={orgProvinsi}
							on:change={(event) => {
								orgLatitude = event.detail.latitude;
								orgLongitude = event.detail.longitude;
							}}
						/>
					</div>
				</div>

				{#if formState.success && formState.type === 'org-location'}
					<p class="success-box mt-4">{formState.message ?? 'Lokasi lembaga diperbarui.'}</p>
				{:else if formState.message && formState.type === 'org-location'}
					<p class="error-box mt-4">{formState.message}</p>
				{/if}

				<div class="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<p class="text-xs leading-5 text-so-muted">Klik peta mini untuk menggeser titik koordinat secara manual.</p>
					<button class="btn-primary h-11" type="submit">Simpan Lokasi</button>
				</div>
			</form>
		{/if}

		<div id="profil" class="account-anchor grid gap-6 xl:grid-cols-2">
			<div class="settings-card">
				<div class="flex items-start gap-3">
					<span class="settings-icon"><Camera size={20} /></span>
					<div>
						<h2 class="text-lg font-black text-so-green">Foto Profil</h2>
						<p class="mt-1 text-sm leading-6 text-so-muted">Foto ini tampil di profil dan sosial media.</p>
					</div>
				</div>

				<div class="mt-5 space-y-4">
					<div class="flex items-center gap-4">
						{#if avatarUrl}
							<img
								src={avatarUrl}
								alt={`Foto profil ${displayName}`}
								class="h-20 w-20 rounded-2xl border border-so-border object-cover"
								loading="lazy"
							/>
						{:else}
							<div class="grid h-20 w-20 place-items-center rounded-2xl bg-so-green text-2xl font-black text-white">
								{getInitials(displayName)}
							</div>
						{/if}
						<div class="min-w-0 text-sm leading-6 text-so-muted">
							<p>JPG, PNG, atau WebP.</p>
							<p>Maksimal 2MB.</p>
						</div>
					</div>

					<form method="POST" action="?/updateAvatar" enctype="multipart/form-data" class="space-y-3">
						<label class="field">
							<span>Upload foto</span>
							<input class="input-so py-2" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required />
						</label>
						<button class="btn-primary w-full" type="submit">
							<ImageUp size={17} />
							Upload / Ganti Foto
						</button>
					</form>

					{#if avatarUrl}
						<form method="POST" action="?/removeAvatar">
							<button class="btn-secondary w-full text-red-700" type="submit">
								<X size={17} />
								Hapus Foto
							</button>
						</form>
					{/if}

					{#if formState.success && formState.type === 'avatar'}
						<p class="success-box">{formState.message ?? 'Foto profil diperbarui.'}</p>
					{:else if formState.message && formState.type === 'avatar'}
						<p class="error-box">{formState.message}</p>
					{/if}
				</div>
			</div>

			<form method="POST" action="?/updateProfile" class="settings-card">
				<div class="flex items-start gap-3">
					<span class="settings-icon"><UserRound size={20} /></span>
					<div>
						<h2 class="text-lg font-black text-so-green">Profil</h2>
						<p class="mt-1 text-sm leading-6 text-so-muted">Atur nama dan username publik.</p>
					</div>
				</div>

				<div class="mt-5 space-y-4">
					<label class="field">
						<span>Email</span>
						<input class="input-so bg-so-cream" value={profile?.email} readonly />
					</label>
					<label class="field">
						<span>Nama lengkap</span>
						<input
							class="input-so"
							name="displayName"
							value={profile?.username ?? ''}
							placeholder="Nama lengkap"
						/>
					</label>
					<label class="field">
						<span>Jenis kelamin</span>
						<select class="input-so" name="gender" value={profile?.gender || ''}>
							<option value="">Pilih jenis kelamin</option>
							<option value="pria">Laki-laki</option>
							<option value="wanita">Perempuan</option>
						</select>
					</label>
					<label class="field">
						<span>Username publik</span>
						<input class="input-so" name="handle" value={publicHandle} placeholder="username_unik" />
					</label>

					{#if formState.success && !formState.type}
						<p class="success-box">Profil berhasil diperbarui.</p>
					{:else if formState.message && !formState.type}
						<p class="error-box">{formState.message}</p>
					{/if}

					<button class="btn-primary w-full" type="submit">Simpan Profil</button>
				</div>
			</form>

			<form method="POST" action="?/updateWhatsapp" class="settings-card">
				<div class="flex items-start gap-3">
					<span class="settings-icon"><Smartphone size={20} /></span>
					<div>
						<h2 class="text-lg font-black text-so-green">WhatsApp</h2>
						<p class="mt-1 text-sm leading-6 text-so-muted">Nomor aktif untuk komunikasi wali/jamaah.</p>
					</div>
				</div>

				<div class="mt-5 space-y-4">
					<label class="field">
						<span>Nomor WhatsApp</span>
						<input
							class="input-so"
							name="whatsapp"
							type="tel"
							inputmode="tel"
							value={profile?.whatsapp ?? ''}
							placeholder="Contoh 087854545274"
						/>
					</label>
					<p class="text-xs leading-5 text-so-muted">Gunakan 9-15 digit angka, boleh diawali +62.</p>

					{#if formState.success && formState.type === 'whatsapp'}
						<p class="success-box">Nomor WhatsApp tersimpan.</p>
					{:else if formState.message && formState.type === 'whatsapp'}
						<p class="error-box">{formState.message}</p>
					{/if}

					<button class="btn-primary w-full" type="submit">Simpan Nomor</button>
				</div>
			</form>

			{#if isSuperAdminAccount}
				<section id="keamanan" class="account-anchor settings-card" aria-labelledby="super-admin-security-title">
					<div class="flex items-start gap-3">
						<span class="settings-icon"><BadgeCheck size={20} /></span>
						<div>
							<p class="text-xs font-black uppercase tracking-[0.16em] text-so-gold">High Security</p>
							<h2 id="super-admin-security-title" class="mt-1 text-lg font-black text-so-green">Super Admin terlindungi</h2>
							<p class="mt-2 text-sm leading-6 text-so-muted">
								Login password lokal dinonaktifkan. Gunakan akun Google resmi yang terverifikasi.
							</p>
						</div>
					</div>
					<ul class="mt-5 space-y-2 text-sm font-semibold text-so-green" aria-label="Proteksi Super Admin aktif">
						<li>✓ Google-only dan email wajib terverifikasi</li>
						<li>✓ Allowlist Super Admin bersifat fail-closed</li>
						<li>✓ Masa session maksimal 8 jam</li>
					</ul>
					<p class="mt-4 rounded-xl border border-so-gold/30 bg-so-gold/10 px-4 py-3 text-xs leading-5 text-so-muted">
						Pastikan Verifikasi 2 Langkah atau passkey aktif pada akun Google Mas Yogik.
					</p>
				</section>
			{:else}
			<form id="keamanan" method="POST" action="?/updatePassword" class="account-anchor settings-card">
				<div class="flex items-start gap-3">
					<span class="settings-icon"><KeyRound size={20} /></span>
					<div>
						<h2 class="text-lg font-black text-so-green">Keamanan</h2>
						<p class="mt-1 text-sm leading-6 text-so-muted">Perbarui password akun.</p>
					</div>
				</div>

				<div class="mt-5 space-y-4">
					<label class="field">
						<span>Password baru</span>
						<input class="input-so" name="password" type="password" minlength="6" required />
					</label>
					<label class="field">
						<span>Konfirmasi password</span>
						<input class="input-so" name="confirm" type="password" minlength="6" required />
					</label>

					{#if formState.success && formState.type === 'password'}
						<p class="success-box">Password berhasil diperbarui.</p>
					{:else if formState.message && formState.type === 'password'}
						<p class="error-box">{formState.message}</p>
					{/if}

					<button class="btn-primary w-full" type="submit">Simpan Password</button>
				</div>
			</form>
			{/if}
		</div>

		{#if orgMedia.length > 0}
			<section class="rounded-so-lg border border-so-border bg-white p-5 shadow-card md:p-6">
				<p class="text-sm font-bold text-so-gold">Media Lembaga</p>
				<h2 class="mt-1 text-xl font-black text-so-green">Foto Publik</h2>
				<div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{#each orgMedia as item}
						<div class="overflow-hidden rounded-xl border border-so-border bg-so-cream">
							<img src={item.url} alt="Foto lembaga" class="aspect-video w-full object-cover" loading="lazy" />
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</div>
</div>

<style>
	.btn-primary,
	.btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 2.75rem;
		border-radius: 0.75rem;
		font-size: 0.875rem;
		font-weight: 800;
		transition:
			border-color 160ms ease,
			background-color 160ms ease,
			color 160ms ease,
			transform 160ms ease;
	}

	.account-anchor {
		scroll-margin-top: calc(
			var(--account-shell-header-height, 0px) + var(--account-section-nav-height, 0px) + 1.5rem
		);
	}

	.account-section-nav {
		position: sticky;
		top: calc(var(--account-shell-header-height, 0px) + 0.5rem);
		z-index: 20;
		max-width: 100%;
		border: 1px solid rgb(220 211 190 / 0.9);
		border-radius: 1rem;
		background: rgb(255 255 255 / 0.92);
		padding: 0.5rem;
		box-shadow: 0 10px 30px rgb(27 67 50 / 0.1);
		backdrop-filter: blur(14px);
	}

	.account-nav-scroll {
		display: flex;
		max-width: 100%;
		gap: 0.5rem;
		overflow-x: auto;
		scroll-snap-type: x proximity;
		scrollbar-width: thin;
		overscroll-behavior-inline: contain;
	}

	.account-nav-link {
		display: inline-flex;
		min-height: 2.75rem;
		flex: 0 0 auto;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		scroll-snap-align: start;
		white-space: nowrap;
		border: 1px solid transparent;
		border-radius: 0.75rem;
		padding: 0 0.85rem;
		font-size: 0.8125rem;
		font-weight: 800;
		color: var(--color-so-muted);
		transition:
			background-color 160ms ease,
			border-color 160ms ease,
			color 160ms ease,
			box-shadow 160ms ease;
	}

	.account-nav-link:hover {
		border-color: rgb(27 67 50 / 0.16);
		background: rgb(27 67 50 / 0.05);
		color: var(--color-so-green);
	}

	.account-nav-link-active {
		border-color: rgb(27 67 50 / 0.2);
		background: linear-gradient(135deg, var(--color-so-green) 0%, var(--color-so-green-2) 100%);
		color: #fff;
		box-shadow: 0 6px 16px rgb(27 67 50 / 0.2);
	}

	.account-nav-link:focus-visible {
		outline: 3px solid rgb(201 168 76 / 0.35);
		outline-offset: 2px;
	}

	@media (max-width: 639px) {
		.account-section-nav {
			margin-inline: -0.25rem;
			border-radius: 0.875rem;
			padding: 0.375rem;
		}

		.account-nav-link {
			padding-inline: 0.75rem;
			font-size: 0.75rem;
		}
	}

	.btn-primary {
		background: linear-gradient(135deg, var(--color-so-green) 0%, var(--color-so-green-2) 100%);
		color: #fff;
		padding: 0 1.25rem;
		box-shadow: 0 4px 12px rgb(27 67 50 / 0.25);
	}

	.btn-primary:hover {
		background: linear-gradient(135deg, var(--color-so-green-2) 0%, var(--color-so-green-3) 100%);
		box-shadow: 0 6px 16px rgb(27 67 50 / 0.35);
	}

	.btn-primary:focus {
		outline: none;
		box-shadow: 0 0 0 4px rgb(27 67 50 / 0.2);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.btn-secondary {
		border: 1px solid var(--color-so-border);
		background: #fff;
		color: var(--color-so-green);
		padding: 0 1.25rem;
	}

	.btn-secondary:hover {
		border-color: rgb(27 67 50 / 0.35);
		background: rgb(27 67 50 / 0.03);
	}

	.btn-secondary:focus {
		outline: none;
		border-color: var(--color-so-green);
		box-shadow: 0 0 0 4px rgb(27 67 50 / 0.15);
	}

	.btn-secondary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.settings-card {
		border: 1px solid var(--color-so-border);
		background: #fff;
		border-radius: var(--radius-lg);
		padding: 1.25rem;
		box-shadow: var(--shadow-card);
	}

	.settings-icon {
		display: grid;
		width: 2.5rem;
		height: 2.5rem;
		place-items: center;
		border-radius: 0.75rem;
		background: rgb(27 67 50 / 0.1);
		color: var(--color-so-green);
	}

	.field {
		display: grid;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 800;
		color: var(--color-so-ink);
	}

	.input-so {
		width: 100%;
		min-width: 0;
		min-height: 2.75rem;
		border-radius: 0.75rem;
		border: 1px solid var(--color-so-border);
		background: #fff;
		padding: 0 0.875rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-so-ink);
		outline: none;
		transition: border-color 160ms ease, box-shadow 160ms ease;
	}

	.input-so::placeholder {
		color: rgb(148 163 184);
	}

	.input-so:focus {
		border-color: var(--color-so-gold);
		box-shadow: 0 0 0 4px rgb(201 168 76 / 0.2);
	}

	.input-so:disabled,
	.input-so:read-only {
		background: var(--color-so-cream);
		cursor: not-allowed;
		opacity: 0.7;
	}

	.success-box,
	.error-box {
		border-radius: 0.75rem;
		padding: 0.875rem 1rem;
		font-size: 0.875rem;
		font-weight: 700;
	}

	.success-box {
		border: 1px solid rgb(27 67 50 / 0.2);
		background: rgb(27 67 50 / 0.08);
		color: var(--color-so-green);
	}

	.error-box {
		border: 1px solid rgb(220 38 38 / 0.2);
		background: rgb(254 242 242);
		color: rgb(185 28 28);
	}
</style>
