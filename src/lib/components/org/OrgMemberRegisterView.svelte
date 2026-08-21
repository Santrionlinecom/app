<script lang="ts">
	import GoogleAuthButton from '$lib/components/GoogleAuthButton.svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	export let org;
	export let roles: Array<{ value: string; label: string }> = [];
	export let lockedRole: { value: string; label: string } | null = null;
	export let form;

	const encodeValue = (value: string) => encodeURIComponent(value);
	let selectedRole = '';

	// Persetujuan PDP. Bawaannya false — pengguna harus mencentang sendiri.
	let setujuKebijakan = false;
	$: if (!selectedRole) {
		selectedRole = lockedRole?.value ?? roles[0]?.value ?? '';
	}
	$: selectedRoleLabel =
		lockedRole?.label ?? roles.find((role) => role.value === selectedRole)?.label ?? selectedRole;
	$: currentUser = $page.data.user as { username?: string | null; email?: string | null } | null;
	$: isLoggedIn = Boolean(currentUser);
	$: googleHref =
		selectedRole && org?.slug && org?.type
			? `/auth/google?mode=member&orgType=${encodeValue(org.type)}&orgSlug=${encodeValue(org.slug)}&role=${encodeValue(selectedRole)}`
			: '';

	onMount(() => {
		if (!org?.slug || !org?.type) return;
		const params = new URLSearchParams(window.location.search);
		const ref = params.get('ref');
		const role = params.get('role');
		const source = ref || role || 'direct';
		fetch('/api/traffic', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ orgSlug: org.slug, orgType: org.type, source })
		}).catch(() => undefined);
	});
</script>

<section class="max-w-3xl mx-auto py-10 px-4 space-y-6">
	<header class="space-y-2 text-center">
		<p class="text-sm uppercase tracking-[0.3em] text-emerald-500">Pendaftaran Anggota</p>
		<h1 class="text-3xl md:text-4xl font-bold text-slate-900">{org?.name}</h1>
		<p class="text-slate-600">Pendaftaran akan menunggu persetujuan admin lembaga.</p>
	</header>

	<form method="POST" class="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
		{#if isLoggedIn}
			<div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
				<p class="font-semibold">Daftar memakai akun yang sedang login</p>
				<p class="mt-1 text-emerald-600">{currentUser?.username || currentUser?.email}</p>
			</div>
		{:else}
			<div class="form-control">
				<label class="label" for="name">
					<span class="label-text font-medium">Nama Lengkap</span>
				</label>
				<input id="name" name="name" class="input input-bordered" required />
			</div>

			<div class="form-control">
				<label class="label" for="email">
					<span class="label-text font-medium">Email</span>
				</label>
				<input id="email" name="email" type="email" class="input input-bordered" required />
			</div>

			<div class="form-control">
				<label class="label" for="password">
					<span class="label-text font-medium">Password</span>
				</label>
				<input id="password" name="password" type="password" class="input input-bordered" minlength="6" required />
			</div>

			<div class="form-control">
				<label class="label" for="gender">
					<span class="label-text font-medium">Jenis Kelamin</span>
				</label>
				<select id="gender" name="gender" class="select select-bordered" required>
					<option value="" disabled selected>Pilih jenis kelamin</option>
					<option value="pria">Pria</option>
					<option value="wanita">Wanita</option>
				</select>
			</div>
		{/if}

		<div class="form-control">
			<label class="label" for="role">
				<span class="label-text font-medium">Peran</span>
			</label>
			{#if lockedRole}
				<input type="hidden" name="role" value={lockedRole.value} />
				<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-600">
					<p class="font-semibold">{lockedRole.label}</p>
					<p class="text-xs text-emerald-600">Peran otomatis dari link pendaftaran.</p>
				</div>
			{:else}
				<select id="role" name="role" class="select select-bordered" bind:value={selectedRole} required>
					{#each roles as role}
						<option value={role.value}>{role.label}</option>
					{/each}
				</select>
			{/if}
		</div>

		{#if form?.error}
			<div class="alert alert-error text-sm">{form.error}</div>
		{/if}

		{#if !isLoggedIn}
			<Turnstile siteKey={$page.data.turnstileSiteKey ?? ''} />
		{/if}

		{#if !isLoggedIn}
			<!--
				Persetujuan PDP. Menutup DUA jalur sekaligus: tombol daftar biasa
				dan tombol Google — keduanya dinonaktifkan sampai dicentang,
				sehingga jalur OAuth tidak bisa dipakai memintas persetujuan.
			-->
			<label class="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
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
					SantriOnline sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
					<span class="mt-1 block text-xs text-slate-500">
						Untuk santri di bawah umur, persetujuan diberikan oleh orang tua/wali.
					</span>
				</span>
			</label>
		{/if}

		<button class="btn btn-primary w-full" disabled={!isLoggedIn && !setujuKebijakan}>
			{isLoggedIn ? `Daftar sebagai ${selectedRoleLabel}` : 'Daftar Anggota'}
		</button>

		{#if !isLoggedIn && googleHref}
			<div class="pt-4 text-center text-xs text-slate-500">atau</div>
			{#if setujuKebijakan}
				<GoogleAuthButton href={googleHref} label={`Daftar sebagai ${selectedRoleLabel} dengan Google`} />
			{:else}
				<button type="button" disabled class="btn w-full cursor-not-allowed opacity-60">
					Centang persetujuan dulu untuk daftar dengan Google
				</button>
			{/if}
			<p class="text-center text-xs text-slate-500">
				Nama dan email akan diambil dari akun Google. Role mengikuti pilihan di atas.
			</p>
		{/if}
	</form>
</section>
