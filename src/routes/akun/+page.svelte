<script lang="ts">
	import { onMount } from 'svelte';
	import type { ActionData, PageData } from './$types';
	import OrgLocationFields from '$lib/components/org/OrgLocationFields.svelte';
	export let data: PageData;
	export let form: ActionData;

	const profile = data.profile;
	const org = data.org;
	const orgMediaRoles = new Set(['admin', 'ustadz', 'ustadzah']);
	const canManageOrgMedia = orgMediaRoles.has(profile?.role ?? '');

	type OrgMediaItem = {
		id: string;
		url: string;
		createdAt: number;
		createdBy: string | null;
	};

	let orgMedia: OrgMediaItem[] = data.orgMedia ?? [];
	let uploadingOrgMedia = false;
	let orgMediaError = '';
	let orgMediaSuccess = '';
	let deletingMediaId: string | null = null;
	let orgMediaInput: HTMLInputElement | null = null;

	let orgType = 'tpq';
	let orgName = '';
	let orgSlug = '';
	let orgPhone = '';
	let adminName = profile?.username ?? '';
	const adminEmail = profile?.email ?? '';
	let slugManual = false;
	let copyMessage = '';
	let bioCopyMessage = '';
	let canNativeShare = false;

	const baseUrl = 'https://app.santrionline.com';
	$: bioLink = profile?.id ? `${baseUrl}/u/${profile.id}` : '';
	const memberLabelByType: Record<string, string> = {
		tpq: 'Santri'
	};
	$: memberLabel = org ? memberLabelByType[org.type] ?? 'Anggota' : 'Anggota';
	$: orgPublicUrl = org ? `${baseUrl}/${org.type}/${org.slug}` : '';
	$: shareLink = org ? `${baseUrl}/${org.type}/${org.slug}/daftar?ref=anggota` : '';
	$: shareMessage =
		org && shareLink
			? `Untuk ${memberLabel.toLowerCase()} yang ingin mendaftar ke ${org.slug} gunakan link ini: ${shareLink}`
			: '';
	$: waShareLink = shareMessage ? `https://wa.me/?text=${encodeURIComponent(shareMessage)}` : '';

	onMount(() => {
		canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
	});

	const flashMessage = (target: 'bio' | 'share', message: string) => {
		if (target === 'bio') {
			bioCopyMessage = message;
			setTimeout(() => {
				bioCopyMessage = '';
			}, 2500);
			return;
		}

		copyMessage = message;
		setTimeout(() => {
			copyMessage = '';
		}, 2500);
	};

	const copyText = async (params: {
		value: string;
		target: 'bio' | 'share';
		successMessage: string;
		errorMessage: string;
	}) => {
		if (!params.value) return;

		try {
			if (navigator?.clipboard?.writeText) {
				await navigator.clipboard.writeText(params.value);
			} else {
				const temp = document.createElement('textarea');
				temp.value = params.value;
				temp.setAttribute('readonly', 'true');
				temp.style.position = 'absolute';
				temp.style.left = '-9999px';
				document.body.appendChild(temp);
				temp.select();
				document.execCommand('copy');
				document.body.removeChild(temp);
			}

			flashMessage(params.target, params.successMessage);
		} catch (err) {
			console.error('Copy text error:', err);
			flashMessage(params.target, params.errorMessage);
		}
	};

	const copyBioLink = async () => {
		await copyText({
			value: bioLink,
			target: 'bio',
			successMessage: 'Link bio berhasil disalin.',
			errorMessage: 'Gagal menyalin link bio.'
		});
	};

	const copyShareLink = async () => {
		await copyText({
			value: shareLink,
			target: 'share',
			successMessage: 'Link berhasil disalin.',
			errorMessage: 'Gagal menyalin link. Silakan salin manual.'
		});
	};

	const shareNative = async (params: {
		title: string;
		text: string;
		url: string;
		target: 'bio' | 'share';
	}) => {
		if (!canNativeShare || !params.url || typeof navigator?.share !== 'function') return;

		try {
			await navigator.share({
				title: params.title,
				text: params.text,
				url: params.url
			});
		} catch (err) {
			if ((err as DOMException)?.name === 'AbortError') return;
			console.error('Native share error:', err);
			flashMessage(params.target, 'Gagal membuka menu bagikan.');
		}
	};

	const shareBioLink = async () => {
		await shareNative({
			title: `Profil ${profile?.username || profile?.email || 'Santri Online'}`,
			text: 'Lihat profil publik saya di Santri Online.',
			url: bioLink,
			target: 'bio'
		});
	};

	const shareOrgLink = async () => {
		await shareNative({
			title: `Pendaftaran ${org?.name || 'Lembaga'}`,
			text: shareMessage || 'Gunakan link ini untuk mendaftar ke lembaga di Santri Online.',
			url: shareLink,
			target: 'share'
		});
	};

	const toSlug = (value: string) =>
		value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-+|-+$/g, '');

	const formatOrgType = (value?: string) => {
		if (!value) return '-';
		if (value === 'tpq') return 'TPQ';
		return value;
	};

	const formatRole = (value?: string | null) => {
		if (!value) return 'Pengguna';
		if (value === 'SUPER_ADMIN') return 'Super Admin';
		return value
			.replace(/[_-]/g, ' ')
			.replace(/\b\w/g, (char) => char.toUpperCase());
	};

	const formatStatus = (value?: string | null) => {
		if (!value) return '-';
		if (value === 'active') return 'Aktif';
		if (value === 'pending') return 'Menunggu verifikasi';
		if (value === 'rejected') return 'Ditolak';
		return value;
	};

	const formatDate = (value: number) =>
		new Date(value).toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});

	const formatLongDate = (value?: number | null) =>
		value
			? new Intl.DateTimeFormat('id-ID', {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				}).format(value)
			: '-';

	const handleOrgMediaUpload = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		orgMediaError = '';
		orgMediaSuccess = '';
		uploadingOrgMedia = true;

		try {
			const form = new FormData();
			form.append('file', file);
			const uploadRes = await fetch('/api/upload', { method: 'POST', body: form });
			if (!uploadRes.ok) {
				throw new Error('Upload gagal');
			}
			const uploadData = await uploadRes.json();
			const url = typeof uploadData?.url === 'string' ? uploadData.url : '';
			if (!url) {
				throw new Error('URL tidak tersedia');
			}

			const res = await fetch('/api/org/media', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url })
			});
			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData?.error || 'Gagal menyimpan media');
			}
			const data = await res.json();
			if (data?.item) {
				orgMedia = [data.item as OrgMediaItem, ...orgMedia];
			}
			orgMediaSuccess = 'Foto lembaga berhasil ditambahkan.';
		} catch (err) {
			console.error('Upload org media error:', err);
			orgMediaError = 'Gagal mengunggah foto lembaga.';
		} finally {
			uploadingOrgMedia = false;
			if (target) target.value = '';
		}
	};

	const deleteOrgMedia = async (id: string) => {
		if (!id) return;
		if (!confirm('Hapus foto ini?')) return;
		deletingMediaId = id;
		orgMediaError = '';
		orgMediaSuccess = '';

		try {
			const res = await fetch(`/api/org/media/${id}`, { method: 'DELETE' });
			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData?.error || 'Gagal menghapus media');
			}
			orgMedia = orgMedia.filter((item) => item.id !== id);
			orgMediaSuccess = 'Foto lembaga dihapus.';
		} catch (err) {
			console.error('Delete org media error:', err);
			orgMediaError = 'Gagal menghapus foto lembaga.';
		} finally {
			deletingMediaId = null;
		}
	};

	$: if (!slugManual) {
		orgSlug = toSlug(orgName);
	}
