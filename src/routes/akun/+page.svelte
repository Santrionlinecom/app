<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import OrgLocationFields from '$lib/components/org/OrgLocationFields.svelte';
	export let data: PageData;
	export let form: ActionData;

	const profile = data.profile;
	const org = data.org;
	const orgMediaRoles = new Set(['admin', 'ustadz', 'ustadzah', 'tamir', 'bendahara']);
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

	let orgType = 'pondok';
	let orgName = '';
	let orgSlug = '';
	let orgPhone = '';
	let adminName = profile?.username ?? '';
	const adminEmail = profile?.email ?? '';
	let slugManual = false;
	let copyMessage = '';

	const baseUrl = 'https://app.santrionline.com';
	const memberLabelByType: Record<string, string> = {
		pondok: 'Santri',
		masjid: 'Jamaah',
		musholla: 'Jamaah',
		tpq: 'Santri',
		'rumah-tahfidz': 'Santri'
	};
	$: memberLabel = org ? memberLabelByType[org.type] ?? 'Anggota' : 'Anggota';
	$: shareLink = org ? `${baseUrl}/${org.type}/${org.slug}/daftar?ref=anggota` : '';

	const copyShareLink = async () => {
		if (!shareLink) return;
		copyMessage = '';
		try {
			if (navigator?.clipboard?.writeText) {
				await navigator.clipboard.writeText(shareLink);
			} else {
				const temp = document.createElement('textarea');
				temp.value = shareLink;
				temp.setAttribute('readonly', 'true');
				temp.style.position = 'absolute';
				temp.style.left = '-9999px';
				document.body.appendChild(temp);
				temp.select();
				document.execCommand('copy');
				document.body.removeChild(temp);
			}
			copyMessage = 'Link berhasil disalin.';
		} catch (err) {
			console.error('Copy link error:', err);
			copyMessage = 'Gagal menyalin link. Silakan salin manual.';
		} finally {
			setTimeout(() => {
				copyMessage = '';
			}, 2500);
		}
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
		if (value === 'rumah-tahfidz') return 'Rumah Tahfidz';
		return value.charAt(0).toUpperCase() + value.slice(1);
	};

	const formatDate = (value: number) =>
		new Date(value).toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});

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

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
	<div class="mx-auto max-w-4xl px-4">
		<!-- Hero Profile -->
		<div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl mb-8">
			<div class="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"></div>
			<div class="relative z-10 flex items-center gap-6">
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-5xl">
					{profile?.gender === 'wanita' ? '👩' : '👨'}
				</div>
				<div>
					<h1 class="text-4xl font-bold mb-2">{profile?.username || profile?.email}</h1>
					<div class="flex flex-wrap gap-3">
						<span class="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 text-sm">
							📧 {profile?.email}
						</span>
						<span class="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 text-sm">
							👤 {profile?.role || 'santri'}
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Forms Grid -->
		<div class="grid gap-6 lg:grid-cols-2">
			{#if !profile?.orgId}
				<form method="POST" action="?/registerOrg" class="rounded-3xl border-2 border-emerald-200 bg-white p-6 shadow-xl lg:col-span-2">
					<div class="flex items-center gap-3 mb-6">
						<span class="text-4xl">🏛️</span>
						<div>
							<h2 class="text-2xl font-bold text-gray-900">Lengkapi Data Lembaga</h2>
							<p class="text-sm text-gray-600">Isi data lembaga agar akun Anda terhubung.</p>
						</div>
					</div>

					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<label for="org-type" class="block text-sm font-semibold text-gray-700 mb-2">🏷️ Jenis Lembaga</label>
							<select id="org-type" name="orgType" class="select select-bordered w-full" bind:value={orgType} required>
								<option value="pondok">Pondok</option>
								<option value="masjid">Masjid</option>
								<option value="musholla">Musholla</option>
								<option value="tpq">TPQ</option>
								<option value="rumah-tahfidz">Rumah Tahfidz</option>
							</select>
						</div>
						<div>
							<label for="org-name" class="block text-sm font-semibold text-gray-700 mb-2">🕌 Nama Lembaga</label>
							<input id="org-name" name="orgName" class="input input-bordered w-full" bind:value={orgName} required />
						</div>
						<div>
							<label for="org-slug" class="block text-sm font-semibold text-gray-700 mb-2">🔗 Slug (opsional)</label>
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
						</div>
						<div>
							<label for="org-phone" class="block text-sm font-semibold text-gray-700 mb-2">📞 Kontak WA/HP</label>
							<input id="org-phone" name="orgPhone" class="input input-bordered w-full" bind:value={orgPhone} placeholder="+62812xxxx" />
						</div>
						<div class="md:col-span-2">
							<OrgLocationFields />
						</div>
					</div>

					<div class="divider my-6">Akun Admin Lembaga</div>

					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<label for="admin-name" class="block text-sm font-semibold text-gray-700 mb-2">👤 Nama Admin</label>
							<input id="admin-name" name="adminName" class="input input-bordered w-full" bind:value={adminName} required />
						</div>
						<div>
							<label for="admin-email" class="block text-sm font-semibold text-gray-700 mb-2">📧 Email Admin</label>
							<input id="admin-email" name="adminEmail" class="input input-bordered w-full bg-gray-50" value={adminEmail} readonly />
						</div>
					</div>

					{#if form?.success && form?.type === 'org'}
						<div class="mt-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
							<p class="text-green-800 font-semibold">✅ {form.message}</p>
						</div>
					{:else if form?.message && form?.type === 'org'}
						<div class="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
							<p class="text-red-800">❌ {form.message}</p>
						</div>
					{/if}

					<button type="submit" class="btn mt-6 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg">
						✅ Simpan Data Lembaga
					</button>
				</form>
			{:else if org}
				<div class="rounded-3xl border-2 border-emerald-200 bg-white p-6 shadow-xl lg:col-span-2">
					<div class="flex items-center gap-3 mb-4">
						<span class="text-4xl">🏛️</span>
						<div>
							<h2 class="text-2xl font-bold text-gray-900">Lembaga Terdaftar</h2>
							<p class="text-sm text-gray-600">Akun Anda sudah terhubung dengan lembaga berikut.</p>
						</div>
					</div>
					<div class="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
						<div>
							<p class="font-semibold">Nama</p>
							<p>{org.name}</p>
						</div>
						<div>
							<p class="font-semibold">Tipe</p>
							<p>{formatOrgType(org.type)}</p>
						</div>
						<div>
							<p class="font-semibold">Slug</p>
							<p>/{org.slug}</p>
						</div>
						<div>
							<p class="font-semibold">Status</p>
							<p>{org.status}</p>
						</div>
					</div>
					{#if shareLink}
						<div class="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
							<p class="text-sm text-emerald-800 font-semibold">
								Untuk {memberLabel.toLowerCase()} yang ingin mendaftar ke {org.slug} anda berikan link ini ke mereka.
							</p>
							<div class="mt-3 space-y-2">
								<a href={shareLink} class="text-xs text-emerald-700 underline break-all" target="_blank" rel="noreferrer">
									{shareLink}
								</a>
								<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
									<input class="input input-bordered w-full text-xs" value={shareLink} readonly />
									<button type="button" class="btn btn-sm btn-outline" on:click={copyShareLink}>Copy Link</button>
								</div>
								{#if copyMessage}
									<p class="text-xs text-emerald-700">{copyMessage}</p>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			{#if org && canManageOrgMedia}
				<div class="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-xl lg:col-span-2">
					<div class="flex flex-wrap items-start justify-between gap-4">
						<div>
							<h2 class="text-2xl font-bold text-gray-900">Galeri Lembaga</h2>
							<p class="text-sm text-gray-600">
								Foto terbaru otomatis jadi thumbnail di listing lembaga.
							</p>
						</div>
						<div class="flex items-center gap-3">
							<button
								type="button"
								class="btn btn-sm btn-outline"
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
						<div class="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl text-sm text-red-800">
							{orgMediaError}
						</div>
					{:else if orgMediaSuccess}
						<div class="mt-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl text-sm text-green-800">
							{orgMediaSuccess}
						</div>
					{/if}

					{#if orgMedia.length === 0}
						<div class="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
							Belum ada foto lembaga. Upload foto untuk ditampilkan di halaman publik.
						</div>
					{:else}
						<div class="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{#each orgMedia as item}
								<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
									<div class="aspect-video bg-slate-100">
										<img src={item.url} alt="Foto lembaga" class="h-full w-full object-cover" loading="lazy" />
									</div>
									<div class="flex items-center justify-between gap-3 px-3 py-2 text-xs text-slate-500">
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

			<!-- Update Profile -->
			<form method="POST" action="?/updateProfile" class="rounded-3xl border-2 border-blue-200 bg-white p-6 shadow-xl">
				<div class="flex items-center gap-3 mb-6">
					<span class="text-4xl">✏️</span>
					<div>
						<h2 class="text-2xl font-bold text-gray-900">Ubah Profil</h2>
						<p class="text-sm text-gray-600">Atur nama dan informasi pribadi</p>
					</div>
				</div>

				<div class="space-y-4">
					<div>
						<label for="profile-email" class="block text-sm font-semibold text-gray-700 mb-2">📧 Email</label>
						<input id="profile-email" class="input input-bordered w-full bg-gray-50" value={profile?.email} readonly />
					</div>

					<div>
						<label for="profile-name" class="block text-sm font-semibold text-gray-700 mb-2">👤 Nama Lengkap</label>
						<input id="profile-name" name="displayName" class="input input-bordered w-full" value={profile?.username ?? ''} placeholder="Masukkan nama lengkap" />
					</div>

					<div>
						<label for="profile-gender" class="block text-sm font-semibold text-gray-700 mb-2">⚧️ Jenis Kelamin</label>
						<select id="profile-gender" name="gender" class="select select-bordered w-full" value={profile?.gender || ''}>
							<option value="">Pilih jenis kelamin</option>
							<option value="pria">👨 Laki-laki</option>
							<option value="wanita">👩 Perempuan</option>
						</select>
					</div>

					<div>
						<label for="profile-username" class="block text-sm font-semibold text-gray-700 mb-2">🆔 Username</label>
						<input id="profile-username" name="handle" class="input input-bordered w-full" value={profile?.id ?? ''} placeholder="username_unik" />
						<p class="text-xs text-gray-500 mt-1">Gunakan huruf, angka, atau underscore</p>
					</div>

					{#if form?.success && form?.type === undefined}
						<div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
							<p class="text-green-800 font-semibold">✅ Profil berhasil diperbarui!</p>
						</div>
					{:else if form?.message && form?.type === undefined}
						<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
							<p class="text-red-800">❌ {form.message}</p>
						</div>
					{/if}

					<button type="submit" class="btn w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg">
						💾 Simpan Profil
					</button>
				</div>
			</form>

			<!-- Update Password -->
			<form method="POST" action="?/updatePassword" class="rounded-3xl border-2 border-purple-200 bg-white p-6 shadow-xl">
				<div class="flex items-center gap-3 mb-6">
					<span class="text-4xl">🔒</span>
					<div>
						<h2 class="text-2xl font-bold text-gray-900">Ubah Password</h2>
						<p class="text-sm text-gray-600">Minimal 6 karakter untuk keamanan</p>
					</div>
				</div>

				<div class="space-y-4">
					<div>
						<label for="password-new" class="block text-sm font-semibold text-gray-700 mb-2">🔑 Password Baru</label>
						<input id="password-new" name="password" type="password" class="input input-bordered w-full" required minlength="6" placeholder="Masukkan password baru" />
					</div>

					<div>
						<label for="password-confirm" class="block text-sm font-semibold text-gray-700 mb-2">✅ Konfirmasi Password</label>
						<input id="password-confirm" name="confirm" type="password" class="input input-bordered w-full" required minlength="6" placeholder="Ulangi password baru" />
					</div>

					{#if form?.success && form?.type === 'password'}
						<div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
							<p class="text-green-800 font-semibold">✅ Password berhasil diperbarui!</p>
						</div>
					{:else if form?.message && form?.type === 'password'}
						<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
							<p class="text-red-800">❌ {form.message}</p>
						</div>
					{/if}

					<button type="submit" class="btn w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg">
						🔐 Simpan Password
					</button>
				</div>
			</form>

			<!-- Update WhatsApp -->
			<form method="POST" action="?/updateWhatsapp" class="rounded-3xl border-2 border-emerald-200 bg-white p-6 shadow-xl">
				<div class="flex items-center gap-3 mb-6">
					<span class="text-4xl">📱</span>
					<div>
						<h2 class="text-2xl font-bold text-gray-900">Nomor WhatsApp</h2>
						<p class="text-sm text-gray-600">Gunakan nomor aktif untuk pengingat</p>
					</div>
				</div>

				<div class="space-y-4">
					<div>
						<label for="profile-whatsapp" class="block text-sm font-semibold text-gray-700 mb-2">📲 Nomor WhatsApp</label>
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
						<p class="text-xs text-gray-500 mt-1">Angka saja, 9-15 digit (boleh diawali +62)</p>
					</div>

					{#if form?.success && form?.type === 'whatsapp'}
						<div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
							<p class="text-green-800 font-semibold">✅ Nomor WhatsApp tersimpan!</p>
						</div>
					{:else if form?.message && form?.type === 'whatsapp'}
						<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
							<p class="text-red-800">❌ {form.message}</p>
						</div>
					{/if}

					<button type="submit" class="btn w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg">
						💾 Simpan Nomor
					</button>
				</div>
			</form>
		</div>

		<!-- Quick Actions -->
		<div class="mt-8 grid gap-4 md:grid-cols-3">
			<a href="/dashboard" class="rounded-2xl border-2 border-blue-200 bg-white p-6 text-center hover:shadow-lg transition">
				<span class="text-4xl mb-2 block">📊</span>
				<h3 class="font-bold text-gray-900">Dashboard</h3>
				<p class="text-sm text-gray-600">Lihat progres hafalan</p>
			</a>
			<a href="/kalender" class="rounded-2xl border-2 border-purple-200 bg-white p-6 text-center hover:shadow-lg transition">
				<span class="text-4xl mb-2 block">📅</span>
				<h3 class="font-bold text-gray-900">Kalender</h3>
				<p class="text-sm text-gray-600">Jadwal & catatan</p>
			</a>
			<form method="POST" action="/logout" class="rounded-2xl border-2 border-red-200 bg-white p-6 text-center hover:shadow-lg transition">
				<button type="submit" class="w-full">
					<span class="text-4xl mb-2 block">🚪</span>
					<h3 class="font-bold text-red-600">Logout</h3>
					<p class="text-sm text-gray-600">Keluar dari akun</p>
				</button>
			</form>
		</div>
	</div>
</div>
