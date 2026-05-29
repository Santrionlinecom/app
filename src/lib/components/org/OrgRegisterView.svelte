<script lang="ts">
	import Turnstile from '$lib/components/Turnstile.svelte';
	import OrgLocationFields from '$lib/components/org/OrgLocationFields.svelte';
	import { page } from '$app/stores';

	export let title = '';
	export let typePath = '';
	export let form;

	let orgName = '';
	let orgSlug = '';
	let slugManual = false;

	const featureMap: Record<string, { title: string; items: string[]; note: string }> = {
		tpq: {
			title: 'Fitur TPQ aktif',
			items: ['Dashboard akademik TPQ', 'Kelola santri & ustadz', 'Setoran hafalan', 'Rapor dan sertifikat'],
			note: 'Cocok untuk alur kelas, hafalan, dan laporan perkembangan santri.'
		},
		pondok: {
			title: 'Fitur pondok aktif',
			items: ['Data santri dan ustadz', 'Materi diniyah', 'Halaqoh tahfidz', 'Agenda lembaga'],
			note: 'Pondok memakai fondasi pendidikan yang sama dengan modul akademik dan tahfidz.'
		},
		masjid: {
			title: 'Fitur masjid aktif',
			items: ['Data jamaah', 'Kas dan transaksi', 'Jadwal imam/khotib', 'Aset dan agenda'],
			note: 'Masjid diarahkan ke fitur komunitas, keuangan, aset, dan jadwal kegiatan.'
		},
		musholla: {
			title: 'Fitur musholla aktif',
			items: ['Data anggota', 'Kas transparan', 'Jadwal kegiatan', 'Aset musholla'],
			note: 'Musholla memakai fitur ringan untuk operasional warga dan laporan kas.'
		},
		'rumah-tahfidz': {
			title: 'Fitur rumah tahfidz aktif',
			items: ['Halaqoh hafalan', 'Target setoran', 'Evaluasi tahfidz', 'Rapor hafalan'],
			note: 'Rumah tahfidz fokus pada pemantauan hafalan dan progres santri.'
		}
	};

	const displayUser = (user: any) => user?.username || user?.email || 'Akun Anda';

	const toSlug = (value: string) =>
		value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-+|-+$/g, '');

	$: if (!slugManual) {
		orgSlug = toSlug(orgName);
	}

	$: currentUser = $page.data?.user ?? null;
	$: isLoggedIn = !!currentUser;
	$: featureInfo = featureMap[typePath] ?? featureMap.tpq;
</script>

<section class="mx-auto max-w-6xl space-y-6 px-4 py-10">
	<header class="space-y-2 text-center">
		<p class="text-sm uppercase tracking-[0.3em] text-emerald-500">Pendaftaran Lembaga</p>
		<h1 class="text-3xl md:text-4xl font-bold text-slate-900">Daftarkan {title}</h1>
		<p class="text-slate-600">Lembaga siap dibuat dan fitur akan mengikuti jenis lembaga yang dipilih.</p>
	</header>

	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
		<form method="POST" class="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
			<div class="grid gap-4 md:grid-cols-2">
				<div class="form-control">
					<label class="label" for="orgName">
						<span class="label-text font-medium">Nama Lembaga</span>
					</label>
					<input id="orgName" name="orgName" class="input input-bordered" bind:value={orgName} required />
				</div>
				<div class="form-control">
					<label class="label" for="orgSlug">
						<span class="label-text font-medium">Slug (opsional)</span>
					</label>
					<input
						id="orgSlug"
						name="orgSlug"
						class="input input-bordered"
						placeholder="contoh: al-falah"
						bind:value={orgSlug}
						on:input={() => {
							slugManual = true;
						}}
					/>
				</div>
			</div>

			<OrgLocationFields />

			<div class="form-control">
				<label class="label" for="orgPhone">
					<span class="label-text font-medium">Kontak WA/HP</span>
				</label>
				<input id="orgPhone" name="orgPhone" class="input input-bordered" placeholder="+62812xxxx" />
			</div>

			<div class="divider">Akun Admin Lembaga</div>

			{#if isLoggedIn}
				<div class="rounded-2xl border bg-emerald-50 p-4 text-sm text-emerald-900">
					Akun admin akan menggunakan login saat ini: <strong>{displayUser(currentUser)}</strong>.
				</div>
			{:else}
				<div class="grid gap-4 md:grid-cols-2">
					<div class="form-control">
						<label class="label" for="adminName">
							<span class="label-text font-medium">Nama Admin</span>
						</label>
						<input id="adminName" name="adminName" class="input input-bordered" required />
					</div>
					<div class="form-control">
						<label class="label" for="adminEmail">
							<span class="label-text font-medium">Email Admin</span>
						</label>
						<input id="adminEmail" name="adminEmail" type="email" class="input input-bordered" required />
					</div>
				</div>

				<div class="form-control">
					<label class="label" for="adminPassword">
						<span class="label-text font-medium">Password Admin</span>
					</label>
					<input id="adminPassword" name="adminPassword" type="password" class="input input-bordered" minlength="6" required />
				</div>

				<div class="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700">
					<p class="font-semibold">Sudah punya akun? Login dulu agar data admin otomatis.</p>
					<a
						href="/auth/google"
						class="btn btn-outline mt-3 w-full border-slate-300 text-slate-700 hover:bg-slate-100 normal-case"
					>
						Masuk dengan Google
					</a>
				</div>
			{/if}

			{#if form?.error}
				<div class="alert alert-error text-sm">{form.error}</div>
			{/if}
			{#if form?.success}
				<div class="alert alert-success text-sm">{form.success}</div>
			{/if}

			<Turnstile siteKey={$page.data.turnstileSiteKey ?? ''} />

			<button class="btn btn-primary w-full">Daftarkan {title}</button>
		</form>

		<aside class="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
			<p class="text-sm font-bold uppercase tracking-[0.22em] text-emerald-600">Siap Digunakan</p>
			<h2 class="mt-2 text-xl font-bold text-slate-900">{featureInfo.title}</h2>
			<p class="mt-2 text-sm leading-6 text-slate-600">{featureInfo.note}</p>
			<div class="mt-5 space-y-3">
				{#each featureInfo.items as item}
					<div class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
						{item}
					</div>
				{/each}
			</div>
		</aside>
	</div>

	<div class="text-center text-sm text-slate-500">
		Sudah punya lembaga? <a href={`/${typePath}`} class="text-emerald-600 hover:underline">Lihat listing</a>
	</div>
</section>