</script>

<svelte:head>
	<title>Profil & Pengaturan</title>
</svelte:head>

<div class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#f0fdf4_48%,_#ffffff_100%)] py-6 md:py-10">
	<div class="mx-auto max-w-6xl space-y-6 px-4">
		<section class="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
			<div class="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
				<div class="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white md:p-8">
					<div class="absolute -right-20 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
					<div class="absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-cyan-200/20 blur-3xl"></div>
					<div class="relative flex flex-col gap-5 sm:flex-row sm:items-center">
						<div class="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] border border-white/20 bg-white/15 text-5xl backdrop-blur-sm">
							{profile?.gender === 'wanita' ? '👩' : '👨'}
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-xs uppercase tracking-[0.38em] text-white/70">Profil & Pengaturan</p>
							<h1 class="mt-2 break-words text-3xl font-semibold md:text-4xl">
								{profile?.username || profile?.email}
							</h1>
							<p class="mt-3 max-w-2xl text-sm leading-6 text-white/85">
								Kelola identitas akun, link publik, dan akses lembaga dari satu halaman yang nyaman dipakai di mobile maupun desktop.
							</p>
							<div class="mt-4 flex flex-wrap gap-2 text-sm">
								<span class="rounded-full border border-white/15 bg-white/15 px-3 py-1.5 backdrop-blur-sm">
									{profile?.email}
								</span>
								<span class="rounded-full border border-white/15 bg-white/15 px-3 py-1.5 backdrop-blur-sm">
									{formatRole(profile?.role)}
								</span>
								<span class="rounded-full border border-white/15 bg-white/15 px-3 py-1.5 backdrop-blur-sm">
									Bergabung {formatLongDate(profile?.createdAt)}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div class="bg-slate-50/90 p-5 md:p-6">
					<p class="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Akses Cepat</p>
					<h2 class="mt-2 text-2xl font-semibold text-slate-900">Hal yang sering dipakai</h2>
					<p class="mt-2 text-sm leading-6 text-slate-600">
						Tombol utama dibuat ringkas agar mudah dijangkau dengan satu tangan di mobile dan tetap rapi di desktop.
					</p>

					<div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
						<a
							href="/dashboard"
							class="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
						>
							<p class="text-sm font-semibold text-slate-900">Dashboard</p>
							<p class="mt-1 text-xs text-slate-500">Buka ringkasan aktivitas harian</p>
						</a>
						<a
							href="/kalender"
							class="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
						>
							<p class="text-sm font-semibold text-slate-900">Kalender</p>
							<p class="mt-1 text-xs text-slate-500">Lihat jadwal dan catatan agenda</p>
						</a>
						{#if bioLink}
							<a
								href={bioLink}
								target="_blank"
								rel="noopener"
								class="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
							>
								<p class="text-sm font-semibold text-slate-900">Profil Publik</p>
								<p class="mt-1 text-xs text-slate-500">Cek tampilan publik akun Anda</p>
							</a>
						{:else}
							<div class="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4 text-left">
								<p class="text-sm font-semibold text-slate-900">Profil Publik</p>
								<p class="mt-1 text-xs text-slate-500">Lengkapi identitas untuk membagikan profil publik</p>
							</div>
						{/if}
						<form method="POST" action="/logout" class="contents">
							<button
								type="submit"
								class="rounded-2xl border border-red-200 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
							>
								<p class="text-sm font-semibold text-red-600">Logout</p>
								<p class="mt-1 text-xs text-slate-500">Keluar aman dari akun ini</p>
							</button>
						</form>
					</div>

					{#if org}
						<div class="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
							<p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Lembaga Aktif</p>
							<p class="mt-2 text-lg font-semibold text-slate-900">{org.name}</p>
							<div class="mt-3 flex flex-wrap gap-2 text-xs">
								<span class="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
									{formatOrgType(org.type)}
								</span>
								<span class="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
									{formatStatus(org.status)}
								</span>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</section>

		{#if bioLink || shareLink}
			<section class="grid gap-4 xl:grid-cols-2">
				{#if bioLink}
					<div class="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-6">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Link Publik</p>
								<h2 class="mt-2 text-2xl font-semibold text-slate-900">Bio Profil</h2>
								<p class="mt-2 text-sm leading-6 text-slate-600">
									Bagikan halaman bio publik agar orang lain bisa melihat peran Anda di lembaga.
								</p>
							</div>
							<span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
								Siap dibagikan
							</span>
						</div>

						<div class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">URL</p>
							<p class="mt-2 break-all text-sm font-medium leading-6 text-slate-700">{bioLink}</p>
						</div>

						<div class={`mt-4 grid gap-2 ${canNativeShare ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
							<a class="btn btn-outline w-full" href={bioLink} target="_blank" rel="noopener">
								Buka Link
							</a>
							<button class="btn btn-primary w-full" type="button" on:click={copyBioLink}>
								Salin Link
							</button>
							{#if canNativeShare}
								<button class="btn btn-ghost w-full border border-slate-200" type="button" on:click={shareBioLink}>
									Bagikan
								</button>
							{/if}
						</div>

						{#if bioCopyMessage}
							<p class="mt-3 text-sm text-emerald-700">{bioCopyMessage}</p>
						{/if}
					</div>
				{/if}

				{#if shareLink}
					<div class="rounded-[28px] border border-emerald-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-6">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Link Pendaftaran</p>
								<h2 class="mt-2 text-2xl font-semibold text-slate-900">Bagikan ke {memberLabel}</h2>
								<p class="mt-2 text-sm leading-6 text-slate-600">
									Kirim link ini ke calon {memberLabel.toLowerCase()} agar mereka bisa daftar langsung ke lembaga Anda.
								</p>
							</div>
							<span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
								Lembaga aktif
							</span>
						</div>

						<div class="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
							<p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700/70">URL</p>
							<p class="mt-2 break-all text-sm font-medium leading-6 text-emerald-900">{shareLink}</p>
						</div>

						<div class="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
							<a class="btn btn-outline w-full" href={shareLink} target="_blank" rel="noopener noreferrer">
								Buka Form
							</a>
							<button class="btn btn-primary w-full" type="button" on:click={copyShareLink}>
								Salin Link
							</button>
							{#if canNativeShare}
								<button class="btn btn-ghost w-full border border-slate-200" type="button" on:click={shareOrgLink}>
									Bagikan
								</button>
							{/if}
							{#if waShareLink}
								<a class="btn btn-success w-full text-white" href={waShareLink} target="_blank" rel="noopener noreferrer">
									WhatsApp
								</a>
							{/if}
						</div>

						{#if copyMessage}
							<p class="mt-3 text-sm text-emerald-700">{copyMessage}</p>
						{/if}
					</div>
				{/if}
			</section>
		{/if}

		<div class="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
			<div class="space-y-6">
				{#if !profile?.orgId}
					<form method="POST" action="?/registerOrg" class="rounded-[28px] border border-emerald-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-6">
						<div class="flex flex-wrap items-start justify-between gap-4">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Koneksi Lembaga</p>
								<h2 class="mt-2 text-2xl font-semibold text-slate-900">Lengkapi Data Lembaga</h2>
								<p class="mt-2 text-sm leading-6 text-slate-600">
									Isi data lembaga agar akun Anda terhubung dan link pendaftaran bisa dibagikan dengan rapi.
								</p>
							</div>
							<span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
								Admin lembaga
							</span>
						</div>

						<div class="mt-6 grid gap-4 md:grid-cols-2">
							<div>
								<label for="org-type" class="mb-2 block text-sm font-semibold text-slate-700">Jenis lembaga</label>
								<select id="org-type" name="orgType" class="select select-bordered w-full" bind:value={orgType} required>
									<option value="tpq">TPQ</option>
								</select>
							</div>
							<div>
								<label for="org-name" class="mb-2 block text-sm font-semibold text-slate-700">Nama lembaga</label>
								<input id="org-name" name="orgName" class="input input-bordered w-full" bind:value={orgName} required />
							</div>
							<div>
								<label for="org-slug" class="mb-2 block text-sm font-semibold text-slate-700">Slug publik</label>
								<input
									id="org-slug"
									name="orgSlug"
									class="input input-bordered w-full"
									placeholder="contoh: al-ikhlas"
									bind:value={orgSlug}
									on:input={() => {
										slugManual = true;
									}}
								/>
								<p class="mt-1 text-xs text-slate-500">Opsional. Kalau kosong, slug dibuat otomatis dari nama lembaga.</p>
							</div>
							<div>
								<label for="org-phone" class="mb-2 block text-sm font-semibold text-slate-700">Kontak WA/HP</label>
								<input id="org-phone" name="orgPhone" class="input input-bordered w-full" bind:value={orgPhone} placeholder="+62812xxxx" />
							</div>
							<div class="md:col-span-2">
								<OrgLocationFields />
							</div>
						</div>

						<div class="my-6 border-t border-dashed border-slate-200 pt-6">
							<h3 class="text-lg font-semibold text-slate-900">Akun admin lembaga</h3>
							<p class="mt-1 text-sm text-slate-600">
								Nama admin bisa Anda atur langsung, sementara email mengikuti akun yang sedang login.
							</p>
						</div>

						<div class="grid gap-4 md:grid-cols-2">
							<div>
								<label for="admin-name" class="mb-2 block text-sm font-semibold text-slate-700">Nama admin</label>
								<input id="admin-name" name="adminName" class="input input-bordered w-full" bind:value={adminName} required />
							</div>
							<div>
								<label for="admin-email" class="mb-2 block text-sm font-semibold text-slate-700">Email admin</label>
								<input id="admin-email" name="adminEmail" class="input input-bordered w-full bg-slate-50" value={adminEmail} readonly />
							</div>
						</div>

						{#if form?.success && form?.type === 'org'}
							<div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
								{form.message}
							</div>
						{:else if form?.message && form?.type === 'org'}
							<div class="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
								{form.message}
							</div>
						{/if}

						<button type="submit" class="btn mt-6 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700">
							Simpan Data Lembaga
						</button>
					</form>
				{:else if org}
					<div class="rounded-[28px] border border-emerald-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-6">
						<div class="flex flex-wrap items-start justify-between gap-4">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Lembaga Aktif</p>
								<h2 class="mt-2 text-2xl font-semibold text-slate-900">Lembaga Terdaftar</h2>
								<p class="mt-2 text-sm leading-6 text-slate-600">
									Akun Anda saat ini sudah terhubung ke lembaga berikut dan siap menerima pendaftaran dari link publik.
								</p>
							</div>
							<div class="rounded-2xl bg-emerald-50 px-4 py-3 text-left sm:text-right">
								<p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700/70">Status</p>
								<p class="mt-1 text-sm font-semibold text-emerald-900">{formatStatus(org.status)}</p>
							</div>
						</div>

						<div class="mt-6 grid gap-3 sm:grid-cols-2">
							<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Nama</p>
								<p class="mt-2 text-sm font-semibold text-slate-900">{org.name}</p>
							</div>
							<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Tipe</p>
								<p class="mt-2 text-sm font-semibold text-slate-900">{formatOrgType(org.type)}</p>
							</div>
							<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Slug</p>
								<p class="mt-2 break-all text-sm font-semibold text-slate-900">/{org.slug}</p>
							</div>
							<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Dibuat</p>
								<p class="mt-2 text-sm font-semibold text-slate-900">{formatLongDate(org.createdAt)}</p>
							</div>
						</div>

						<div class="mt-6 flex flex-col gap-2 sm:flex-row">
							{#if orgPublicUrl}
								<a
									href={orgPublicUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="btn btn-outline w-full sm:w-auto"
								>
									Buka Halaman Publik
								</a>
							{/if}
							{#if shareLink}
								<a
									href={shareLink}
									target="_blank"
									rel="noopener noreferrer"
									class="btn btn-ghost w-full border border-slate-200 sm:w-auto"
								>
									Buka Form Daftar
								</a>
							{/if}
						</div>
					</div>
				{/if}

				{#if org && canManageOrgMedia}
					<div class="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-6">
						<div class="flex flex-wrap items-start justify-between gap-4">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Galeri Publik</p>
								<h2 class="mt-2 text-2xl font-semibold text-slate-900">Foto Lembaga</h2>
								<p class="mt-2 text-sm leading-6 text-slate-600">
									Foto terbaru akan membantu halaman lembaga terlihat lebih hidup dan otomatis dipakai sebagai thumbnail listing.
								</p>
							</div>
							<div class="flex w-full items-center gap-3 sm:w-auto">
								<button
									type="button"
									class="btn btn-outline w-full sm:w-auto"
									disabled={uploadingOrgMedia}
									on:click={() => orgMediaInput?.click()}
								>
									{uploadingOrgMedia ? 'Mengunggah...' : 'Upload Foto'}
								</button>
								<input
									class="hidden"
									type="file"
									accept="image/*"
									on:change={handleOrgMediaUpload}
									bind:this={orgMediaInput}
								/>
							</div>
						</div>

						{#if orgMediaError}
							<div class="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
								{orgMediaError}
							</div>
						{:else if orgMediaSuccess}
							<div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
								{orgMediaSuccess}
							</div>
						{/if}

						{#if orgMedia.length === 0}
							<div class="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
								Belum ada foto lembaga. Upload foto agar halaman publik tampil lebih meyakinkan.
							</div>
						{:else}
							<div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
								{#each orgMedia as item}
									<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
										<div class="aspect-video bg-slate-100">
											<img src={item.url} alt="Foto lembaga" class="h-full w-full object-cover" loading="lazy" />
										</div>
										<div class="flex items-center justify-between gap-3 px-3 py-3 text-xs text-slate-500">
											<span>{formatDate(item.createdAt)}</span>
											<button
												type="button"
												class="btn btn-xs btn-ghost text-red-600"
												on:click={() => deleteOrgMedia(item.id)}
												disabled={deletingMediaId === item.id}
											>
												{deletingMediaId === item.id ? 'Menghapus...' : 'Hapus'}
											</button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="space-y-6">
				<form method="POST" action="?/updateProfile" class="rounded-[28px] border border-blue-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-6">
					<div class="flex items-start justify-between gap-4">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Akun</p>
							<h2 class="mt-2 text-2xl font-semibold text-slate-900">Ubah Profil</h2>
							<p class="mt-2 text-sm leading-6 text-slate-600">Atur nama, gender, dan username yang tampil di halaman publik.</p>
						</div>
					</div>

					<div class="mt-6 space-y-4">
						<div>
							<label for="profile-email" class="mb-2 block text-sm font-semibold text-slate-700">Email</label>
							<input id="profile-email" class="input input-bordered w-full bg-slate-50" value={profile?.email} readonly />
						</div>

						<div>
							<label for="profile-name" class="mb-2 block text-sm font-semibold text-slate-700">Nama lengkap</label>
							<input id="profile-name" name="displayName" class="input input-bordered w-full" value={profile?.username ?? ''} placeholder="Masukkan nama lengkap" />
						</div>

						<div>
							<label for="profile-gender" class="mb-2 block text-sm font-semibold text-slate-700">Jenis kelamin</label>
							<select id="profile-gender" name="gender" class="select select-bordered w-full" value={profile?.gender || ''}>
								<option value="">Pilih jenis kelamin</option>
								<option value="pria">Laki-laki</option>
								<option value="wanita">Perempuan</option>
							</select>
						</div>

						<div>
							<label for="profile-username" class="mb-2 block text-sm font-semibold text-slate-700">Username publik</label>
							<input id="profile-username" name="handle" class="input input-bordered w-full" value={profile?.id ?? ''} placeholder="username_unik" />
							<p class="mt-1 text-xs text-slate-500">Gunakan huruf, angka, titik, strip, atau underscore.</p>
						</div>

						{#if form?.success && form?.type === undefined}
							<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
								Profil berhasil diperbarui.
							</div>
						{:else if form?.message && form?.type === undefined}
							<div class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
								{form.message}
							</div>
						{/if}

						<button type="submit" class="btn w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700">
							Simpan Profil
						</button>
					</div>
				</form>

				<form method="POST" action="?/updateWhatsapp" class="rounded-[28px] border border-emerald-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-6">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Kontak</p>
						<h2 class="mt-2 text-2xl font-semibold text-slate-900">Nomor WhatsApp</h2>
						<p class="mt-2 text-sm leading-6 text-slate-600">Gunakan nomor aktif agar pengingat dan komunikasi lebih mudah.</p>
					</div>

					<div class="mt-6 space-y-4">
						<div>
							<label for="profile-whatsapp" class="mb-2 block text-sm font-semibold text-slate-700">Nomor WhatsApp</label>
							<input
								id="profile-whatsapp"
								name="whatsapp"
								type="tel"
								inputmode="tel"
								placeholder="Contoh 087854545274"
								class="input input-bordered w-full"
								value={profile?.whatsapp ?? ''}
								required
							/>
							<p class="mt-1 text-xs text-slate-500">Angka saja, 9-15 digit. Boleh diawali +62.</p>
						</div>

						{#if form?.success && form?.type === 'whatsapp'}
							<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
								Nomor WhatsApp tersimpan.
							</div>
						{:else if form?.message && form?.type === 'whatsapp'}
							<div class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
								{form.message}
							</div>
						{/if}

						<button type="submit" class="btn w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700">
							Simpan Nomor
						</button>
					</div>
				</form>

				<form method="POST" action="?/updatePassword" class="rounded-[28px] border border-purple-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-6">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Keamanan</p>
						<h2 class="mt-2 text-2xl font-semibold text-slate-900">Ubah Password</h2>
						<p class="mt-2 text-sm leading-6 text-slate-600">Gunakan kombinasi yang kuat agar akun tetap aman di semua perangkat.</p>
					</div>

					<div class="mt-6 space-y-4">
						<div>
							<label for="password-new" class="mb-2 block text-sm font-semibold text-slate-700">Password baru</label>
							<input id="password-new" name="password" type="password" class="input input-bordered w-full" required minlength="6" placeholder="Masukkan password baru" />
						</div>

						<div>
							<label for="password-confirm" class="mb-2 block text-sm font-semibold text-slate-700">Konfirmasi password</label>
							<input id="password-confirm" name="confirm" type="password" class="input input-bordered w-full" required minlength="6" placeholder="Ulangi password baru" />
						</div>

						{#if form?.success && form?.type === 'password'}
							<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
								Password berhasil diperbarui.
							</div>
						{:else if form?.message && form?.type === 'password'}
							<div class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
								{form.message}
							</div>
						{/if}

						<button type="submit" class="btn w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700">
							Simpan Password
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
