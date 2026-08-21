<script lang="ts">
	import { page } from '$app/stores';
	import {
		ArrowRight,
		CheckCircle2,
		LockKeyhole,
		Mail,
		MapPin,
		ShieldCheck,
		UserRound
	} from '@lucide/svelte';
	import GoogleAuthButton from '$lib/components/GoogleAuthButton.svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import OrgLocationFields from '$lib/components/org/OrgLocationFields.svelte';

	export let title = '';
	export let typePath = '';
	export let form;

	type FieldName = 'orgName' | 'adminName' | 'adminEmail' | 'adminPassword';

	let orgName = '';
	let orgSlug = '';
	let orgPhone = '';
	let adminName = '';
	let adminEmail = '';
	let adminPassword = '';
	let slugManual = false;
	let touched: Record<FieldName, boolean> = {
		orgName: false,
		adminName: false,
		adminEmail: false,
		adminPassword: false
	};

	const featureMap: Record<string, { title: string; items: string[]; note: string }> = {
		tpq: {
			title: 'Fitur TPQ aktif',
			items: ['Dashboard akademik TPQ', 'Kelola santri dan ustadz', 'Setoran hafalan', 'Rapor dan sertifikat'],
			note: 'Cocok untuk alur kelas, hafalan, dan laporan perkembangan santri.'
		},
		pondok: {
			title: 'Fitur pondok aktif',
			items: ['Data santri dan ustadz', 'Materi diniyah', 'Halaqah tahfidz', 'Agenda lembaga'],
			note: 'Pondok memakai fondasi pendidikan untuk pembinaan harian dan tahfidz.'
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
			items: ['Halaqah hafalan', 'Target setoran', 'Evaluasi tahfidz', 'Rapor hafalan'],
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

	const markTouched = (field: FieldName) => {
		touched = { ...touched, [field]: true };
	};

	const markSubmitTouched = () => {
		touched = {
			orgName: true,
			adminName: !isLoggedIn,
			adminEmail: !isLoggedIn,
			adminPassword: !isLoggedIn
		};
	};

	const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

	$: if (!slugManual) {
		orgSlug = toSlug(orgName);
	}

	$: currentUser = $page.data?.user ?? null;
	$: isLoggedIn = !!currentUser;

	// Persetujuan PDP. Bawaannya false — pengguna harus mencentang sendiri.
	let setujuKebijakan = false;
	$: featureInfo = featureMap[typePath] ?? featureMap.tpq;
	$: orgNameError = touched.orgName && !orgName.trim() ? 'Nama lembaga wajib diisi.' : '';
	$: adminNameError =
		!isLoggedIn && touched.adminName && !adminName.trim() ? 'Nama admin lembaga wajib diisi.' : '';
	$: adminEmailError =
		!isLoggedIn && touched.adminEmail
			? !adminEmail.trim()
				? 'Email admin wajib diisi.'
				: !isEmail(adminEmail)
					? 'Email admin harus memakai format yang benar.'
					: ''
			: '';
	$: adminPasswordError =
		!isLoggedIn && touched.adminPassword
			? !adminPassword
				? 'Password admin wajib diisi.'
				: adminPassword.length < 6
					? 'Password admin minimal 6 karakter.'
					: ''
			: '';
	$: serverError =
		form?.error === 'Semua kolom wajib diisi.'
			? 'Periksa nama lembaga, nama admin, email admin, dan password admin. Semua bagian wajib diisi.'
			: form?.error;

	const fieldClass =
		'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-800 focus:ring-4 focus:ring-emerald-800/12';
</script>

<section class="register-shell bg-[#f6f7f3] text-slate-900">
	<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
		<header class="max-w-3xl">
			<p class="text-xs font-bold uppercase text-emerald-800">Pendaftaran Lembaga</p>
			<h1 class="mt-2 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">Daftarkan {title}</h1>
			<p class="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
				Isi data dasar lembaga dan akun admin. Setelah berhasil, pengurus dapat melengkapi profil dan fitur dari dashboard.
			</p>
		</header>

		<ol class="mt-6 grid grid-cols-2 gap-2 sm:hidden" aria-label="Progress pendaftaran">
			<li class="rounded-2xl bg-emerald-950 px-3 py-3 text-white">
				<p class="text-[11px] font-bold uppercase text-amber-300">Langkah 1</p>
				<p class="mt-1 text-sm font-bold">Data Lembaga</p>
			</li>
			<li class="rounded-2xl border border-emerald-950/10 bg-white px-3 py-3 text-emerald-950">
				<p class="text-[11px] font-bold uppercase text-emerald-700">Langkah 2</p>
				<p class="mt-1 text-sm font-bold">Akun Admin</p>
			</li>
		</ol>

		<div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
			<form method="POST" class="register-form rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-[0_18px_55px_-38px_rgba(18,63,52,0.55)] sm:p-7">
				<section aria-labelledby="org-data-title">
					<div class="flex items-start gap-3">
						<div class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-950">
							<MapPin size={21} strokeWidth={2.1} />
						</div>
						<div>
							<h2 id="org-data-title" class="text-xl font-extrabold text-slate-900">Data Lembaga</h2>
							<p class="mt-1 text-sm leading-6 text-slate-600">Nama dan alamat membantu calon anggota menemukan lembaga yang benar.</p>
						</div>
					</div>

					<div class="mt-5 grid gap-4 md:grid-cols-2">
						<div>
							<label for="orgName" class="block text-sm font-bold text-slate-800">Nama Lembaga</label>
							<input
								id="orgName"
								name="orgName"
								class={fieldClass}
								class:mt-2={true}
								bind:value={orgName}
								required
								aria-invalid={orgNameError ? 'true' : 'false'}
								aria-describedby={orgNameError ? 'orgName-error' : undefined}
								on:blur={() => markTouched('orgName')}
							/>
							{#if orgNameError}
								<p id="orgName-error" class="mt-2 text-sm font-semibold text-red-600">{orgNameError}</p>
							{/if}
						</div>

						<div>
							<label for="orgSlug" class="block text-sm font-bold text-slate-800">Slug Halaman (opsional)</label>
							<input
								id="orgSlug"
								name="orgSlug"
								class={`${fieldClass} mt-2`}
								placeholder="contoh: al-falah"
								bind:value={orgSlug}
								on:input={() => {
									slugManual = true;
								}}
							/>
							<p class="mt-2 text-xs leading-5 text-slate-500">Dipakai untuk alamat publik lembaga. Kosongkan bila ingin dibuat otomatis.</p>
						</div>
					</div>

					<div class="mt-5 rounded-3xl border border-slate-200 bg-[#f6f7f3] p-4 sm:p-5">
						<OrgLocationFields />
					</div>

					<div class="mt-5">
						<label for="orgPhone" class="block text-sm font-bold text-slate-800">Kontak WhatsApp/HP</label>
						<input id="orgPhone" name="orgPhone" class={`${fieldClass} mt-2`} placeholder="+62812xxxx" bind:value={orgPhone} />
						<p class="mt-2 text-xs leading-5 text-slate-500">Nomor ini membantu calon santri, wali, atau jamaah menghubungi pengurus.</p>
					</div>
				</section>

				<section class="mt-8 border-t border-slate-200 pt-7" aria-labelledby="admin-account-title">
					<div class="flex items-start gap-3">
						<div class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-900">
							<UserRound size={21} strokeWidth={2.1} />
						</div>
						<div>
							<h2 id="admin-account-title" class="text-xl font-extrabold text-slate-900">Akun Admin</h2>
							<p class="mt-1 text-sm leading-6 text-slate-600">Akun ini akan menjadi pengelola awal untuk lembaga.</p>
						</div>
					</div>

					{#if isLoggedIn}
						<div class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
							Akun admin akan memakai login saat ini: <strong>{displayUser(currentUser)}</strong>.
						</div>
					{:else}
						<div class="mt-5 grid gap-4 md:grid-cols-2">
							<div>
								<label for="adminName" class="block text-sm font-bold text-slate-800">Nama Admin</label>
								<input
									id="adminName"
									name="adminName"
									class={`${fieldClass} mt-2`}
									bind:value={adminName}
									required
									aria-invalid={adminNameError ? 'true' : 'false'}
									aria-describedby={adminNameError ? 'adminName-error' : undefined}
									on:blur={() => markTouched('adminName')}
								/>
								{#if adminNameError}
									<p id="adminName-error" class="mt-2 text-sm font-semibold text-red-600">{adminNameError}</p>
								{/if}
							</div>

							<div>
								<label for="adminEmail" class="block text-sm font-bold text-slate-800">Email Admin</label>
								<div class="relative mt-2">
									<Mail class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2} />
									<input
										id="adminEmail"
										name="adminEmail"
										type="email"
										class={`${fieldClass} pl-11`}
										bind:value={adminEmail}
										required
										aria-invalid={adminEmailError ? 'true' : 'false'}
										aria-describedby={adminEmailError ? 'adminEmail-error' : undefined}
										on:blur={() => markTouched('adminEmail')}
									/>
								</div>
								{#if adminEmailError}
									<p id="adminEmail-error" class="mt-2 text-sm font-semibold text-red-600">{adminEmailError}</p>
								{/if}
							</div>
						</div>

						<div class="mt-4">
							<label for="adminPassword" class="block text-sm font-bold text-slate-800">Password Admin</label>
							<div class="relative mt-2">
								<LockKeyhole class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2} />
								<input
									id="adminPassword"
									name="adminPassword"
									type="password"
									class={`${fieldClass} pl-11`}
									minlength="6"
									bind:value={adminPassword}
									required
									aria-invalid={adminPasswordError ? 'true' : 'false'}
									aria-describedby={adminPasswordError ? 'adminPassword-error' : undefined}
									on:blur={() => markTouched('adminPassword')}
								/>
							</div>
							{#if adminPasswordError}
								<p id="adminPassword-error" class="mt-2 text-sm font-semibold text-red-600">{adminPasswordError}</p>
							{/if}
						</div>

						<div class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
							<p class="font-bold text-slate-900">Sudah punya akun?</p>
							<p class="mt-1">Masuk dengan Google agar data admin memakai akun yang sama.</p>
							<GoogleAuthButton href="/auth/google" label="Masuk dengan Google" className="mt-3" />
						</div>
					{/if}
				</section>

				{#if serverError}
					<div class="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-600">
						{serverError}
					</div>
				{/if}
				{#if form?.success}
					<div class="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-900">
						{form.success}
					</div>
				{/if}

				<div class="mt-6">
					<Turnstile siteKey={$page.data.turnstileSiteKey ?? ''} />
				</div>

				<!--
					Persetujuan Kebijakan Privasi & Syarat Ketentuan (UU 27/2022).
					Sengaja TIDAK dicentang otomatis — persetujuan yang sudah
					tercentang sejak awal bukan persetujuan.
				-->
				<label class="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
					<input
						type="checkbox"
						name="setuju_kebijakan"
						value="on"
						bind:checked={setujuKebijakan}
						required
						class="mt-0.5 h-5 w-5 shrink-0 accent-emerald-700"
					/>
					<span class="text-sm leading-6 text-slate-700">
						Saya membaca dan menyetujui
						<a href="/privacy" target="_blank" rel="noopener" class="font-bold text-emerald-800 underline">Kebijakan Privasi</a>
						dan
						<a href="/syarat" target="_blank" rel="noopener" class="font-bold text-emerald-800 underline">Syarat &amp; Ketentuan</a>
						SantriOnline, termasuk pengelolaan data akun dan data santri lembaga
						sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
					</span>
				</label>

				<button
					type="submit"
					disabled={!setujuKebijakan}
					class="group mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-800/20 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:bg-slate-300"
					on:click={markSubmitTouched}
				>
					Daftarkan {title}
					<ArrowRight size={18} strokeWidth={2.3} class="transition-transform group-hover:translate-x-0.5" />
				</button>
			</form>

			<aside class="space-y-4">
				<div class="hidden rounded-3xl border border-emerald-950/10 bg-white p-5 shadow-[0_18px_55px_-40px_rgba(18,63,52,0.5)] sm:block">
					<p class="text-xs font-bold uppercase text-emerald-800">Progress</p>
					<div class="mt-5 space-y-3">
						<div class="flex gap-3 rounded-2xl bg-emerald-950 p-4 text-white">
							<span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-300 text-sm font-extrabold text-emerald-950">1</span>
							<div>
								<p class="font-bold">Data Lembaga</p>
								<p class="mt-1 text-xs leading-5 text-emerald-50/80">Nama, alamat, dan kontak pengurus.</p>
							</div>
						</div>
						<div class="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
							<span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-sm font-extrabold text-emerald-950">2</span>
							<div>
								<p class="font-bold text-slate-900">Akun Admin</p>
								<p class="mt-1 text-xs leading-5 text-slate-500">Login awal untuk mengelola dashboard.</p>
							</div>
						</div>
					</div>
				</div>

				<div class="rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-[0_18px_55px_-40px_rgba(18,63,52,0.5)]">
					<div class="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-950 text-amber-300">
						<ShieldCheck size={24} strokeWidth={2.1} />
					</div>
					<p class="mt-5 text-xs font-bold uppercase text-emerald-800">Siap digunakan</p>
					<h2 class="mt-2 text-xl font-extrabold text-slate-900">{featureInfo.title}</h2>
					<p class="mt-3 text-sm leading-6 text-slate-600">{featureInfo.note}</p>
					<div class="mt-5 space-y-3">
						{#each featureInfo.items as item}
							<div class="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-950">
								<CheckCircle2 class="h-5 w-5 shrink-0 text-emerald-800" strokeWidth={2.2} />
								{item}
							</div>
						{/each}
					</div>
				</div>

				<a
					href={`/${typePath}`}
					class="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-emerald-950/15 bg-white px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-800/15"
				>
					Lihat halaman {title}
				</a>
			</aside>
		</div>
	</div>
</section>

<style>
	.register-form :global(.label) {
		padding: 0 0 0.5rem;
	}

	.register-form :global(.label-text) {
		font-size: 0.875rem;
		font-weight: 700;
		color: #1e293b;
	}

	.register-form :global(.input) {
		min-height: 48px;
		border-radius: 0.75rem;
		border-color: #cbd5e1;
		background: #ffffff;
		color: #0f172a;
		font-size: 0.875rem;
	}

	.register-form :global(.input:focus) {
		border-color: #065f46;
		box-shadow: 0 0 0 4px rgb(6 95 70 / 0.12);
		outline: none;
	}

	.register-form :global(.form-control) {
		min-width: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.register-shell :global(*) {
			transition-duration: 0.01ms !important;
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
		}
	}
</style>
