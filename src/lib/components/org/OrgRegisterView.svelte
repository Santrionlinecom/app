<script lang="ts">
	export let title = '';
	export let typePath = '';
	export let form;

	let orgName = '';
	let orgSlug = '';
	let slugManual = false;

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
</script>

<section class="max-w-3xl mx-auto py-10 px-4 space-y-6">
	<header class="space-y-2 text-center">
		<p class="text-sm uppercase tracking-[0.3em] text-emerald-500">Pendaftaran Lembaga</p>
		<h1 class="text-3xl md:text-4xl font-bold text-slate-900">Daftarkan {title}</h1>
		<p class="text-slate-600">Lembaga akan tampil di listing setelah disetujui admin sistem.</p>
	</header>

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

		<div class="grid gap-4 md:grid-cols-2">
			<div class="form-control">
				<label class="label" for="orgAddress">
					<span class="label-text font-medium">Alamat</span>
				</label>
				<input id="orgAddress" name="orgAddress" class="input input-bordered" />
			</div>
			<div class="form-control">
				<label class="label" for="orgCity">
					<span class="label-text font-medium">Kota/Kabupaten</span>
				</label>
				<input id="orgCity" name="orgCity" class="input input-bordered" />
			</div>
		</div>

		<div class="form-control">
			<label class="label" for="orgPhone">
				<span class="label-text font-medium">Kontak WA/HP</span>
			</label>
			<input id="orgPhone" name="orgPhone" class="input input-bordered" placeholder="+62812xxxx" />
		</div>

		<div class="divider">Akun Admin Lembaga</div>

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

		{#if form?.error}
			<div class="alert alert-error text-sm">{form.error}</div>
		{/if}
		{#if form?.success}
			<div class="alert alert-success text-sm">{form.success}</div>
		{/if}

		<button class="btn btn-primary w-full">Daftarkan {title}</button>
	</form>

	<div class="text-center text-sm text-slate-500">
		Sudah punya lembaga? <a href={`/${typePath}`} class="text-emerald-600 hover:underline">Lihat listing</a>
	</div>
</section>
