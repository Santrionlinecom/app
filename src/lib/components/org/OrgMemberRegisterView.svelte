<script lang="ts">
	import { onMount } from 'svelte';

	export let org;
	export let roles: Array<{ value: string; label: string }> = [];
	export let lockedRole: { value: string; label: string } | null = null;
	export let form;

	const encodeValue = (value: string) => encodeURIComponent(value);
	$: googleHref =
		lockedRole && org?.slug && org?.type
			? `/auth/google?mode=member&orgType=${encodeValue(org.type)}&orgSlug=${encodeValue(org.slug)}&role=${encodeValue(lockedRole.value)}`
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

		<div class="form-control">
			<label class="label" for="role">
				<span class="label-text font-medium">Peran</span>
			</label>
			{#if lockedRole}
				<input type="hidden" name="role" value={lockedRole.value} />
				<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
					<p class="font-semibold">{lockedRole.label}</p>
					<p class="text-xs text-emerald-700">Peran otomatis dari link pendaftaran.</p>
				</div>
			{:else}
				<select id="role" name="role" class="select select-bordered" required>
					{#each roles as role}
						<option value={role.value}>{role.label}</option>
					{/each}
				</select>
			{/if}
		</div>

		{#if form?.error}
			<div class="alert alert-error text-sm">{form.error}</div>
		{/if}

	<button class="btn btn-primary w-full">Daftar Anggota</button>

	{#if lockedRole && googleHref}
		<div class="pt-4 text-center text-xs text-slate-500">atau</div>
		<a href={googleHref} class="btn btn-outline w-full">Daftar dengan Google</a>
	{/if}
</form>
</section>
